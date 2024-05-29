'use strict';

import { users, gameState } from './state.js';
import { broadcast } from './utils.js';
import { BIG_BLIND, SMALL_BLIND, STREETS } from '../src/constants/constants.js';
import { sendFlopCards, sendTurnCard, sendRiverCard, showdown } from './gameStages.js';
import { closeServer } from './server.js';

export const dealCardsToUsers = () => {
    for (const user of Object.values(users)) {
        gameState.deck.dealUserCards(user);
        const message = JSON.stringify({ type: 'getHandCards', content: user.cards });
        user.ws.send(message);
    }
}

export const sendPlayingUsers = () => {
    const usersInfo = Object.values(users).map(user => ({
        id: user.id,
        username: user.username
    }));
    broadcast(JSON.stringify({ type: 'getPlayingUsers', content: usersInfo }));
}

export const sendUpdateMoney = () => {
    const usersMoney = {};
    for (const user of Object.values(users)){
        usersMoney[user.id] = user.money
    }
    broadcast(JSON.stringify({ type: 'updateMoney', content: usersMoney }));
}

export const sendUpdateBid = () => {
    const usersBid = {};
    for (const user of Object.values(users)) {
        usersBid[user.id] = user.bid;
    }
    broadcast(JSON.stringify({ type: 'updateBid', content: usersBid }))
}

export const addBidsToBank = () => {
    let money = 0;
    for (const user of Object.values(users)) {
        money += user.bid;
    }
    gameState.bank = money;
}

export const sendUpdateBank = () => {
    broadcast(JSON.stringify({ type: 'updateBank', content: gameState.bank }));
}

export const setDealer = () => {
    const usersID = Object.keys(users);
    const randomUserID = usersID[Math.floor(Math.random() * usersID.length)];
    gameState.dealerId = randomUserID;
    broadcast(JSON.stringify({ type: 'setDealer', content: randomUserID }))
}

export const doBlinds = () => {
    const usersID = Object.keys(users).map(Number);
    const dealerIndex = usersID.indexOf(Number(gameState.dealerId));

    const smallBlindIndex = (dealerIndex + 1) % usersID.length;
    const bigBlindIndex = (dealerIndex + 2) % usersID.length;
    const firstMoveIndex = (dealerIndex + 3) % usersID.length;

    applyBlind(usersID[smallBlindIndex], SMALL_BLIND);
    applyBlind(usersID[bigBlindIndex], BIG_BLIND);

    gameState.queue = usersID.slice(firstMoveIndex).concat(usersID.slice(0, firstMoveIndex));
}

const applyBlind = (userID, amount) => {
    users[userID].money -= amount;
    users[userID].bid += amount;
}

export const updatePlayerTurn = () => {
    if (gameState.queue.length === 0 || findLastPlayerStanding()) return;
    const currentUserID = gameState.queue[0];
    const message = JSON.stringify({ type: 'turn', content: [ currentUserID, users[currentUserID].username] });
    broadcast(message)
}

export const findLastPlayerStanding = () => {
    const activeUsers = Object.keys(users).filter(userID => !users[userID].hasFolded);
    if (activeUsers.length === 1) {
        const winnerID = activeUsers[0];
        users[winnerID].money += gameState.bank;
        gameState.bank = 0;
        sendUpdateMoney();
        sendUpdateBank();
        broadcast(JSON.stringify({ type: 'gameOverByFold', content: [ winnerID, users[winnerID].cards,  users[winnerID].username ] }));
        closeServer();
        return true;
    }
    return false;
}

export const processPlayerAction = (action, amount) => {
    const currentUserID = gameState.queue.shift();

    if (action === 'fold') {
        users[currentUserID].hasFolded = true;
        broadcast(JSON.stringify({ type: 'foldedUser', content: [ currentUserID, users[currentUserID].username ] }));
    } else if (action === 'call') {
        callBet(currentUserID);
    } else if (action === 'bet') {
        if (!placeBet(currentUserID, amount)) return null;
    } else {
        return null;
    }

    sendUpdateMoney();
    sendUpdateBid();
    addBidsToBank();
    sendUpdateBank();
}

const callBet = (currentUserID) => {
    const callAmount = gameState.highestBid - users[currentUserID].bid;
    if (users[currentUserID].money < callAmount) {
        users[currentUserID].bid += users[currentUserID].money;
        users[currentUserID].money = 0;
    } else {
        users[currentUserID].money -= callAmount;
        users[currentUserID].bid += callAmount;
    }
}

const placeBet = (currentUserID, amount) => {
    if (users[currentUserID].money < amount){
        const message = JSON.stringify({ type: 'betError', content: 'The bet must be less than the amount of your money' });
        users[currentUserID].ws.send(message);
        gameState.queue.unshift(currentUserID);
        updatePlayerTurn();
        return false;
    }
    if (amount + users[currentUserID].bid <= gameState.highestBid) {
        const message = JSON.stringify({ type: 'betError', content: 'The bid must be greater than the current highest bid' });
        users[currentUserID].ws.send(message);
        gameState.queue.unshift(currentUserID);
        updatePlayerTurn();
        return false;
    }
    gameState.highestBid = amount + users[currentUserID].bid;
    users[currentUserID].money -= amount;
    users[currentUserID].bid += amount;
    resetQueue(currentUserID);
    return true;
}

const resetQueue = (currentUserID) => {
    const usersID = Object.keys(users).map(Number);
    gameState.queue = usersID
        .slice(currentUserID)
        .concat(usersID.slice(0, currentUserID))
        .filter(id => !users[id].hasFolded);
}

export const proceedToNextStreet = () => {
    const currentIndex = STREETS.indexOf(gameState.currentStreet);
    gameState.currentStreet = STREETS[currentIndex + 1];
    resetQueueToDealerLeft();

    if (gameState.currentStreet === 'Showdown') {
        showdown();
    } else {
        updatePlayerTurn();
    }

    if (!gameState.isFlopCardsSent && gameState.currentStreet === 'Flop') sendFlopCards();
    if (!gameState.isTurnCardSent && gameState.currentStreet === 'Turn') sendTurnCard();
    if (!gameState.isRiverCardSent && gameState.currentStreet === 'River') sendRiverCard();
}

const resetQueueToDealerLeft = () => {
    const usersID = Object.keys(users).map(Number);
    const leftPlayerFromDealerID = getLeftPlayerFromDealer(usersID);
    gameState.queue = usersID
        .slice(leftPlayerFromDealerID)
        .concat(usersID.slice(0, leftPlayerFromDealerID))
        .filter(id => !users[id].hasFolded);
}

const getLeftPlayerFromDealer = (usersID) => {
    const dealerIndex = usersID.indexOf(Number(gameState.dealerId));
    let leftPlayerFromDealerIndex = (dealerIndex + 1) % usersID.length;

    while (users[usersID[leftPlayerFromDealerIndex]].hasFolded) {
        leftPlayerFromDealerIndex = (leftPlayerFromDealerIndex + 1) % usersID.length;
    }
    return leftPlayerFromDealerIndex;
}

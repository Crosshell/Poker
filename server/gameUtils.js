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
    const usersId = Object.keys(users);
    const randomUserId = usersId[Math.floor(Math.random() * usersId.length)];
    gameState.dealerId = randomUserId;
    broadcast(JSON.stringify({ type: 'setDealer', content: randomUserId }))
}

export const doBlinds = () => {
    const usersId = Object.keys(users).map(Number);
    const dealerIndex = usersId.indexOf(Number(gameState.dealerId));

    const smallBlindIndex = (dealerIndex + 1) % usersId.length;
    const bigBlindIndex = (dealerIndex + 2) % usersId.length;
    const firstMoveIndex = (dealerIndex + 3) % usersId.length;

    applyBlind(usersId[smallBlindIndex], SMALL_BLIND);
    applyBlind(usersId[bigBlindIndex], BIG_BLIND);

    gameState.queue = usersId.slice(firstMoveIndex).concat(usersId.slice(0, firstMoveIndex));
}

const applyBlind = (userId, amount) => {
    users[userId].money -= amount;
    users[userId].bid += amount;
}

export const updatePlayerTurn = () => {
    if (gameState.queue.length === 0 || findLastPlayerStanding()) return;
    const currentUserId = gameState.queue[0];
    const message = JSON.stringify({ type: 'turn', content: [ currentUserId, users[currentUserId].username] });
    broadcast(message)
}

export const findLastPlayerStanding = () => {
    const activeUsers = Object.keys(users).filter(id => !users[id].hasFolded);
    if (activeUsers.length === 1) {
        const winnerId = activeUsers[0];
        users[winnerId].money += gameState.bank;
        gameState.bank = 0;
        sendUpdateMoney();
        sendUpdateBank();
        broadcast(JSON.stringify({ type: 'gameOverByFold', content: [ winnerId, users[winnerId].cards,  users[winnerId].username ] }));
        closeServer();
        return true;
    }
    return false;
}

export const processPlayerAction = (action, amount) => {
    const currentUserId = gameState.queue.shift();

    if (action === 'fold') {
        users[currentUserId].hasFolded = true;
        broadcast(JSON.stringify({ type: 'foldedUser', content: [ currentUserId, users[currentUserId].username ] }));
    } else if (action === 'call') {
        callBet(currentUserId);
    } else if (action === 'bet') {
        if (!placeBet(currentUserId, amount)) return null;
    } else {
        return null;
    }

    sendUpdateMoney();
    sendUpdateBid();
    addBidsToBank();
    sendUpdateBank();
}

const callBet = (currentUserId) => {
    const callAmount = gameState.highestBid - users[currentUserId].bid;
    if (users[currentUserId].money < callAmount) {
        users[currentUserId].bid += users[currentUserId].money;
        users[currentUserId].money = 0;
    } else {
        users[currentUserId].money -= callAmount;
        users[currentUserId].bid += callAmount;
    }
}

const placeBet = (currentUserId, amount) => {
    if (users[currentUserId].money < amount){
        const message = JSON.stringify({ type: 'betError', content: 'The bet must be less than the amount of your money' });
        users[currentUserId].ws.send(message);
        gameState.queue.unshift(currentUserId);
        updatePlayerTurn();
        return false;
    }
    if (amount + users[currentUserId].bid <= gameState.highestBid) {
        const message = JSON.stringify({ type: 'betError', content: 'The bid must be greater than the current highest bid' });
        users[currentUserId].ws.send(message);
        gameState.queue.unshift(currentUserId);
        updatePlayerTurn();
        return false;
    }
    gameState.highestBid = amount + users[currentUserId].bid;
    users[currentUserId].money -= amount;
    users[currentUserId].bid += amount;
    resetQueue(currentUserId);
    return true;
}

const resetQueue = (currentUserId) => {
    const usersId = Object.keys(users).map(Number);
    gameState.queue = usersId
        .slice(currentUserId)
        .concat(usersId.slice(0, currentUserId))
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
    const usersId = Object.keys(users).map(Number);
    const leftPlayerFromDealerId = getLeftPlayerFromDealer(usersId);
    gameState.queue = usersId
        .slice(leftPlayerFromDealerId)
        .concat(usersId.slice(0, leftPlayerFromDealerId))
        .filter(id => !users[id].hasFolded);
}

const getLeftPlayerFromDealer = (usersId) => {
    const dealerIndex = usersId.indexOf(Number(gameState.dealerId));
    let leftPlayerFromDealerIndex = (dealerIndex + 1) % usersId.length;

    while (users[usersId[leftPlayerFromDealerIndex]].hasFolded) {
        leftPlayerFromDealerIndex = (leftPlayerFromDealerIndex + 1) % usersId.length;
    }
    return leftPlayerFromDealerIndex;
}

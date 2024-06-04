'use strict';

import { users, gameState } from './state.js';
import { broadcast } from './utils.js';
import { BIG_BLIND, SMALL_BLIND, STREETS } from '../src/constants/constants.js';
import { dealTableCards, showdown } from './gameStages.js';
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
    const usersId = Object.keys(users).map(Number);
    const randomUserId = usersId[Math.floor(Math.random() * usersId.length)];
    gameState.dealerId = randomUserId;
    broadcast(JSON.stringify({ type: 'setDealer', content: randomUserId }))
}

export const doBlinds = () => {
    const usersId = Object.keys(users).map(Number);
    const dealerIndex = usersId.indexOf(gameState.dealerId);

    const smallBlindIndex = (dealerIndex + 1) % usersId.length;
    const bigBlindIndex = (dealerIndex + 2) % usersId.length;

    applyBlind(usersId[smallBlindIndex], SMALL_BLIND);
    applyBlind(usersId[bigBlindIndex], BIG_BLIND);

    resetQueueFromUser(usersId[bigBlindIndex]);
}

const applyBlind = (userId, amount) => {
    users[userId].money -= amount;
    users[userId].bid += amount;
}

export const updatePlayerTurn = () => {
    if (gameState.queue.length === 0 || findLastPlayerStanding()) return;

    const currentUserId = gameState.queue[0];
    broadcast(JSON.stringify({ type: 'turn', content: [ currentUserId, users[currentUserId].username] }))
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

const callBet = (userId) => {
    const callAmount = gameState.highestBid - users[userId].bid;
    if (users[userId].money < callAmount) {
        users[userId].bid += users[userId].money;
        users[userId].money = 0;
    } else {
        users[userId].money -= callAmount;
        users[userId].bid += callAmount;
    }
}

const placeBet = (userId, amount) => {
    if (users[userId].money < amount){
        users[userId].ws.send(JSON.stringify({ type: 'betError', content: 'The bet must be less than the amount of your money' }));
        gameState.queue.unshift(userId);
        updatePlayerTurn();
        return false;
    }
    if (amount + users[userId].bid <= gameState.highestBid) {
        users[userId].ws.send(JSON.stringify({ type: 'betError', content: 'The bid must be greater than the current highest bid' }));
        gameState.queue.unshift(userId);
        updatePlayerTurn();
        return false;
    }
    gameState.highestBid = amount + users[userId].bid;
    users[userId].money -= amount;
    users[userId].bid += amount;

    resetQueueFromUser(userId);
    return true;
}

export const proceedToNextStreet = () => {
    const currentIndex = STREETS.indexOf(gameState.currentStreet);
    gameState.currentStreet = STREETS[currentIndex + 1];

    resetQueueFromUser(gameState.dealerId);

    if (gameState.currentStreet === 'Showdown') {
        showdown();
    } else {
        updatePlayerTurn();
        if (gameState.currentStreet === 'Flop') dealTableCards(3);
        if (gameState.currentStreet === 'Turn') dealTableCards(1);
        if (gameState.currentStreet === 'River') dealTableCards(1);
    }
}

const resetQueueFromUser = (UserId) => {
    const usersId = Object.keys(users).map(Number);
    const nextUserIndex = (usersId.indexOf(UserId) + 1) % usersId.length;
    gameState.queue = usersId
        .slice(nextUserIndex)
        .concat(usersId.slice(0, nextUserIndex))
        .filter(id => !users[id].hasFolded);
}

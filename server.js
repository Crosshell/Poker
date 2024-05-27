'use strict';

import { WebSocketServer } from 'ws';
import { Deck } from './deck.js';
import { MIN_PLAYERS, MAX_PLAYERS, SMALL_BLIND, BIG_BLIND, FLOP_CARDS_COUNT, STREETS, PORT } from './constants.js';
import { User } from './user.js';
import { checkHighestCombination } from './combinations.js'
import { checkWinner } from "./winner.js";

const wss = new WebSocketServer({ port: PORT });
const users = {};
const deck = new Deck();
const tableCards = [];
let queue = [];
let highestBid = BIG_BLIND;
let currentStreet = STREETS[0];
let isGameStarted = false;
let bank = 0;
let isFlopCardsSent = false;
let isTurnCardSent = false;
let isRiverCardSent = false;

wss.on('connection', (ws) => {
    const userID = getNextUserID();

    if (handleConnectionError(ws, userID)) {
        return;
    }

    const user = new User(userID, ws);
    users[userID] = user;

    ws.send(JSON.stringify({ type: 'getID', content: userID }));

    const message = JSON.stringify({ type: 'newConnect', content: Object.keys(users) });
    broadcast(message);
    sendReadyStatusToNewUser();

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const { type, content } = parsedMessage;
        handleMessage(type, content, user.id);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        removeConnection(user.id);
    });
});

const getNextUserID = () => {
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        if (!users[i]) {
            return i;
        }
    }
    return null;
}

const handleConnectionError = (ws, userID) => {
    if (userID === null) {
        ws.send(JSON.stringify({ type: 'error', content: 'Max players reached' }));
        ws.close();
        return true;
    } else if (isGameStarted) {
        ws.send(JSON.stringify({ type: 'error', content: 'The game has already started' }));
        ws.close();
        return true;
    }
    return false;
};

const handleMessage = (type, content, userID) => {
    switch (type) {
        case 'readiness':
            handleReadiness(content, userID);
            break;
        case 'playerMove':
            handleGameRound(content.action, content.amount, userID);
            break;
        default:
            console.warn('Unknown message type:', type);
    }
}

const handleReadiness = (isReady, userID) => {
    users[userID].isReady = isReady;
    const message = JSON.stringify({ type: 'updateReadiness', content: { isReady: isReady, userID: userID } });
    broadcast(message);
    if (Object.keys(users).length >= MIN_PLAYERS && isAllReady()) {
        startGame();
    }
}

const broadcast = (message) => {
    for (const userID in users) {
        users[userID].ws.send(message);
    }
}

const isAllReady = () => {
    return Object.values(users).every(user => user.isReady);
}

const sendReadyStatusToNewUser = () => {
    for (const userID in users) {
        const message = JSON.stringify({ type: 'updateReadiness', content: { isReady: users[userID].isReady, userID: parseInt(userID) } });
        broadcast(message);
    }
}

const startGame = () => {
    isGameStarted = true;
    deck.generate();
    deck.shuffle();
    dealCardsToUsers();
    sendPlayingUsers();
    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();
    setDealer();
    doBlinds();
    handlePlayerTurn();
}

const dealCardsToUsers = () => {
    for (const userID in users) {
        deck.dealUserCards(users[userID]);
        const message = JSON.stringify({ type: 'getHandCards', content: users[userID].cards });
        users[userID].ws.send(message);
    }
}

const sendPlayingUsers = () => {
    const usersID = Object.keys(users).map(Number);
    const message = JSON.stringify({ type: 'getPlayingUsers', content: usersID });
    broadcast(message);
}

const sendUpdateMoney = () => {
    const usersMoney = {};
    for (const userID in users){
        usersMoney[userID] = users[userID].money
    }
    const message = JSON.stringify({ type: 'updateMoney', content: usersMoney });
    broadcast(message);
}

const sendUpdateBid = () => {
    const usersBid = {};
    for (const userID in users) {
        usersBid[userID] = users[userID].bid;
    }
    const message = JSON.stringify({ type: 'updateBid', content: usersBid });
    broadcast(message)
}

const sendUpdateBank = () => {
    let money = 0;
    for (const userID in users) {
        money += users[userID].bid;
    }
    bank = money;
    const message = JSON.stringify({ type: 'updateBank', content: bank });
    broadcast(message);
}

const setDealer = () => {
    const usersID = Object.keys(users);
    const randomUserID = usersID[Math.floor(Math.random() * usersID.length)];
    users[randomUserID].isDealer = true;
    const message = JSON.stringify({ type: 'setDealer', content: randomUserID });
    broadcast(message)
}

const doBlinds = () => {
    const usersID = Object.keys(users).map(Number);
    const dealerIndex = usersID.findIndex(id => users[id].isDealer);
    const smallBlindIndex = (dealerIndex + 1) % usersID.length;
    const bigBlindIndex = (dealerIndex + 2) % usersID.length;
    const firstMoveIndex = (dealerIndex + 3) % usersID.length;

    applyBlind(usersID[smallBlindIndex], SMALL_BLIND);
    applyBlind(usersID[bigBlindIndex], BIG_BLIND);

    queue = usersID.slice(firstMoveIndex).concat(usersID.slice(0, firstMoveIndex));
    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();
}

const applyBlind = (userID, amount) => {
    users[userID].money -= amount;
    users[userID].bid += amount;
}

const handleGameRound = (action, amount, userID) => {
    if (userID !== queue[0]) return;

    if (findLastPlayerStanding()) return;
    const result = processPlayerAction(action, amount);

    if (result === null) return;

    const activeUsers = Object.keys(users).filter(id => !users[id].hasFolded);
    const allBidsEqual = activeUsers.every(id => users[id].bid === highestBid);

    if (allBidsEqual && queue.length === 0) {
        proceedToNextStreet();
    } else {
        handlePlayerTurn();
    }
}

const proceedToNextStreet = () => {
    const currentIndex = STREETS.indexOf(currentStreet);
    currentStreet = STREETS[currentIndex + 1];
    resetQueueToDealerLeft();

    if (currentStreet === 'Showdown') {
        showdown();
    } else {
        handlePlayerTurn();
    }

    if (!isFlopCardsSent && currentStreet === 'Flop') sendFlopCards();
    if (!isTurnCardSent && currentStreet === 'Turn') sendTurnCard();
    if (!isRiverCardSent && currentStreet === 'River') sendRiverCard();
}

const resetQueueToDealerLeft = () => {
    const usersID = Object.keys(users).map(Number);
    const leftPlayerFromDealerID = getLeftPlayerFromDealer(usersID);
    queue = usersID
        .slice(leftPlayerFromDealerID)
        .concat(usersID.slice(0, leftPlayerFromDealerID))
        .filter(id => !users[id].hasFolded);
}

const processPlayerAction = (action, amount) => {
    const currentUserID = queue.shift();

    if (action === 'fold') {
        users[currentUserID].hasFolded = true;
        const message = JSON.stringify({ type: 'foldedUser', content: currentUserID });
        broadcast(message);
    } else if (action === 'call') {
        callBet(currentUserID);
    } else if (action === 'bet') {
        if (!placeBet(currentUserID, amount)) return null;
    } else {
        return null;
    }

    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();
}

const callBet = (currentUserID) => {
    const callAmount = highestBid - users[currentUserID].bid;
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
        queue.unshift(currentUserID);
        handlePlayerTurn();
        return false;
    }
    if (amount + users[currentUserID].bid <= highestBid) {
        const message = JSON.stringify({ type: 'betError', content: 'The bid must be greater than the current highest bid' });
        users[currentUserID].ws.send(message);
        queue.unshift(currentUserID);
        handlePlayerTurn();
        return false;
    }
    highestBid = amount + users[currentUserID].bid;
    users[currentUserID].money -= amount;
    users[currentUserID].bid += amount;
    resetQueue(currentUserID);
    return true;
}

const resetQueue = (currentUserID) => {
    const usersID = Object.keys(users).map(Number);
    queue = usersID
        .slice(currentUserID)
        .concat(usersID.slice(0, currentUserID))
        .filter(userID => !users[userID].hasFolded);
}

const showdown = () => {
    const usersCombination = {};
    const usersCards = {};
    const notFoldedUsers = {};
    for (const userID in users) {
        if (!users[userID].hasFolded) {
            users[userID].combination = checkHighestCombination(users[userID].cards, tableCards);
            usersCombination[userID] = users[userID].combination;
            usersCards[userID] = users[userID].cards;
            notFoldedUsers[userID] = users[userID];
        }
    }

    let winnersID = checkWinner(notFoldedUsers);
    const dividedMoney = Math.floor(bank / winnersID.length);

    for (const winnerID of winnersID) {
        users[winnerID].money += dividedMoney;
    }

    bank = 0;
    sendUpdateMoney();
    sendUpdateBank();

    const message = JSON.stringify({
        type: 'gameOver',
        content: {
            winners: winnersID,
            usersCombination: usersCombination,
            usersCards: usersCards
        }
    });
    broadcast(message);
}

const handlePlayerTurn = () => {
    if (queue.length === 0 || findLastPlayerStanding()) return;
    const currentUserID = queue[0];
    const message = JSON.stringify({ type: 'turn', content: parseInt(currentUserID) });
    broadcast(message)
};

const findLastPlayerStanding = () => {
    const activeUsers = Object.keys(users).filter(userID => !users[userID].hasFolded);
    if (activeUsers.length === 1) {
        const winnerID = activeUsers[0];
        users[winnerID].money += bank;
        bank = 0;
        sendUpdateMoney();
        sendUpdateBank();
        const message = JSON.stringify({ type: 'gameOverByFold', content: { winnerID: winnerID, winnerCards: users[winnerID].cards } });
        broadcast(message);
        return true;
    }
    return false;
}

const getLeftPlayerFromDealer = (usersID) => {
    const dealerID = usersID.find(id => users[id].isDealer);
    const dealerIndex = usersID.indexOf(dealerID);

    let leftPlayerFromDealerIndex = (dealerIndex + 1) % usersID.length;
    while (users[usersID[leftPlayerFromDealerIndex]].hasFolded) {
        leftPlayerFromDealerIndex = (leftPlayerFromDealerIndex + 1) % usersID.length;
    }
    return leftPlayerFromDealerIndex;
}

const sendFlopCards = () => {
    for (let i = 0; i < FLOP_CARDS_COUNT; i++) {
        tableCards.push(deck.deal());
    }
    const message = JSON.stringify({ type: 'updateTable', content: tableCards });
    broadcast(message);
    isFlopCardsSent = true;
}

const sendTurnCard = () => {
    tableCards.push(deck.deal());
    const message = JSON.stringify({ type: 'updateTable', content: tableCards });
    broadcast(message);
    isTurnCardSent = true;
}

const sendRiverCard = () => {
    tableCards.push(deck.deal());
    const message = JSON.stringify({ type: 'updateTable', content: tableCards });
    broadcast(message);
    isRiverCardSent = true;
}

const removeConnection = (userID) => {
    if (isGameStarted) {
        users[userID].hasFolded = true;
        const message = JSON.stringify({ type: 'userGameDisconnected', content: userID });
        broadcast(message);
        const index = queue.indexOf(userID);
        if (index !== -1) {
            queue.splice(index, 1);
        }
        handlePlayerTurn();
    } else if (users[userID]) {
        delete users[userID];
        const message = JSON.stringify({ type: 'userLobbyDisconnected', content: userID });
        broadcast(message);
    }
}
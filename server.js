'use strict';

import { WebSocketServer } from 'ws';
import { Deck } from './deck.js';
import { MIN_PLAYERS, MAX_PLAYERS, SMALL_BLIND, BIG_BLIND, START_MONEY, FLOP_CARDS_COUNT, STREETS } from './constants.js';
import { dealUserCards } from './user.js';
import { checkHighestCombination } from './combinations.js'
import { checkWinner } from "./winner.js";

const wss = new WebSocketServer({ port: 8080 });
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

    users[userID] = {
        username: `User ${userID}`,
        isReady: false,
        ws: ws,
        cards: [],
        combination: null,
        money: START_MONEY,
        bid: 0,
        isDealer: false,
        hasFolded: false
    };

    ws.userID = userID;

    ws.send(JSON.stringify({ type: 'getID', content: userID }));

    const message = JSON.stringify({ type: 'newConnect', content: Object.keys(users) });
    broadcast(message);
    sendReadyStatusToNewUser();

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message);
        const { type, content } = parsedMessage;

        handleMessage(type, content, ws.userID);

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    ws.on('close', () => {
        removeConnection(ws);
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
            users[userID].isReady = content;
            const message = JSON.stringify({ type: 'updateReadiness', content: { isReady: content, userID: userID } });
            broadcast(message);
            if (Object.keys(users).length >= MIN_PLAYERS && isAllReady()){
                startGame();
            }
            break;
        case 'playerMove':
            handleGameRound(content.action, content.amount);
            break;
        default:
            console.warn('Unknown message type:', type);
    }
}

const broadcast = (message) => {
    for (const userID in users) {
        users[userID].ws.send(message);
    }
}

const isAllReady = () => {
    for (const userID in users) {
        if (!users[userID].isReady) {
            return false;
        }
    }
    return true;
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
    sendCardsToUsers();
    sendPlayingUsers();
    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();
    getDealer();
    doBlinds();
    handlePlayerTurn();
}

const dealCardsToUsers = () => {
    for (const user in users) {
        users[user].cards = dealUserCards(deck);
    }
}

const sendCardsToUsers = () => {
    for (const userID in users) {
        const message = JSON.stringify({ type: 'getHandCards', content: users[userID].cards });
        users[userID].ws.send(message);
    }
}

const sendPlayingUsers = () => {
    const usersID = [];
    for (const userID in users) {
        usersID.push(parseInt(userID));
    }
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

const getDealer = () => {
    const userKeys = Object.keys(users);
    const randomIndex = Math.floor(Math.random() * userKeys.length);
    const randomUserID = userKeys[randomIndex];
    users[randomUserID].isDealer = true;
    const message = JSON.stringify({ type: 'getDealer', content: randomUserID });
    broadcast(message)
}

const doBlinds = () => {
    let dealer;
    for (const userID in users) {
        if (users[userID].isDealer) {
            dealer = userID;
            break;
        }
    }

    const userKeys = Object.keys(users);
    const dealerIndex = userKeys.indexOf(dealer);
    const smallBlindIndex = (dealerIndex + 1) % userKeys.length;
    const bigBlindIndex = (dealerIndex + 2) % userKeys.length;
    const firstMoveIndex = (dealerIndex + 3) % userKeys.length;

    const smallBlindUser = users[userKeys[smallBlindIndex]];
    const bigBlindUser = users[userKeys[bigBlindIndex]];

    smallBlindUser.money -= SMALL_BLIND;
    smallBlindUser.bid += SMALL_BLIND;

    bigBlindUser.money -= BIG_BLIND;
    bigBlindUser.bid += BIG_BLIND;
    queue = userKeys.slice(firstMoveIndex).concat(userKeys.slice(0, firstMoveIndex));
    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();
}

const handleGameRound = (action, amount) => {
    if (findLastPlayerStanding()) return;
    const result = processPlayerAction(action, amount);

    if (result === null) {
        return;
    }

    const activeUsers = Object.keys(users).filter(userID => !users[userID].hasFolded);
    const allBidsEqual = activeUsers.every(userID => users[userID].bid === highestBid);

    if (allBidsEqual && queue.length === 0) {
        let currentIndex = STREETS.indexOf(currentStreet);
        currentStreet = STREETS[currentIndex + 1];
        const userKeys = Object.keys(users);
        const leftPlayerFromDealerID = getLeftPlayerFromDealer(userKeys);
        queue = userKeys
            .slice(leftPlayerFromDealerID)
            .concat(userKeys.slice(0, leftPlayerFromDealerID))
            .filter(userID => !users[userID].hasFolded);

        if (currentStreet === 'Showdown') {
            showdown();
        } else {
            handlePlayerTurn();
        }

        if (!isFlopCardsSent && currentStreet === 'Flop') sendFlopCards();
        if (!isTurnCardSent && currentStreet === 'Turn') sendTurnCard();
        if (!isRiverCardSent && currentStreet === 'River') sendRiverCard();
        return;
    }
    handlePlayerTurn();
}

const processPlayerAction = (action, amount) => {
    const currentUserID = queue.shift();

    if (action === 'fold') {
        users[currentUserID].hasFolded = true;
        const message = JSON.stringify({ type: 'foldedUser', content: currentUserID });
        broadcast(message);
    } else if (action === 'call') {
        const callAmount = highestBid - users[currentUserID].bid;
        if (users[currentUserID].money - callAmount < 0) {
            users[currentUserID].bid = users[currentUserID].money + users[currentUserID].bid;
            users[currentUserID].money = 0;
        } else {
            users[currentUserID].money -= callAmount;
            users[currentUserID].bid += callAmount;
        }

    } else if (action === 'bet') {
        if (users[currentUserID].money < amount){
            const message = JSON.stringify({ type: 'betError', content: 'The bet must be less than the amount of your money' });
            users[currentUserID].ws.send(message);
            queue.unshift(currentUserID);
            handlePlayerTurn();
            return null;
        } else if (amount + users[currentUserID].bid <= highestBid) {
            const message = JSON.stringify({ type: 'betError', content: 'The bid must be greater than the current highest bid' });
            users[currentUserID].ws.send(message);
            queue.unshift(currentUserID);
            handlePlayerTurn();
            return null;
        }
        highestBid = amount + users[currentUserID].bid;
        users[currentUserID].money -= amount;
        users[currentUserID].bid += amount;
        const userKeys = Object.keys(users);
        queue = userKeys
            .slice(currentUserID)
            .concat(userKeys.slice(0, currentUserID))
            .filter(userID => !users[userID].hasFolded);
    } else {
        return null;
    }

    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();
}

const showdown = () => {
    const usersCombination = {};
    const usersCards = {};
    for (const userID in users) {
        if (!users[userID].hasFolded){
            users[userID].combination = checkHighestCombination(users[userID].cards, tableCards);
            usersCombination[userID] = users[userID].combination;
            usersCards[userID] = users[userID].cards;
        }
    }

    const notFoldedUsers = Object.fromEntries(
        Object.entries(users).filter(([_, user]) => !user.hasFolded)
    );

    const winnersID = checkWinner(notFoldedUsers);
    const dividedMoney = Math.floor(bank / winnersID.length);
    for (const winnerID in winnersID) {
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
    const activeUsers = Object.keys(users).filter(userID => !users[userID].hasFolded)
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

const getLeftPlayerFromDealer = (userKeys) => {
    let dealerID;
    for (const userID in users) {
        if (users[userID].isDealer) {
            dealerID = userID;
            break;
        }
    }
    const dealerIndex = userKeys.indexOf(dealerID);
    let leftPlayerFromDealerIndex = (dealerIndex + 1) % userKeys.length;
    while (users[userKeys[leftPlayerFromDealerIndex]].hasFolded) {
        leftPlayerFromDealerIndex = (leftPlayerFromDealerIndex + 1) % userKeys.length;
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

const removeConnection = (ws) => {
    const userID = ws.userID;

    if (isGameStarted) {
        users[userID].hasFolded = true;
        const message = JSON.stringify({ type: 'userGameDisconnected', content: userID });
        broadcast(message);
        if (userID === parseInt(queue[0])) {
            queue.shift();
        }
        handlePlayerTurn();
    } else if (users[userID]) {
        delete users[userID];
        const message = JSON.stringify({ type: 'userLobbyDisconnected', content: userID });
        broadcast(message);
    }
}
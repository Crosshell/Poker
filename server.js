'use strict';

import { WebSocketServer } from 'ws';
import { Deck } from './deck.js';
import { MIN_PLAYERS, MAX_PLAYERS, SMALL_BLIND, BIG_BLIND, START_MONEY } from "./constants.js";
import { dealUserCards } from "./user.js";
import { checkWinner } from "./winner.js";

const wss = new WebSocketServer({ port: 8080 });
const users = {}
let queue = [];
let highestBid = BIG_BLIND;
let currentStreet = 'PreFlop';
let isGameStarted = false;
let bank = 0;

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
            streets(content.action, content.amount);
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
    const deck = new Deck();
    deck.generate();
    deck.shuffle();
    dealCardsToUsers(deck);
    sendCardsToUsers();
    sendPlayingUsers();
    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();
    getDealer();
    doBlinds();
    handlePlayerTurn();
}

const dealCardsToUsers = (deck) => {
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

const streets = (action, amount) => {
    switch (currentStreet) {
        case 'PreFlop':
            preFlop(action, amount);
            break;
        case 'Flop':
            flop();
            break;
        case 'Turn':
            turn();
            break;
        case 'River':
            river();
            break;
        case 'Showdown':
            showdown();
            break;
    }
}

const preFlop = (action, amount) => {

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
            return;
        } else if (amount + users[currentUserID].bid <= highestBid) {
            const message = JSON.stringify({ type: 'betError', content: 'The bid must be greater than the current highest bid' });
            users[currentUserID].ws.send(message);
            queue.unshift(currentUserID);
            handlePlayerTurn();
            return;
        }
        highestBid = amount;
        users[currentUserID].money -= amount;
        users[currentUserID].bid += amount;
        const userKeys = Object.keys(users);
        queue = userKeys
            .slice(currentUserID)
            .concat(userKeys.slice(0, currentUserID))
            .filter(userID => !users[userID].hasFolded);
    } else {
        return;
    }

    sendUpdateMoney();
    sendUpdateBid();
    sendUpdateBank();

    const activeUsers = Object.keys(users).filter(userID => !users[userID].hasFolded);

    if (findLastPlayerStanding(activeUsers)) return;

    const allBidsEqual = activeUsers.every(userID => users[userID].bid === highestBid);

    if (allBidsEqual && queue.length === 0) {
        currentStreet = 'Flop';
        flop();
        return;
    }

    handlePlayerTurn();
}

const flop = () => {

}

const turn = () => {

}

const river = () => {

}

const showdown = () => {

}

const handlePlayerTurn = () => {
    if (queue.length === 0) return;
    const currentUserID = queue[0];
    const message = JSON.stringify({ type: 'turn', content: parseInt(currentUserID) });
    broadcast(message)
};

const findLastPlayerStanding = (activeUsers) => {
    if (activeUsers.length === 1) {
        const winner = activeUsers[0];
        const message = JSON.stringify({ type: 'gameOver', content: {user: winner, combination: null } });
        broadcast(message);
        return true;
    }
    return false;
}

const removeConnection = (ws) => {
    const userID = ws.userID;

    if (users[userID]) {
        delete users[userID];
        const message = JSON.stringify({ type: 'userDisconnected', content: userID });
        broadcast(message);

        if (isGameStarted) {
            // handle player exit during the game
        }
    }
}
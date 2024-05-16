import WebSocket, { WebSocketServer } from 'ws';
import { Deck } from './deck.js';
import { NUMBER_OF_PLAYERS, SMALL_BLIND, BIG_BLIND } from "./constants.js";
import { createUsers } from "./user.js";
import { checkWinner } from "./winner.js";

const wss = new WebSocketServer({ port: 8080 });

let connectionCounter = 0;
const playerConnections = {};
const usersMoney = {};
const usersBid = {};
let currentStreet = 'preflop';
let deck, tableCards, users;

wss.on('connection', function connection(ws) {
    console.log('New player has joined');

    if (connectionCounter < NUMBER_OF_PLAYERS) {
        const userKey = `User ${connectionCounter + 1}`;
        playerConnections[userKey] = ws;
        usersMoney[userKey] = 1000;
        usersBid[userKey] = 0;
        connectionCounter++;

        ws.send(JSON.stringify('Successful connected'));
    } else {
        ws.send(JSON.stringify({ error: 'Max players reached' }));
    }

    if (connectionCounter === NUMBER_OF_PLAYERS) {
        startGame();
    }

    ws.on('message', function incoming(message) {
        const parsedMessage = JSON.parse(message);
        const { type, content, userKey } = parsedMessage;

        switch (type) {
            case 'call':
                handleCall(userKey);
                break;
            case 'raise':
                handleRaise(userKey, content.raiseAmount);
                break;
            case 'fold':
                handleFold(userKey);
                break;
            default:
                console.warn('Unknown message type:', type);
        }


        broadcast(message);
    });

    ws.on('close', function close() {
        console.log('Player left the game');
        removeConnection(ws);
    });

    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
    });
});

const startGame = () => {
    deck = new Deck();
    deck.generate();
    deck.shuffle();

    tableCards = [];

    users = dealInitialHands();

    for (const userKey in users) {
        const user = users[userKey];
        const userCards = user.cards;
        const enemies = Object.keys(users).filter(key => key !== userKey);

        sendToUser(userKey, JSON.stringify({ type: 'dealHand', content: userCards }));
        sendToUser(userKey, JSON.stringify({ type: 'userID', content: userKey }));
        sendToUser(userKey, JSON.stringify({ type: 'enemiesID', content: enemies }));
        sendToUser(userKey, JSON.stringify({ type: 'updatedMoney', content: usersMoney }));
    }

    const usersBlind = makeBlind();
    usersMoney[usersBlind.smallBlindUser] -= SMALL_BLIND;
    usersMoney[usersBlind.bigBlindUser] -= BIG_BLIND;
    usersBid[usersBlind.smallBlindUser] += SMALL_BLIND;
    usersBid[usersBlind.bigBlindUser] += BIG_BLIND;

    broadcast(JSON.stringify({ type: 'updatedMoney', content: usersMoney }));
    broadcast(JSON.stringify({ type: 'updatedBid', content: usersBid }));
}

const dealInitialHands = () => {
    return createUsers(deck, tableCards, NUMBER_OF_PLAYERS);
}

const moveToNextStreet = () => {
    switch (currentStreet) {
        case 'preflop':
            currentStreet = 'flop';
            dealFlop();
            break;
        case 'flop':
            currentStreet = 'turn';
            dealTurn();
            break;
        case 'turn':
            currentStreet = 'river';
            dealRiver();
            break;
        case 'river':
            currentStreet = 'showdown';
            handleShowdown();
            break;
        default:
            console.warn('Unknown street:', currentStreet);
    }
}

const dealFlop = () => {
    for (let i = 0; i < 3; i++) {
        tableCards.push(deck.deal());
    }
    broadcast(JSON.stringify({ type: 'dealFlop', content: tableCards.slice(0, 3) }));
}

const dealTurn = () => {
    tableCards.push(deck.deal());
    broadcast(JSON.stringify({ type: 'dealTurn', content: tableCards.slice(0, 4) }));
}

const dealRiver = () => {
    tableCards.push(deck.deal());
    broadcast(JSON.stringify({ type: 'dealRiver', content: tableCards }));
}

const handleShowdown = () => {
    const winner = checkWinner(users, tableCards);
    broadcast(JSON.stringify({ type: 'showdown', content: winner }));
}

const handleCall = (userKey) => {
    const maxBid = Math.max(...Object.values(usersBid));
    const callAmount = maxBid - usersBid[userKey];
    if (usersMoney[userKey] >= callAmount) {
        updateUserMoney(userKey, callAmount);
    } else {
        updateUserMoney(userKey, usersMoney[userKey]);
    }
    sendUpdatedMoneyAndBids();
    moveToNextStreet();
};

const handleRaise = (userKey, raiseAmount) => {
    const maxBid = Math.max(...Object.values(usersBid));
    const callAmount = maxBid - usersBid[userKey];
    const totalRaise = callAmount + raiseAmount;
    if (usersMoney[userKey] >= totalRaise) {
        updateUserMoney(userKey, totalRaise);
    } else {
        updateUserMoney(userKey, usersMoney[userKey]);
    }
    sendUpdatedMoneyAndBids();
    moveToNextStreet();
};

const handleFold = (userKey) => {
    usersBid[userKey] = -1;
    sendToUser(userKey, JSON.stringify({ type: 'fold', content: true }));
    moveToNextStreet();
};

const updateUserMoney = (userKey, amount) => {
    usersMoney[userKey] -= amount;
    usersBid[userKey] += amount;
};

const sendUpdatedMoneyAndBids = () => {
    for (const userKey in playerConnections) {
        sendToUser(userKey, JSON.stringify({ type: 'updatedMoney', content: usersMoney }));
        sendToUser(userKey, JSON.stringify({ type: 'updatedBid', content: usersBid }));
    }
};

const sendToUser = (userKey, message) => {
    const userConnection = playerConnections[userKey];
    if (userConnection && userConnection.readyState === WebSocket.OPEN) {
        userConnection.send(message);
    } else {
        console.log(`Connection for ${userKey} is not open or does not exist.`);
    }
}

const broadcast = (message) => {
    for (const player in playerConnections) {
        const connection = playerConnections[player];
        if (connection.readyState === WebSocket.OPEN) {
            connection.send(message);
        }
    }
}

const removeConnection = (ws) => {
    for (const key in playerConnections) {
        if (playerConnections[key] === ws) {
            delete playerConnections[key];
            break;
        }
    }
}

const makeBlind = () => {
    const random = Math.floor(Math.random() * 2);
    const usersBlind = { bigBlindUser: 'User 1', smallBlindUser: 'User 2' }

    if (random === 1) {
        usersBlind.bigBlindUser = 'User 2';
        usersBlind.smallBlindUser = 'User 1';
    }
    return usersBlind;
}

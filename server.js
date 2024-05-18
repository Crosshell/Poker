import WebSocket, { WebSocketServer } from 'ws';
import { Deck } from './deck.js';
import { NUMBER_OF_PLAYERS, SMALL_BLIND, BIG_BLIND } from "./constants.js";
import { dealUserCard } from "./user.js";
import { checkWinner } from "./winner.js";

const wss = new WebSocketServer({ port: 8080 });
const users = {}

wss.on('connection', function connection(ws) {
    const userCount = Object.keys(users).length + 1;
    const userKey = `User ${userCount}`;

    if (userCount > NUMBER_OF_PLAYERS) {
        ws.send(JSON.stringify({ error: 'Max players reached' }));
        ws.close();
        return;
    }

    users[userKey] = { status: 'Not Ready', ws: ws, cards: [], combination: null, money: 1000, bid: 0, isDealer: false};
    ws.userKey = userKey;

    ws.send(JSON.stringify({ type: 'getID', content: userKey }));

    const message = JSON.stringify({ type: 'newConnect', content: Object.keys(users) });
    broadcast(message);
    sendReadyStatusToNewUser();

    ws.on('message', function incoming(message) {
        const parsedMessage = JSON.parse(message);
        const { type, content } = parsedMessage;

        const userKey = ws.userKey;

        switch (type) {
            case 'ready':
                users[userKey].status = content;
                const message = JSON.stringify({ type: 'updateReadiness', content: content, userKey: userKey });
                broadcast(message);
                break;
            default:
                console.warn('Unknown message type:', type);
        }

        broadcast(message);
        if (Object.keys(users).length >= 2 && isAllReady(users)){
            startGame();
        }

        ws.on('error', function error(err) {
            console.error('WebSocket error:', err);
        });
    });

});

const broadcast = (message) => {
    for (const user in users) {
        users[user].ws.send(message);
    }
}

const isAllReady = (users) => {
    for (const user in users){
        if (users[user].status !== 'Ready'){
            return false
        }
    }
    return true
}

const sendReadyStatusToNewUser = () => {
    for (const user in users){
        const message = JSON.stringify({ type: 'updateReadiness', content: users[user].status, userKey: user });
        broadcast(message);
    }
}

const startGame = () => {
    const deck = new Deck();
    deck.generate();
    deck.shuffle();
    dealCardsToUsers(users, deck);
    sendCardsToUsers(users);
    sendPlayingUsers(users);
    sendUpdateMoney(users);
    sendUpdateBid(users);
    getDealer(users);
    doBlinds(users);
}

const dealCardsToUsers = (users, deck) => {
    for (const user in users) {
        users[user].cards = dealUserCard(deck);
    }
}

const sendCardsToUsers = (users) => {
    for (const user in users){
        const message = JSON.stringify({ type: 'getHandCards', content: users[user].cards });
        users[user].ws.send(message);
    }
}

const sendPlayingUsers = (users) => {
    const usersKey = Object.keys(users);
    const message = JSON.stringify({ type: 'getPlayingUsers', content: usersKey });
    broadcast(message);
}

const sendUpdateMoney = (users) => {
    const usersMoney = {};
    for (const user in users){
        usersMoney[user] = users[user].money
    }
    const message = JSON.stringify({ type: 'updateMoney', content: usersMoney });
    broadcast(message);
}

const sendUpdateBid = (users) => {
    const usersBid = {};
    for (const user in users) {
        usersBid[user] = users[user].bid;
    }
    const message = JSON.stringify({ type: 'updateBid', content: usersBid });
    broadcast(message)
}

const getDealer = (users) => {
    const userKeys = Object.keys(users);
    const randomIndex = Math.floor(Math.random() * userKeys.length);
    const randomUserKey = userKeys[randomIndex];
    users[randomUserKey].isDealer = true;
    const message = JSON.stringify({ type: 'getDealer', content: randomUserKey });
    broadcast(message)
}

const doBlinds = (users) => {
    let dealer
    for (const user in users) {
        if (users[user].isDealer) {
            dealer = user;
            break;
        }
    }

    const userKeys = Object.keys(users);
    const dealerIndex = userKeys.indexOf(dealer);
    const smallBlindIndex = (dealerIndex + 1) % userKeys.length;
    const bigBlindIndex = (dealerIndex + 2) % userKeys.length;

    const smallBlindUser = users[userKeys[smallBlindIndex]];
    const bigBlindUser = users[userKeys[bigBlindIndex]];

    smallBlindUser.money -= SMALL_BLIND;
    smallBlindUser.bid += SMALL_BLIND;

    bigBlindUser.money -= BIG_BLIND;
    bigBlindUser.bid += BIG_BLIND;

    sendUpdateMoney(users);
    sendUpdateBid(users);
}
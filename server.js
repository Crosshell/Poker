import WebSocket, { WebSocketServer } from 'ws';
import { Deck } from './deck.js';
import { TABLE_CARD_SIZE, NUMBER_OF_PLAYERS, SMALL_BLIND, BIG_BLIND } from "./constants.js";
import { createUsers } from "./user.js";
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

    users[userKey] = { status: 'Not Ready', ws: ws };
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

}


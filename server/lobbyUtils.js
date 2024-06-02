'use strict';

import { MAX_PLAYERS } from '../src/constants/constants.js';
import { users, gameState } from './state.js';
import { broadcast } from './utils.js';
import { User } from '../src/models/user.js';

export const checkConnectionError = (ws) => {
    if (gameState.isGameStarted) {
        ws.close(1000, 'The game has already started');
    } else if (Object.keys(users).length >= MAX_PLAYERS) {
        ws.close(1000, 'Max players reached');
    }
}

export const validateUsername = (username, ws) => {
    const stringUsername = username.toString();
    if (stringUsername.length >= 4 && stringUsername.length <= 10) {
        return true;
    }
    ws.close(1000, 'Invalid username. Username must be 4 to 10 characters.');
    return false;
}

export const isAllReady = () => {
    return Object.values(users).every(user => user.isReady);
}

export const connectUser = (username, ws) => {
    const userID = getNextUserID();

    users[userID] = new User(userID, ws);

    users[userID].username = username;

    ws.send(JSON.stringify({ type: 'successfulConnect', content: { userID: userID } }));
    sendNewConnect();
    sendReadyStatusToNewUser();
}

const getNextUserID = () => {
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        if (!users[i]) {
            return i;
        }
    }
    return null;
}

const sendNewConnect = () => {
    broadcast(JSON.stringify({ type: 'newConnect', content: Object.keys(users) }));
}

const sendReadyStatusToNewUser = () => {
    for (const user of Object.values(users)) {
        broadcast(JSON.stringify({ type: 'updateReadiness', content: { isReady: user.isReady, userID: user.id, username: user.username } }));
    }
}
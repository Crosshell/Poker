'use strict';

import { MAX_PLAYERS } from '../src/constants/constants.js';
import { users, gameState } from './state.js';
import { broadcast } from './utils.js';

export const getNextUserID = () => {
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        if (!users[i]) {
            return i;
        }
    }
    return null;
}

export const isConnectionError = (ws, userID) => {
    if (userID === null) {
        ws.send(JSON.stringify({ type: 'error', content: 'Max players reached' }));
        ws.close();
        return true;
    } else if (gameState.isGameStarted) {
        ws.send(JSON.stringify({ type: 'error', content: 'The game has already started' }));
        ws.close();
        return true;
    }
    return false;
}

export const validateUsername = (username, ws, user) => {
    const stringUsername = username.toString();
    if (stringUsername.length >= 4 && stringUsername.length <= 10) {
        ws.send(JSON.stringify({ type: 'successfulConnect', content: 'OK' }));
        users[user.id].username = username;
    } else {
        ws.send(JSON.stringify({ type: 'error', content: 'Invalid username. Username must be 4 to 10 characters.' }));
        ws.close();
    }
}

export const sendIdToNewUser = (user) => {
    user.ws.send(JSON.stringify({ type: 'getID', content: user.id }));
}

export const sendNewConnect = () => {
    broadcast(JSON.stringify({ type: 'newConnect', content: Object.keys(users) }));
}

export const sendReadyStatusToNewUser = () => {
    for (const user of Object.values(users)) {
        broadcast(JSON.stringify({ type: 'updateReadiness', content: { isReady: user.isReady, userID: user.id, username: user.username } }));
    }
}

export const isAllReady = () => {
    return Object.values(users).every(user => user.isReady);
}

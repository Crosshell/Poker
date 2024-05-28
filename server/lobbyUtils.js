'use strict';

import { MAX_PLAYERS } from '../constants.js';
import { gameState, users } from './state.js';
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

export const sendIdToNewUser = (user) => {
    user.ws.send(JSON.stringify({ type: 'getID', content: user.id }));
}

export const sendNewConnect = () => {
    broadcast(JSON.stringify({ type: 'newConnect', content: Object.keys(users) }));
}

export const sendReadyStatusToNewUser = () => {
    for (const user of Object.values(users)) {
        broadcast(JSON.stringify({ type: 'updateReadiness', content: { isReady: user.isReady, userID: user.id } }));
    }
}

export const isAllReady = () => {
    return Object.values(users).every(user => user.isReady);
}

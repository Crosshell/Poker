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
    const userId = getNextUserId();
    if (userId === null) {
        ws.close(1000, 'Unable to assign user ID');
        return;
    }

    users[userId] = new User(userId, ws);
    users[userId].username = username;

    ws.send(JSON.stringify({ type: 'successfulConnect', content: userId }));
    broadcastUserStatus();
}

const getNextUserId = () => {
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        if (!users[i]) {
            return i;
        }
    }
    return null;
}

const broadcastUserStatus = () => {
    broadcast(JSON.stringify({ type: 'newConnect', content: Object.keys(users) }));
    for (const user of Object.values(users)) {
        broadcast(JSON.stringify({ type: 'updateReadiness', content: { isReady: user.isReady, userId: user.id, username: user.username } }));
    }
}
'use strict';

import { getNextUserID, isConnectionError, sendIdToNewUser, sendNewConnect, sendReadyStatusToNewUser, isAllReady } from './lobbyUtils.js';
import { broadcast, removeConnection } from './utils.js';
import { startGame } from './game.js';
import { users, gameState } from './state.js';
import { User } from '../user.js';
import { MIN_PLAYERS } from '../constants.js';
import { updatePlayerTurn, findLastPlayerStanding, processPlayerAction, proceedToNextStreet } from './gameUtils.js';

export const handleConnection = (ws) => {
    const userID = getNextUserID();

    if (isConnectionError(ws, userID)) {
        return;
    }

    users[userID] = new User(userID, ws);

    sendIdToNewUser(users[userID])
    sendNewConnect();
    sendReadyStatusToNewUser();
}

export const handleMessage = (ws, message) => {
    const parsedMessage = JSON.parse(message);
    const { type, content } = parsedMessage;
    handleMassageType(type, content, ws);
}

export const handleClose = (ws) => {
    const user = Object.values(users).find(user => user.ws === ws);
    if (user) {
        removeConnection(user.id);
    }
};

const handleMassageType = (type, content, ws) => {
    const user = Object.values(users).find(user => user.ws === ws);
    if (!user) return;

    switch (type) {
        case 'readiness':
            handleReadiness(content, user.id);
            break;
        case 'playerMove':
            handleGameRound(content.action, content.amount, user.id);
            break;
        default:
            console.warn('Unknown message type:', type);
    }
}

const handleReadiness = (isReady, userID) => {
    users[userID].isReady = isReady;
    broadcast(JSON.stringify({ type: 'updateReadiness', content: { isReady: isReady, userID: userID } }));
    if (Object.keys(users).length >= MIN_PLAYERS && isAllReady()) {
        startGame();
    }
}

const handleGameRound = (action, amount, userID) => {
    if (userID !== gameState.queue[0]) return;

    if (findLastPlayerStanding()) return;
    const result = processPlayerAction(action, amount);

    if (result === null) return;

    const activeUsers = Object.keys(users).filter(id => !users[id].hasFolded);
    const allBidsEqual = activeUsers.every(id => users[id].bid === gameState.highestBid);

    if (allBidsEqual && gameState.queue.length === 0) {
        proceedToNextStreet();
    } else {
        updatePlayerTurn();
    }
}
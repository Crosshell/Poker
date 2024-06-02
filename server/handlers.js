'use strict';

import { isAllReady, validateUsername, connectUser } from './lobbyUtils.js';
import { broadcast, removeConnection } from './utils.js';
import { startGame } from './game.js';
import { users, gameState } from './state.js';
import { MIN_PLAYERS } from '../src/constants/constants.js';
import { updatePlayerTurn, findLastPlayerStanding, processPlayerAction, proceedToNextStreet } from './gameUtils.js';

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

    switch (type) {
        case 'clientUsername':
            if (validateUsername(content, ws)){
                connectUser(content, ws);
            }
            break;
        case 'changeReadiness':
            handleReadiness(user);
            break;
        case 'playerMove':
            handleGameRound(content.action, content.amount, user.id);
            break;
        default:
            console.warn('Unknown message type:', type);
    }
}

const handleReadiness = (user) => {
    users[user.id].isReady = !users[user.id].isReady;
    broadcast(JSON.stringify({ type: 'updateReadiness', content: { isReady: user.isReady, userId: user.id, username: user.username } }));
    if (Object.keys(users).length >= MIN_PLAYERS && isAllReady()) {
        startGame();
    }
}

const handleGameRound = (action, amount, userId) => {
    if (userId !== gameState.queue[0]) return;

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

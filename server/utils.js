'use strict';

import { users, gameState } from './state.js';
import { proceedToNextStreet, updatePlayerTurn } from './gameUtils.js'

export const broadcast = (message) => {
    for (const user of Object.values(users)) {
        user.ws.send(message);
    }
}

export const removeConnection = (userId) => {
    if (gameState.isGameStarted) {
        users[userId].hasFolded = true;
        broadcast(JSON.stringify({ type: 'userGameDisconnected', content: [ userId, users[userId].username ] }));
        const index = gameState.queue.indexOf(userId);
        if (index !== -1) {
            gameState.queue.splice(index, 1);
        }
        if (gameState.queue.length === 0) {
            proceedToNextStreet();
        } else {
            updatePlayerTurn();
        }
    } else if (users[userId]) {
        delete users[userId];
        broadcast(JSON.stringify({ type: 'userLobbyDisconnected', content: userId }));
    }
}

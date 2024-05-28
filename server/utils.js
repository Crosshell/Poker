'use strict';

import { users, gameState } from './state.js';
import { updatePlayerTurn } from './gameUtils.js'

export const broadcast = (message) => {
    for (const user of Object.values(users)) {
        user.ws.send(message);
    }
}

export const removeConnection = (userID) => {
    if (gameState.isGameStarted) {
        users[userID].hasFolded = true;
        broadcast(JSON.stringify({ type: 'userGameDisconnected', content: [ userID, users[userID].username ] }));
        const index = gameState.queue.indexOf(userID);
        if (index !== -1) {
            gameState.queue.splice(index, 1);
        }
        updatePlayerTurn();
    } else if (users[userID]) {
        delete users[userID];
        broadcast(JSON.stringify({ type: 'userLobbyDisconnected', content: userID }));
    }
}

'use strict';

import { HOST, PORT } from '../src/constants/constants.js';
import { get, UI, displayMessage } from './ui.js';
import { initializeLobbySlots, initializePlayerSlots } from './slotsInitializer.js'
import { lobbyServerHandler } from './socketHandlers.js';

export const data = {
    yourId: 0,
    currentTurnUserId: 0
}

document.addEventListener('DOMContentLoaded', () => {
    initializeLobbySlots();
    initializePlayerSlots();
    startScreen();
});

const startScreen = () => {
    UI.connectButton.addEventListener('click', () => {
        const nameElement = get('name');
        const username = nameElement.value;
        connectToLobby(username);
    });
}

const connectToLobby = (username) => {
    const socket = new WebSocket(`ws://${HOST}:${PORT}`);
    socket.addEventListener('open',  () => {
        console.log('Successful connection to server');

        socket.send(JSON.stringify({ type: 'clientUsername', content: username }));

        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            lobbyServerHandler(socket, message);
        });

        UI.readyButton.addEventListener('click', () => {
            socket.send(JSON.stringify({ type: 'changeReadiness' }));
        });

        socket.addEventListener('close', (event) => {
            displayMessage('Socket close: ' + event.reason);
        });
    });
}

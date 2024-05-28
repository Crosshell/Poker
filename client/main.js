'use strict';

import { HOST, PORT } from '../constants.js';
import { UI } from './ui.js';
import { lobbyServerHandler } from './socketHandlers.js';

export const data = {
    yourID: 0,
    isYouReady: false,
    currentTurnUserID: 0
}

document.addEventListener('DOMContentLoaded', () => {
    startScreen();
});

const startScreen = () => {
    UI.connectButton.addEventListener('click', () => {
        UI.startScreenElement.style.display = 'none';
        UI.connectingMessage.style.display = 'block';
        connectToLobby();
    });
}

const connectToLobby = () => {
    const socket = new WebSocket(HOST + ':' + PORT);
    socket.addEventListener('open',  () => {
        console.log('Successful connection to lobby');
        UI.connectingMessage.style.display = 'none';
        UI.lobbyElement.style.display = 'flex';

        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            lobbyServerHandler(socket, message);
        });

        UI.readyButton.addEventListener('click', () => {
            data.isYouReady = !data.isYouReady;
            socket.send(JSON.stringify({ type: 'readiness', content: data.isYouReady }));
        });
    });
}

'use strict';

import { HOST, PORT } from '../src/constants/constants.js';
import { get, UI } from './ui.js';
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
        const nameElement = get('name');
        const username = nameElement.value;
        connectToLobby(username);
    });
}

const connectToLobby = (username) => {
    const socket = new WebSocket(HOST + ':' + PORT);
    socket.addEventListener('open',  () => {
        console.log('Successful connection to server');

        socket.send(JSON.stringify({ type: 'clientUsername', content: username }));

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

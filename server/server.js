'use strict';

import { WebSocket, WebSocketServer } from 'ws';
import { handleConnection, handleMessage, handleClose } from './handlers.js';
import { PORT } from '../src/constants/constants.js';

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
    handleConnection(ws);

    ws.on('message', (message) => {
        handleMessage(ws, message);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
        handleClose(ws);
    });
});

export const closeServer = () => {
    for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.close();
        }
    }
    console.log('Server closed');
    wss.close();
}

'use strict';

import { WebSocketServer } from 'ws';
import { handleConnection, handleMessage, handleClose } from './handlers.js';
import { PORT } from '../constants.js';

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
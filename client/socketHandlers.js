'use strict';

import {
    get, showLobby, updateConnectedUsers, updateReadiness,
    showPlayers, updateUsersMoney, updateUsersBid, updateBank,
    updateDealer, showYourHandCards, updateTurnUser,
    updateFoldedUsers, updateTable, updateDisconnectedUser, displayMessage
} from './ui.js'

import { data } from './main.js';
import { game, makeMove, gameOverByFold, gameOver } from './gameManager.js';

export const lobbyServerHandler = (socket, message) => {
    const handlers = {
        'successfulConnect': (content) => {
            data.yourId = content;
            showLobby();
        },
        'newConnect': (content) => { updateConnectedUsers(content); },
        'updateReadiness': (content) => { updateReadiness(content); },
        'userLobbyDisconnected': (content) => {
            const disconnectedUserElement = get('lobbySlot' + content);
            disconnectedUserElement.style.display = 'none';
        },
        'getHandCards': (content) => { game(socket, content); },
    };

    if (handlers[message.type]) {
        handlers[message.type](message.content);
    }
};

export const gameServerHandler = (socket, message, handCards) => {
    const handlers = {
        'getPlayingUsers': (content) => {
            showPlayers(content);
            showYourHandCards(handCards);
        },
        'updateMoney': (content) => { updateUsersMoney(content); },
        'updateBid': (content) => { updateUsersBid(content); },
        'updateBank': (content) => { updateBank(content) },
        'setDealer': (content) => { updateDealer(content); },
        'turn': (content) => {
            updateTurnUser(content);
            if (content[0] === data.yourId) makeMove(socket);
        },
        'betError': (content) => { displayMessage(content); },
        'foldedUser': (content) => { updateFoldedUsers(content); },
        'updateTable': (content) => { updateTable(content); },
        'gameOverByFold': (content) => { gameOverByFold(content); },
        'userGameDisconnected': (content) => { updateDisconnectedUser(content); },
        'gameOver': (content) => { gameOver(content); },
    };

    if (handlers[message.type]) {
        handlers[message.type](message.content);
    }
};

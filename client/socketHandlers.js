'use strict';

import {
    get, UI, updateConnectedUsers, updateReadiness,
    showPlayers, updateUsersMoney, updateUsersBid,
    updateDealer, showYourHandCards, updateTurnUser,
    updateFoldedUsers, updateTable, updateDisconnectedUser
} from './ui.js'

import { data } from './main.js';
import { game, makeMove, gameOverByFold, gameOver } from './gameManager.js';

export const lobbyServerHandler = (socket, message) => {
    const handlers = {
        'getID': (content) => { data.yourID = content; },
        'newConnect': (content) => { updateConnectedUsers(content); },
        'updateReadiness': (content) => { updateReadiness(content.isReady, content.userID); },
        'userLobbyDisconnected': (content) => {
            const disconnectedUserElement = get('lobbySlot' + content);
            disconnectedUserElement.style.display = 'none';
        },
        'getHandCards': (content) => { game(socket, content); },
        'error': (content) => { alert(content); },
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
        'updateBank': (content) => { UI.bankElement.textContent = `Bank: $` + content; },
        'setDealer': (content) => { updateDealer(content); },
        'turn': (content) => {
            updateTurnUser(content);
            if (content === data.yourID) makeMove(socket);
        },
        'betError': (content) => { alert(content); },
        'foldedUser': (content) => { updateFoldedUsers(content); },
        'updateTable': (content) => { updateTable(content); },
        'gameOverByFold': (content) => { gameOverByFold(content.winnerID, content.winnerCards); },
        'userGameDisconnected': (content) => { updateDisconnectedUser(content); },
        'gameOver': (content) => { gameOver(content.winners, content.usersCombination, content.usersCards); },
    };

    if (handlers[message.type]) {
        handlers[message.type](message.content);
    }
};

'use strict';

import { FLOP_CARDS_COUNT } from '../src/constants/constants.js';
import { users, gameState } from './state.js';
import { broadcast } from './utils.js';
import { sendUpdateMoney, sendUpdateBank } from './gameUtils.js';
import { checkHighestCombination } from '../src/services/combinations.js';
import { checkWinner } from '../src/services/winner.js';
import { closeServer } from './server.js';

export const sendFlopCards = () => {
    for (let i = 0; i < FLOP_CARDS_COUNT; i++) {
        gameState.tableCards.push(gameState.deck.deal());
    }
    broadcast(JSON.stringify({ type: 'updateTable', content: gameState.tableCards }));
    gameState.isFlopCardsSent = true;
}

export const sendTurnCard = () => {
    gameState.tableCards.push(gameState.deck.deal());
    broadcast(JSON.stringify({ type: 'updateTable', content: gameState.tableCards }));
    gameState.isTurnCardSent = true;
}

export const sendRiverCard = () => {
    gameState.tableCards.push(gameState.deck.deal());
    broadcast(JSON.stringify({ type: 'updateTable', content: gameState.tableCards }));
    gameState.isRiverCardSent = true;
}

export const showdown = () => {
    const usersCombination = {};
    const usersCards = {};
    const notFoldedUsers = {};
    for (const user of Object.values(users)) {
        if (!user.hasFolded) {
            user.combination = checkHighestCombination(user.cards, gameState.tableCards);
            usersCombination[user.id] = user.combination;
            usersCards[user.id] = user.cards;
            notFoldedUsers[user.id] = user;
        }
    }

    let winnersID = checkWinner(notFoldedUsers);
    const dividedMoney = Math.floor(gameState.bank / winnersID.length);

    for (const winnerID of winnersID) {
        users[winnerID].money += dividedMoney;
    }

    gameState.bank = 0;
    sendUpdateMoney();
    sendUpdateBank();

    const winnersUsernames = winnersID.map(winnerID => users[winnerID].username);

    const message = JSON.stringify({
        type: 'gameOver',
        content: [ winnersID, usersCombination, usersCards, winnersUsernames ]
    });
    broadcast(message);
    closeServer();
}

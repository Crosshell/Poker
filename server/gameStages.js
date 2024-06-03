'use strict';

import { users, gameState } from './state.js';
import { broadcast } from './utils.js';
import { sendUpdateMoney, sendUpdateBank } from './gameUtils.js';
import { checkHighestCombination } from '../src/services/combinations.js';
import { checkWinner } from '../src/services/winner.js';
import { closeServer } from './server.js';

export const dealTableCards = (count) => {
    for (let i = 0; i < count; i++) {
        gameState.tableCards.push(gameState.deck.deal());
    }
    broadcast(JSON.stringify({ type: 'updateTable', content: gameState.tableCards }));
}

export const showdown = () => {
    const usersCombination = {};
    const usersCards = {};
    const activeUsers = {};

    for (const user of Object.values(users)) {
        if (!user.hasFolded) {
            user.combination = checkHighestCombination(user.cards, gameState.tableCards);
            usersCombination[user.id] = user.combination;
            usersCards[user.id] = user.cards;
            activeUsers[user.id] = user;
        }
    }

    let winnersId = checkWinner(activeUsers);
    const prize = Math.floor(gameState.bank / winnersId.length);

    for (const winnerId of winnersId) {
        users[winnerId].money += prize;
    }

    gameState.bank = 0;
    sendUpdateMoney();
    sendUpdateBank();

    const winnersUsernames = winnersId.map(winnerId => users[winnerId].username);

    const message = JSON.stringify({
        type: 'gameOver',
        content: [ winnersId, usersCombination, usersCards, winnersUsernames ]
    });
    broadcast(message);
    closeServer();
}

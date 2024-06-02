'use strict';

import { gameServerHandler } from './socketHandlers.js';
import { displayMessage, get, UI } from './ui.js';
import { data } from './main.js';

export const game = (socket, handCards) => {
    UI.lobbyElement.style.display = 'none';

    UI.slotsArea.style.display = 'grid';

    UI.controlPanel.style.display = 'flex';
    document.body.style.backgroundImage = "url('../images/backgrounds/green-background.jpg')";

    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        gameServerHandler(socket, message, handCards);
    });
}

export const makeMove = (socket) => {
    UI.turnNotifyElement.textContent = 'Your turn';
    UI.turnNotifyElement.style.color = 'red';

    const handleCall = () => {
        socket.send(JSON.stringify({ type: 'playerMove', content: { action: 'call' } }));
        removeButtonListeners();
    };

    const handleFold = () => {
        socket.send(JSON.stringify({ type: 'playerMove', content: { action: 'fold' } }));
        removeButtonListeners();
    };

    const handleBet = () => {
        const bet = prompt('Enter bet: ');
        socket.send(JSON.stringify({ type: 'playerMove', content: { action: 'bet', amount: parseInt(bet) } }));
        removeButtonListeners();
    }

    const removeButtonListeners = () => {
        UI.callButton.removeEventListener('click', handleCall);
        UI.foldButton.removeEventListener('click', handleFold);
        UI.betButton.removeEventListener('click', handleBet);
    };

    UI.callButton.addEventListener('click', handleCall);
    UI.foldButton.addEventListener('click', handleFold);
    UI.betButton.addEventListener('click', handleBet);
}

export const gameOverByFold = (content) => {
    const [ winnerId, winnerCards, winnerUsername ] = content;

    const currentTurnUserElement = get('gameSlot' + data.currentTurnUserId);
    currentTurnUserElement.style.background = '';

    const winnerElement = get('gameSlot' + winnerId);
    winnerElement.style.background = 'rgba(255,242,0,0.33)';
    const winnerFirstCardElement = get('firstCardSlot' + winnerId);
    const winnerSecondCardElement = get('secondCardSlot' + winnerId);

    winnerFirstCardElement.src = winnerCards[0].image;
    winnerSecondCardElement.src = winnerCards[1].image;
    displayMessage(`${winnerUsername} won due to all players folding`);
}

export const gameOver = (content) => {
    const [ winnersId, usersCombinations, usersCards, winnersUsername ] = content;

    const currentTurnUSerElement = get('gameSlot' + data.currentTurnUserId);
    currentTurnUSerElement.style.background = '';

    for (const winnerId of winnersId) {
        const winnerElement = get('gameSlot' + winnerId);
        winnerElement.style.background = 'rgba(255,242,0,0.33)';
    }

    for (const userId in usersCards) {
        const combinationElement = get('combinationSlot' + userId);
        const firstHandCardElement = get('firstCardSlot' + userId);
        const secondHandCardElement = get('secondCardSlot' + userId);
        combinationElement.textContent = usersCombinations[userId].name;
        firstHandCardElement.src = usersCards[userId][0].image;
        secondHandCardElement.src = usersCards[userId][1].image;
    }
    displayMessage(`WINNER IS ${winnersUsername} with ${usersCombinations[winnersId[0]].name}`);
}

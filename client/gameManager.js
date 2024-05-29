'use strict';

import { gameServerHandler } from './socketHandlers.js';
import { get, UI } from './ui.js';
import { data } from './main.js';

export const game = (socket, handCards) => {
    UI.lobbyElement.style.display = 'none';
    UI.slotsArea.style.display = 'grid';
    UI.tableElement.style.display = 'flex';
    UI.controlPanel.style.display = 'flex';
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
    const [ winnerID, winnerCards, winnerUsername ] = content;

    const currentTurnUSerElement = get('gameSlot' + data.currentTurnUserID);
    currentTurnUSerElement.style.background = '';

    const winnerElement = get('gameSlot' + winnerID);
    winnerElement.style.background = 'yellow';
    const winnerFirstCardElement = get('firstCardSlot' + winnerID);
    const winnerSecondCardElement = get('secondCardSlot' + winnerID);

    winnerFirstCardElement.src = winnerCards[0].image;
    winnerSecondCardElement.src = winnerCards[1].image;
    alert(`${winnerUsername} won due to all players folding`);
}

export const gameOver = (content) => {
    const [ winnersID, usersCombinations, usersCards, winnersUsername ] = content;

    const currentTurnUSerElement = get('gameSlot' + data.currentTurnUserID);
    currentTurnUSerElement.style.background = '';

    for (const winnerID of winnersID) {
        const winnerElement = get('gameSlot' + winnerID);
        winnerElement.style.background = 'yellow';
    }

    for (const userID in usersCards) {
        const combinationElement = get('combinationSlot' + userID);
        const firstHandCardElement = get('firstCardSlot' + userID);
        const secondHandCardElement = get('secondCardSlot' + userID);
        combinationElement.textContent = usersCombinations[userID].name;
        firstHandCardElement.src = usersCards[userID][0].image;
        secondHandCardElement.src = usersCards[userID][1].image;
    }
    alert(`WINNER IS ${winnersUsername} with ${usersCombinations[winnersID[0]].name}`);
}

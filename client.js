'use strict';

import { HOST, PORT } from './constants.js';

const get = (id) => document.getElementById(id);
let yourID = 0;
let isYouReady = false;
let currentTurnUserID = 0;

const UI = {
    connectButton: get('connect'),
    startScreenElement: get('startScreen'),
    connectingMessage: get('connectingMessage'),
    lobbyElement: get('lobby'),
    readyButton: get('ready'),
    slotsArea: get('slotsArea'),
    tableElement: get('table'),
    bankElement: get('bank'),
    controlPanel: get('controlPanel'),
    callButton: get('call'),
    foldButton: get('fold'),
    betButton: get('bet'),
    flopCard1Element: get('flopCard1'),
    flopCard2Element: get('flopCard2'),
    flopCard3Element: get('flopCard3'),
    turnCardElement: get('turnCard'),
    riverCardElement: get('riverCard'),
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
            isYouReady = !isYouReady;
            socket.send(JSON.stringify({ type: 'readiness', content: isYouReady }));
        });
    });
}

const lobbyServerHandler = (socket, message) => {
    const handlers = {
        'getID': (content) => { yourID = content; },
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

const updateConnectedUsers = (connectedUsers) => {
    for (const userID of connectedUsers) {
        const connectedUserElement = get('lobbySlot' + userID);
        connectedUserElement.style.display = 'flex';
    }
}

const updateReadiness = (isUserReady, userID) => {
    const userLobbyElement = get('lobbySlot' + userID);
    const readiness = isUserReady ? 'Ready' : 'Not Ready';
    if (userID === yourID) {
        userLobbyElement.textContent = `User ${userID} (You): ${readiness}`;
    } else {
        userLobbyElement.textContent = `User ${userID}: ${readiness}`;
    }
}

const game = (socket, handCards) => {
    UI.lobbyElement.style.display = 'none';
    UI.slotsArea.style.display = 'grid';
    UI.tableElement.style.display = 'flex';
    UI.controlPanel.style.display = 'flex';
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        gameServerHandler(socket, message, handCards);
    });
}

const gameServerHandler = (socket, message, handCards) => {
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
            if (content === yourID) makeMove(socket);
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

const showPlayers = (usersToShow) => {
    for (const userID of usersToShow) {
        const gameUserElement = get('gameSlot' + userID);
        gameUserElement.style.display = 'flex';
        if (userID === yourID){
            const yourNameElement = get('nameSlot' + userID);
            yourNameElement.textContent = 'YOU';
        }
    }
}

const showYourHandCards = (handCards) => {
    const firstHandCardElement = get('firstCardSlot' + yourID);
    const secondHandCardElement = get('secondCardSlot' + yourID);
    firstHandCardElement.src = handCards[0].image;
    secondHandCardElement.src = handCards[1].image;
}

const updateUsersMoney = (usersMoney) => {
    for (const userID in usersMoney) {
        const userMoneyElement = get('moneySlot' + userID);
        userMoneyElement.textContent = 'Money: $' + usersMoney[userID];
    }
}

const updateUsersBid = (usersBid) => {
    for (const userID in usersBid) {
        const userBidElement = get('bidSlot' + userID);
        userBidElement.textContent = 'Bid: $' + usersBid[userID];
    }
}

const updateDealer = (dealer) => {
    const dealerElement = get('dealerSlot' + dealer);
    dealerElement.textContent = 'Dealer';
}

const updateTurnUser = (turnUserID) => {
    if (currentTurnUserID) {
        const previousGameUserElement = get('gameSlot' + currentTurnUserID);
        previousGameUserElement.style.background = '';
    }

    const gameUserElement = get('gameSlot' + turnUserID);
    gameUserElement.style.background = '#c2c2c2';

    currentTurnUserID = turnUserID;
}

const makeMove = (socket) => {
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

const updateFoldedUsers = (foldedUserID) => {
    alert(`User ${foldedUserID} has folded`);
    const foldedUserElement = get('gameSlot' + foldedUserID);
    foldedUserElement.style.color = 'rgba(199,199,199,0.94)';
}

const updateDisconnectedUser = (disconnectedUserID) => {
    alert(`User ${disconnectedUserID} disconnected`);
    const disconnectedUserElement = get('gameSlot' + disconnectedUserID);
    disconnectedUserElement.style.color = 'rgba(199,199,199,0.94)';
}

const updateTable = (tableCards) => {
    UI.flopCard1Element.src = tableCards[0].image;
    UI.flopCard2Element.src = tableCards[1].image;
    UI.flopCard3Element.src = tableCards[2].image;
    UI.turnCardElement.src = tableCards[3].image;
    UI.riverCardElement.src = tableCards[4].image;
}

const gameOverByFold = (winnerID, winnerCards) => {
    const currentTurnUSerElement = get('gameSlot' + currentTurnUserID);
    currentTurnUSerElement.style.background = '';

    const winnerElement = get('gameSlot' + winnerID);
    winnerElement.style.background = 'yellow';
    const winnerFirstCardElement = get('firstCardSlot' + winnerID);
    const winnerSecondCardElement = get('secondCardSlot' + winnerID);

    winnerFirstCardElement.src = winnerCards[0].image;
    winnerSecondCardElement.src = winnerCards[1].image;
    alert(`User ${winnerID} won due to all players folding`);
}

const gameOver = (winnersID, usersCombinations, usersCards) => {
    console.dir({winnersID: winnersID, usersCombinations: usersCombinations, usersCards: usersCards}, {depth: null});
    const currentTurnUSerElement = get('gameSlot' + currentTurnUserID);
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
    alert(`WINNER IS User ${winnersID} with ${usersCombinations[winnersID[0]].name}`);
}

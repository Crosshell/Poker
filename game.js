'use strict';

const get = (id) => document.getElementById(id);

let yourID = 0;
let isYouReady = false;
const connectButton = get('connect');
const startScreenElement = get('startScreen');
const connectingMessage = get('connectingMessage');
const lobbyElement = get('lobby');
const readyButton = get('ready');
const slotsArea = get('slotsArea');
const tableElement = get('table');
const bankElement = get('bank');
const controlPanel = get('controlPanel');
const callButton = get('call');
const foldButton = get('fold');
const betButton = get('bet');
const flopCard1Element = get('flopCard1');
const flopCard2Element = get('flopCard2');
const flopCard3Element = get('flopCard3');
const turnCardElement = get('turnCard');
const riverCardElement = get('riverCard');

document.addEventListener('DOMContentLoaded', () => {
    startScreen();
});

const startScreen = () => {
    connectButton.addEventListener('click', () => {
        startScreenElement.style.display = 'none';
        connectingMessage.style.display = 'block';
        connectToLobby();
    });
}

const connectToLobby = () => {
    const socket = new WebSocket('ws://127.0.0.1:8080');
    socket.addEventListener('open',  () => {
        console.log('Successful connection to lobby');
        connectingMessage.style.display = 'none';
        lobbyElement.style.display = 'flex';

        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            lobbyServerHandler(socket, message);
        });
        readyButton.addEventListener('click', () => {
            isYouReady = !isYouReady;
            socket.send(JSON.stringify({ type: 'readiness', content: isYouReady }));
        });
    });
}

const lobbyServerHandler = (socket, message) => {
    switch (message.type) {
        case 'getID':
            yourID = message.content;
            break;
        case 'newConnect':
            const connectedUsers = message.content;
            for (const userID of connectedUsers) {
                const connectedUserElement = get('lobbySlot' + userID);
                connectedUserElement.style.display = 'flex';
            }
            break;
        case 'updateReadiness':
            const isUserReady = message.content.isReady;
            const userID = message.content.userID;
            const userLobbyElement = get('lobbySlot' + userID);
            const readiness = isUserReady ? 'Ready' : 'Not Ready';
            if (userID === yourID) {
                userLobbyElement.textContent = `User ${userID} (You): ${readiness}`;
            } else {
                userLobbyElement.textContent = `User ${userID}: ${readiness}`;
            }
            break;
        case 'userDisconnected':
            const disconnectedUserID = message.content;
            const disconnectedUserElement = get('lobbySlot' + disconnectedUserID);
            disconnectedUserElement.style.display = 'none';
            break;
        case 'getHandCards':
            lobbyElement.style.display = 'none';
            game(socket, message.content);
            break;
        case 'error':
            alert(message.content);
            break;
    }
}

const game = (socket, handCards) => {
    slotsArea.style.display = 'grid';
    tableElement.style.display = 'flex';
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        gameServerHandler(socket, message, handCards);
    });
}

const gameServerHandler = (socket, message, handCards) => {
    switch (message.type) {
        case 'getPlayingUsers':
            showPlayers(message.content);
            showYourHandCards(handCards);
            break;
        case 'updateMoney':
            updateUsersMoney(message.content);
            break;
        case 'updateBid':
            updateUsersBid(message.content);
            break;
        case 'updateBank':
            bankElement.textContent = `Bank: $` + message.content;
            break;
        case 'getDealer':
            updateDealer(message.content);
            break;
        case 'turn':
            updateTurnUser(message.content);
            if (message.content === yourID) makeMove(socket);
            break;
        case 'betError':
            alert(message.content);
            break;
        case 'foldedUser':
            updateFoldedUsers(message.content);
            break;
        case 'updateTable':
            updateTable(message.content);
            break;
        case 'gameOver':
            alert(`WINNER IS ${message.content.user} with ${message.content.combination}`);
            break;
    }
}

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
    firstHandCardElement.src = `images/cards/${handCards[0].rank}-${handCards[0].suit}.png`;
    secondHandCardElement.src = `images/cards/${handCards[1].rank}-${handCards[1].suit}.png`;
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

let currentTurnUserID = 0;
const updateTurnUser = (turnUserID) => {
    if (currentTurnUserID) {
        const previousGameUserHTML = get('gameSlot' + currentTurnUserID);
        previousGameUserHTML.style.background = '';
    }

    const gameUserElement = get('gameSlot' + turnUserID);
    gameUserElement.style.background = '#c2c2c2';

    currentTurnUserID = turnUserID;
}

const makeMove = (socket) => {
    controlPanel.style.display = 'flex';

    const handleCall = () => {
        controlPanel.style.display = 'none';
        socket.send(JSON.stringify({ type: 'playerMove', content: { action: 'call' } }));
        removeButtonListeners();
    };

    const handleFold = () => {
        controlPanel.style.display = 'none';
        socket.send(JSON.stringify({ type: 'playerMove', content: { action: 'fold' } }));
        removeButtonListeners();
    };

    const handleBet = () => {
        let validBet = false;
        while (!validBet) {
            const bet = prompt('Enter bet: ');
            if (bet === null) {
                break;
            } else if (!isNaN(parseFloat(bet))) {
                controlPanel.style.display = 'none';
                socket.send(JSON.stringify({ type: 'playerMove', content: { action: 'bet', amount: parseFloat(bet) } }));
                validBet = true;
            } else {
                alert('Please enter a valid bet amount.');
            }
        }
        removeButtonListeners();
    }

    const removeButtonListeners = () => {
        callButton.removeEventListener('click', handleCall);
        foldButton.removeEventListener('click', handleFold);
        betButton.removeEventListener('click', handleBet);
    };

    callButton.addEventListener('click', handleCall);
    foldButton.addEventListener('click', handleFold);
    betButton.addEventListener('click', handleBet);
}
const updateFoldedUsers = (foldedUserID) => {
    alert(`User ${foldedUserID} has folded`);
    const foldedUserElement = get('gameSlot' + foldedUserID);
    foldedUserElement.style.color = 'rgba(199,199,199,0.94)';
}

const updateTable = (tableCards) => {
    flopCard1Element.src = `images/cards/${tableCards[0].rank}-${tableCards[0].suit}.png`;
    flopCard2Element.src = `images/cards/${tableCards[1].rank}-${tableCards[1].suit}.png`;
    flopCard3Element.src = `images/cards/${tableCards[2].rank}-${tableCards[2].suit}.png`;
    turnCardElement.src = `images/cards/${tableCards[3].rank}-${tableCards[3].suit}.png`;
    riverCardElement.src = `images/cards/${tableCards[4].rank}-${tableCards[4].suit}.png`;
}
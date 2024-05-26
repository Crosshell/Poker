'use strict';

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
    const socket = new WebSocket('ws://127.0.0.1:8080');
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
        case 'userLobbyDisconnected':
            const disconnectedUserID = message.content;
            const disconnectedUserElement = get('lobbySlot' + disconnectedUserID);
            disconnectedUserElement.style.display = 'none';
            break;
        case 'getHandCards':
            UI.lobbyElement.style.display = 'none';
            game(socket, message.content);
            break;
        case 'error':
            alert(message.content);
            break;
    }
}

const game = (socket, handCards) => {
    UI.slotsArea.style.display = 'grid';
    UI.tableElement.style.display = 'flex';
    UI.controlPanel.style.display = 'flex';
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
            UI.bankElement.textContent = `Bank: $` + message.content;
            break;
        case 'setDealer':
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
        case 'gameOverByFold':
            gameOverByFold(message.content.winnerID, message.content.winnerCards);
            break;
        case 'userGameDisconnected':
            updateDisconnectedUser(message.content);
            break;
        case 'gameOver':
            gameOver(message.content.winners, message.content.usersCombination, message.content.usersCards);
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
    UI.flopCard1Element.src = `images/cards/${tableCards[0].rank}-${tableCards[0].suit}.png`;
    UI.flopCard2Element.src = `images/cards/${tableCards[1].rank}-${tableCards[1].suit}.png`;
    UI.flopCard3Element.src = `images/cards/${tableCards[2].rank}-${tableCards[2].suit}.png`;
    UI.turnCardElement.src = `images/cards/${tableCards[3].rank}-${tableCards[3].suit}.png`;
    UI.riverCardElement.src = `images/cards/${tableCards[4].rank}-${tableCards[4].suit}.png`;
}

const gameOverByFold = (winnerID, winnerCards) => {
    const currentTurnUSerElement = get('gameSlot' + currentTurnUserID);
    currentTurnUSerElement.style.background = '';

    const winnerElement = get('gameSlot' + winnerID);
    winnerElement.style.background = 'yellow';
    const winnerFirstCardElement = get('firstCardSlot' + winnerID);
    const winnerSecondCardElement = get('secondCardSlot' + winnerID);

    winnerFirstCardElement.src = `images/cards/${winnerCards[0].rank}-${winnerCards[0].suit}.png`;
    winnerSecondCardElement.src = `images/cards/${winnerCards[1].rank}-${winnerCards[1].suit}.png`;
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
        firstHandCardElement.src = `images/cards/${usersCards[userID][0].rank}-${usersCards[userID][0].suit}.png`;
        secondHandCardElement.src = `images/cards/${usersCards[userID][1].rank}-${usersCards[userID][1].suit}.png`;
    }
    alert(`WINNER IS User ${winnersID} with ${usersCombinations[winnersID[0]].name}`);
}
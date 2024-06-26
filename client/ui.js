'use strict';

import { data } from './main.js';

export const get = (id) => document.getElementById(id);

export const UI = {
    connectButton: get('connect'),
    startScreenElement: get('startScreen'),
    connectingMessage: get('connectingMessage'),
    lobbyElement: get('lobby'),
    readyButton: get('ready'),
    slotsArea: get('slotsArea'),
    bankElement: get('bank'),
    turnNotifyElement: get('turnNotify'),
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

export const showLobby = () => {
    console.log('Successful connection to lobby');
    UI.startScreenElement.style.display = 'none';
    UI.connectingMessage.style.display = 'block';
    UI.connectingMessage.style.display = 'none';
    UI.lobbyElement.style.display = 'flex';
}

export const updateConnectedUsers = (connectedUsers) => {
    for (const userId of connectedUsers) {
        const connectedUserElement = get('lobbySlot' + userId);
        connectedUserElement.style.display = 'flex';
    }
}

export const updateReadiness = (content) => {
    const [ isUserReady, userId, username ] = [ content.isReady, content.userId, content.username ];
    if (userId === data.yourId) {
        changeReadyButton(content.isReady);
    }
    const userLobbyElement = get('lobbySlot' + userId);
    const readiness = isUserReady ? 'Ready' : 'Not Ready';
    userLobbyElement.textContent = username + ': ' + readiness;
}

const changeReadyButton = (ready) => {
    if (ready) {
        UI.readyButton.style.backgroundColor = '#1df817';
        UI.readyButton.style.boxShadow = '0 5px 5px #29731c, 0 9px 0 #14a81b, 0 9px 10px rgba(0,0,0,0.4), inset 0 2px 9px rgba(255,255,255,0.2), inset 0 -2px 9px rgba(0,0,0,0.2)';
        UI.readyButton.style.borderBottom = '1px solid rgba(68, 241, 36, 0.2)';
    } else {
        UI.readyButton.style.backgroundColor = '#f81717';
        UI.readyButton.style.boxShadow = '0 5px 5px #731c1c, 0 9px 0 #a81414, 0 9px 10px rgba(0,0,0,0.4), inset 0 2px 9px rgba(255,255,255,0.2), inset 0 -2px 9px rgba(0,0,0,0.2)';
        UI.readyButton.style.borderBottom = '1px solid rgba(241, 36, 36, 0.2)';
    }
}

export const showPlayers = (users) => {
    for (const user of users) {
        const gameUserElement = get('gameSlot' + user.id);
        gameUserElement.style.display = 'flex';
        const userNameElement = get('nameSlot' + user.id);
        userNameElement.textContent = user.username;
    }
}

export const showYourHandCards = (handCards) => {
    const firstHandCardElement = get('firstCardSlot' + data.yourId);
    const secondHandCardElement = get('secondCardSlot' + data.yourId);
    firstHandCardElement.src = handCards[0].image;
    secondHandCardElement.src = handCards[1].image;
}

export const updateUsersMoney = (usersMoney) => {
    for (const userId in usersMoney) {
        const userMoneyElement = get('moneySlot' + userId);
        userMoneyElement.textContent = 'Money: $' + usersMoney[userId];
    }
}

export const updateUsersBid = (usersBid) => {
    for (const userId in usersBid) {
        const userBidElement = get('bidSlot' + userId);
        userBidElement.textContent = 'Bid: $' + usersBid[userId];
    }
}

export const updateBank = (money) => {
    UI.bankElement.textContent = `Bank: $` + money;
}

export const updateDealer = (dealer) => {
    const dealerElement = get('dealerSlot' + dealer);
    dealerElement.textContent = 'Dealer';
}

export const updateTurnUser = (content) => {
    const [ turnUserId, turnUsername ] = content;
    if (data.currentTurnUserId) {
        const previousGameUserElement = get('gameSlot' + data.currentTurnUserId);
        previousGameUserElement.style.background = '';
    }

    const gameUserElement = get('gameSlot' + turnUserId);
    gameUserElement.style.background = 'rgba(24,255,0,0.29)';
    UI.turnNotifyElement.textContent = turnUsername + '\'s turn';
    UI.turnNotifyElement.style.color = 'white';
    data.currentTurnUserId = turnUserId;
}

export const updateFoldedUsers = (content) => {
    const [ foldedUserId, foldedUsername ] = content;

    displayMessage(foldedUsername + ' has folded');
    const foldedUserElement = get('gameSlot' + foldedUserId);
    foldedUserElement.style.color = 'rgba(255,0,0,0.94)';
}

export const updateDisconnectedUser = (content) => {
    const [ disconnectedUserId, disconnectedUsername ] = content;
    displayMessage(disconnectedUsername + ' disconnected')
    const disconnectedUserElement = get('gameSlot' + disconnectedUserId);
    disconnectedUserElement.style.color = 'rgba(255,0,0,0.94)';
}

export const updateTable = (tableCards) => {
    UI.flopCard1Element.src = tableCards[0].image;
    UI.flopCard2Element.src = tableCards[1].image;
    UI.flopCard3Element.src = tableCards[2].image;
    UI.turnCardElement.src = tableCards[3].image;
    UI.riverCardElement.src = tableCards[4].image;
}

const messageQueue = [];
let isDisplayingMessage = false;

export const displayMessage = (message) => {
    messageQueue.push(message);
    processQueue();
}

const processQueue  = () => {
    if (isDisplayingMessage || messageQueue.length === 0) {
        return;
    }

    isDisplayingMessage = true;
    const message = messageQueue.shift();

    let toast = document.createElement('div');
    toast.innerText = message;
    toast.className = 'toast-message';

    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
        isDisplayingMessage = false;
        processQueue();
    }, 3000);
}

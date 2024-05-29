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
    tableElement: get('table'),
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
    for (const userID of connectedUsers) {
        const connectedUserElement = get('lobbySlot' + userID);
        connectedUserElement.style.display = 'flex';
    }
}

export const updateReadiness = (content) => {
    const [ isUserReady, userID, username ] = [ content.isReady, content.userID, content.username ];

    const userLobbyElement = get('lobbySlot' + userID);
    const readiness = isUserReady ? 'Ready' : 'Not Ready';
    userLobbyElement.textContent = username + ': ' + readiness;
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
    const firstHandCardElement = get('firstCardSlot' + data.yourID);
    const secondHandCardElement = get('secondCardSlot' + data.yourID);
    firstHandCardElement.src = handCards[0].image;
    secondHandCardElement.src = handCards[1].image;
}

export const updateUsersMoney = (usersMoney) => {
    for (const userID in usersMoney) {
        const userMoneyElement = get('moneySlot' + userID);
        userMoneyElement.textContent = 'Money: $' + usersMoney[userID];
    }
}

export const updateUsersBid = (usersBid) => {
    for (const userID in usersBid) {
        const userBidElement = get('bidSlot' + userID);
        userBidElement.textContent = 'Bid: $' + usersBid[userID];
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
    const [ turnUserID, turnUsername ] = content;
    if (data.currentTurnUserID) {
        const previousGameUserElement = get('gameSlot' + data.currentTurnUserID);
        previousGameUserElement.style.background = '';
    }

    const gameUserElement = get('gameSlot' + turnUserID);
    gameUserElement.style.background = '#c2c2c2';
    UI.turnNotifyElement.textContent = turnUsername + '\'s turn';
    UI.turnNotifyElement.style.color = 'black';
    data.currentTurnUserID = turnUserID;
}

export const updateFoldedUsers = (content) => {
    const [ foldedUserID, foldedUsername ] = content;

    alert(foldedUsername + ' has folded');
    const foldedUserElement = get('gameSlot' + foldedUserID);
    foldedUserElement.style.color = 'rgba(199,199,199,0.94)';
}

export const updateDisconnectedUser = (content) => {
    const [ disconnectedUserID, disconnectedUsername ] = content;

    alert(disconnectedUsername + ' disconnected');
    const disconnectedUserElement = get('gameSlot' + disconnectedUserID);
    disconnectedUserElement.style.color = 'rgba(199,199,199,0.94)';
}

export const updateTable = (tableCards) => {
    UI.flopCard1Element.src = tableCards[0].image;
    UI.flopCard2Element.src = tableCards[1].image;
    UI.flopCard3Element.src = tableCards[2].image;
    UI.turnCardElement.src = tableCards[3].image;
    UI.riverCardElement.src = tableCards[4].image;
}

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

export const changeReadiness = (socket) => {
    data.isYouReady = !data.isYouReady;
    socket.send(JSON.stringify({ type: 'readiness', content: data.isYouReady }));
    if (data.isYouReady) {
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
    gameUserElement.style.background = 'rgba(24,255,0,0.29)';
    UI.turnNotifyElement.textContent = turnUsername + '\'s turn';
    UI.turnNotifyElement.style.color = 'white';
    data.currentTurnUserID = turnUserID;
}

export const updateFoldedUsers = (content) => {
    const [ foldedUserID, foldedUsername ] = content;

    displayMessage(foldedUsername + ' has folded');
    const foldedUserElement = get('gameSlot' + foldedUserID);
    foldedUserElement.style.color = 'rgba(255,0,0,0.94)';
}

export const updateDisconnectedUser = (content) => {
    const [ disconnectedUserID, disconnectedUsername ] = content;
    displayMessage(disconnectedUsername + ' disconnected')
    const disconnectedUserElement = get('gameSlot' + disconnectedUserID);
    disconnectedUserElement.style.color = 'rgba(255,0,0,0.94)';
}

export const updateTable = (tableCards) => {
    UI.flopCard1Element.src = tableCards[0].image;
    UI.flopCard2Element.src = tableCards[1].image;
    UI.flopCard3Element.src = tableCards[2].image;
    UI.turnCardElement.src = tableCards[3].image;
    UI.riverCardElement.src = tableCards[4].image;
}

export const displayMessage = (message) => {
    let toast = document.createElement('div');
    toast.innerText = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '10px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    toast.style.color = '#fff';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
}
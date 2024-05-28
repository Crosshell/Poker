'use strict';

import { gameState } from './state.js';
import { dealCardsToUsers, sendPlayingUsers, sendUpdateMoney, sendUpdateBid, addBidsToBank, sendUpdateBank, setDealer, doBlinds, updatePlayerTurn } from './gameUtils.js';

export const startGame = () => {
    gameState.isGameStarted = true;
    gameState.deck.generate();
    gameState.deck.shuffle();
    dealCardsToUsers();
    sendPlayingUsers();
    setDealer();
    doBlinds();
    sendUpdateMoney();
    sendUpdateBid();
    addBidsToBank();
    sendUpdateBank();
    updatePlayerTurn();
}

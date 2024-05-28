'use strict';

import { Deck } from '../deck.js';
import { BIG_BLIND, STREETS } from '../constants.js'

export const users = {};

export let gameState = {
    isGameStarted: false,
    queue: [],
    deck: new Deck(),
    bank: 0,
    tableCards: [],
    highestBid: BIG_BLIND,
    dealerId: 0,
    currentStreet: STREETS[0],
    isFlopCardsSent: false,
    isTurnCardSent: false,
    isRiverCardSent: false
};

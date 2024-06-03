'use strict';

import { Deck } from '../src/models/deck.js';
import { BIG_BLIND, STREETS } from '../src/constants/constants.js'

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
};

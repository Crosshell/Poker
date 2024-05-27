'use strict';

import {Card} from './card.js';
import {RANKS, SUITS} from './constants.js';

export class Deck {
    constructor() {
        this.deck = [];
    }
    generate(){
        for (const rank of RANKS) {
            for (const suit of SUITS) {
                const card = new Card(rank, suit);
                this.deck.push(card);
            }
        }
    }
    shuffle() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }
    deal() {
        return this.deck.pop();
    }
}


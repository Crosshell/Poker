'use strict';

export class Card {
    constructor(rank, suit) {
        this.rank = rank;
        this.suit = suit;
        this.image = `images/cards/${this.rank}-${this.suit}.png`
    }
}
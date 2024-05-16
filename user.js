import {MAX_HAND_SIZE, RANKS} from "./constants.js";
import {checkHighestCombination} from "./combinations.js";

class User {
    constructor() {
        this.cards = [];
        this.combination = null;
    }

    dealCards(deck) {
        for (let i = 0; i < MAX_HAND_SIZE; i++) {
            const card = deck.deal();
            this.cards.push(card);
        }
    }

    sortHandCards() {
        this.cards.sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank));
    }

    setCombination(tableCards) {
        this.combination = checkHighestCombination(this.cards, tableCards);
    }
}

export const createUsers = (deck, tableCards, numOfPlayers) => {
    const users = {};
    for (let i = 0; i < numOfPlayers; i++){
        const user = new User(tableCards);
        user.dealCards(deck);
        user.sortHandCards();
        user.setCombination(tableCards);
        users[`User ${i+1}`] = (user);
    }
    return users;
}
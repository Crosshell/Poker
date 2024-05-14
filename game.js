import {Deck} from './deck.js';
import {TABLE_CARD_SIZE, RANKS, MAX_HAND_SIZE, NUMBER_OF_PLAYERS} from "./constants.js";
import {checkHighestCombination} from "./combinations.js";
import {checkWinner} from "./winner.js";


const deck = new Deck();
deck.generate();
deck.shuffle();

const dealTableCards = () => {
    const tableCards = [];
    for (let i = 0; i < TABLE_CARD_SIZE; i++){
        const card = deck.deal();
        tableCards.push(card);
    }
    return tableCards;
}

const tableCards = dealTableCards();

console.log('Cards on the table:');
console.log(tableCards);

class User {
    constructor(tableCards) {
        this.cards = this.sortHandCards(this.dealCards());
        this.combination = checkHighestCombination(this.cards, tableCards);
    }

    dealCards() {
        const cards = [];
        for (let i = 0; i < MAX_HAND_SIZE; i++) {
            const card = deck.deal();
            cards.push(card);
        }
        return cards;
    }

    sortHandCards(cards) {
        return cards.sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank));
    }
}
const createUsers = () => {
    const users = {};
    for (let i = 0; i < NUMBER_OF_PLAYERS; i++){
        const user = new User(tableCards);
        users[`User ${i+1}`] = (user);
    }
    return users;
}

const users = createUsers();

console.dir(users, { depth: null });
const winner = checkWinner(users);
console.log('Winner is ' + winner);

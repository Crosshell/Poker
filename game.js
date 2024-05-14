import {Deck} from './deck.js';
import {TABLE_CARD_SIZE} from "./constants.js";
import {createUsers} from "./user.js";
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

const users = createUsers(deck, tableCards);

console.dir(users, { depth: null });
const winner = checkWinner(users);
console.log('Winner is ' + winner);

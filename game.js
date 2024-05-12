import {Deck} from './deck.js';
import {TABLE_CARD_SIZE, RANKS} from "./constants.js";
import {checkHighestCombination} from "./combinations.js";
import {checkWinner} from "./winner.js";



const sortCards = (cards) => {
    return cards.sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank));
}


let deck = new Deck();
deck.generate();
deck.shuffle();


let firstUserCards = [];
let secondUserCards = [];

firstUserCards.push(deck.deal());
firstUserCards.push(deck.deal());

secondUserCards.push(deck.deal());
secondUserCards.push(deck.deal());
firstUserCards = sortCards(firstUserCards);
secondUserCards = sortCards(secondUserCards);

let users = {
    'User 1': {cards: firstUserCards, combination: null},
    'User 2': {cards: secondUserCards, combination: null}
};

let tableCards = [];
for (let i = 0; i < TABLE_CARD_SIZE; i++){
    let card = deck.deal();
    tableCards.push(card);
}

console.log('Cards on the table:');
console.log(tableCards);

users['User 1'].combination = checkHighestCombination(firstUserCards, tableCards);
users['User 2'].combination = checkHighestCombination(secondUserCards, tableCards);

console.dir(users, { depth: null });


const winner = checkWinner(users);
if (winner){
    console.log('Winner is ' + winner);
}
else {
    console.log('It\'s a Tie' + winner);
}

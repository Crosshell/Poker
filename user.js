import {MAX_HAND_SIZE, RANKS} from "./constants.js";

export const dealUserCards = (deck) => {
    const cards = [];
    for (let i = 0; i < MAX_HAND_SIZE; i++) {
        const card = deck.deal();
        cards.push(card);
    }
    cards.sort((a, b) => RANKS.indexOf(b.rank) - RANKS.indexOf(a.rank));
    return cards;
}
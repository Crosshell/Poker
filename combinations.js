import {MAX_COMBINATION_SIZE, RANKS} from "./constants.js";


const isRoyalFlush = (straightCards) => {
    if (isSameSuit(straightCards)) {
        if (straightCards[0].rank === '10') {
            return {name: 'Royal flush', cards: straightCards};
        }
    }
    return false
}
const isStraightFlush = (straightCards) => {
    if (isSameSuit(straightCards)) {
        return {name: 'Straight flush', cards: straightCards};
    }
    return false
}
const isFourKind = (cards, ranksCount) => {
    for (const rank in ranksCount){
        if (ranksCount[rank] === 4){
            const fourOfAKindRank = rank;
            const fourOfAKindCards = cards.filter(card => card.rank === fourOfAKindRank);
            return {name: 'Four of a kind', cards: fourOfAKindCards};
        }
    }
    return false
}
const isFullHouse = (cards, tripleCards, doubleCards) => {
    if (tripleCards && doubleCards) {
        const tripleCardsArray = cards.filter(card => card.rank === tripleCards);
        const doubleCardsArray = cards.filter(card => card.rank === doubleCards);
        return {name: 'Full house', cards: [...tripleCardsArray, ...doubleCardsArray]};
    }
    return false
}
const isFlush = (cards, suitsCount) => {
    for (const suit in suitsCount) {
        if (suitsCount[suit] >= MAX_COMBINATION_SIZE) {
            const flushCards = cards.filter(card => card.suit === suit);
            const lastFlushCards  = flushCards.slice(-MAX_COMBINATION_SIZE);
            return {name: 'Flush', cards: lastFlushCards };
        }
    }
    return false;
}
const isStraight = (straightCards) => {
    if (straightCards.length === MAX_COMBINATION_SIZE){
        return {name: 'Straight', cards: straightCards};
    }
    return false;
}
const isThreeKind = (cards, tripleCards) => {
    if (tripleCards) {
        const tripleCardsArray = cards.filter(card => card.rank === tripleCards);
        return {name: 'Three of a kind', cards: tripleCardsArray};
    }
    return false;
}
const isTwoPair = (cards, doubleCards, prevDoubleCards) => {
    if (prevDoubleCards !== doubleCards && prevDoubleCards && doubleCards) {
        const doubleCardsArray = cards.filter(card => card.rank === doubleCards);
        const prevDoubleCardsArray = cards.filter(card => card.rank === prevDoubleCards);
        return {name: 'Two pair', cards: [...doubleCardsArray, ...prevDoubleCardsArray]};
    }
    return false
}
const isPair = (cards, doubleCards) => {
    if (doubleCards) {
        const doubleCardsArray = cards.filter(card => card.rank === doubleCards);
        return {name: 'Pair', cards: doubleCardsArray};
    }
    return false;
}
const getSortedByRanks = (cardsToSort) => {
    return cardsToSort.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
}
const getUniqueRanks = (sortedRanks) => {
    let uniqueRanks = {};
    return sortedRanks.filter(card => {
        if (!uniqueRanks[card.rank]) {
            uniqueRanks[card.rank] = true;
            return true;
        }
        return false;
    });
}
const getStraightCards = (uniqueRanksArray) => {
    if (uniqueRanksArray.length >= MAX_COMBINATION_SIZE) {
        let consecutiveCount = 1;
        let chainCards = [uniqueRanksArray[uniqueRanksArray.length - 1]];
        for (let i = uniqueRanksArray.length - 2; i >= 0; i--) {
            const prevRankIndex = RANKS.indexOf(uniqueRanksArray[i + 1].rank);
            const currentRankIndex = RANKS.indexOf(uniqueRanksArray[i].rank);
            if (prevRankIndex - currentRankIndex === 1) {
                consecutiveCount++;
                chainCards.unshift(uniqueRanksArray[i]);
                if (consecutiveCount === MAX_COMBINATION_SIZE) {
                    return [...chainCards];
                }
            } else {
                consecutiveCount = 1;
                chainCards = [uniqueRanksArray[i]];
            }
        }
    }
    return false;
}

const isSameSuit = (straightCards) => {
    if (straightCards.length === MAX_COMBINATION_SIZE) {
        for (let i = 0; i < straightCards.length; i++) {
            if (straightCards[0].suit !== straightCards[i].suit) {
                return false
            }
        }
        return true
    }
    return false;
}
const isTripleCards = (ranksCount) => {
    let tripleCards = false
    for (const rank in ranksCount) {
        if (ranksCount[rank] === 3) {
            tripleCards = rank;
        }
    }
    return tripleCards

}
const isDoubleCards = (ranksCount) => {
    let doubleCards = false
    for (const rank in ranksCount) {
        if (ranksCount[rank] === 2) {
            doubleCards = rank;
        }
    }
    return doubleCards;
}
const isPrevDoubleCards = (ranksCount) => {
    let curDoubleCards = false;
    let prevDoubleCards = false;
    for (const rank in ranksCount) {
        prevDoubleCards = curDoubleCards;
        if (ranksCount[rank] === 2){
            curDoubleCards = rank;
        }
    }
    return prevDoubleCards;
}
export const checkHighestCombination = (user, table) => {
    let cards = [...table, ...user];
    cards = getSortedByRanks(cards);
    let ranksCount = {};
    let suitsCount = {};

    for (const card of cards) {
        ranksCount[card.rank] = ranksCount[card.rank] + 1 || 1;
        suitsCount[card.suit] = suitsCount[card.suit] + 1 || 1;
    }

    const uniqueRanksArray = getUniqueRanks(cards);
    const straightCards = getStraightCards(uniqueRanksArray);
    const tripleCards = isTripleCards(ranksCount);
    const doubleCards = isDoubleCards(ranksCount);
    const prevDoubleCards = isPrevDoubleCards(ranksCount);


    if (isRoyalFlush(straightCards)) return isRoyalFlush(straightCards);
    if (isStraightFlush(straightCards)) return isStraightFlush(straightCards);
    if (isFourKind(cards, ranksCount)) return isFourKind(cards, ranksCount);
    if (isFullHouse(cards, tripleCards, doubleCards)) return isFullHouse(cards, tripleCards, doubleCards);
    if (isFlush(cards, suitsCount)) return isFlush(cards, suitsCount);
    if (isStraight(straightCards)) return isStraight(straightCards);
    if (isThreeKind(cards, tripleCards)) return isThreeKind(cards, tripleCards);
    if (isTwoPair(cards, doubleCards, prevDoubleCards)) return isTwoPair(cards, doubleCards, prevDoubleCards);
    if (isPair(cards, doubleCards)) return isPair(cards, doubleCards);

    return {name: 'High card', cards: [user[0], user[1]]};
}
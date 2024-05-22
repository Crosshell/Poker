import {MAX_COMBINATION_SIZE, RANKS} from "./constants.js";


const checkRoyalFlush = (straightCards) => {
    if (straightCards && isSameSuit(straightCards)) {
        if (straightCards[0].rank === '10') {
            return { name: 'Royal flush', cards: straightCards };
        }
    }
    return null;
}

const checkStraightFlush = (straightCards) => {
    if (straightCards && isSameSuit(straightCards)) {
        return { name: 'Straight flush', cards: straightCards };
    }
    return null;
}

const checkFourKind = (cards, ranksCount) => {
    for (const rank in ranksCount){
        if (ranksCount[rank] === 4){
            const fourOfAKindRank = rank;
            const fourOfAKindCards = cards.filter(card => card.rank === fourOfAKindRank);
            return { name: 'Four of a kind', cards: fourOfAKindCards };
        }
    }
    return null;
}

const checkFullHouse = (cards, tripleCards, doubleCards) => {
    if (tripleCards && doubleCards) {
        const tripleCardsArray = cards.filter(card => card.rank === tripleCards);
        const doubleCardsArray = cards.filter(card => card.rank === doubleCards);
        return { name: 'Full house', cards: [...tripleCardsArray, ...doubleCardsArray] };
    }
    return null;
}

const checkFlush = (cards, suitsCount) => {
    for (const suit in suitsCount) {
        if (suitsCount[suit] >= MAX_COMBINATION_SIZE) {
            const flushCards = cards.filter(card => card.suit === suit);
            const lastFlushCards  = flushCards.slice(-MAX_COMBINATION_SIZE);
            return { name: 'Flush', cards: lastFlushCards };
        }
    }
    return null;
}

const checkStraight = (straightCards) => {
    if (straightCards && straightCards.length === MAX_COMBINATION_SIZE){
        return { name: 'Straight', cards: straightCards };
    }
    return null;
}

const checkThreeKind = (cards, tripleCards) => {
    if (tripleCards) {
        const tripleCardsArray = cards.filter(card => card.rank === tripleCards);
        return { name: 'Three of a kind', cards: tripleCardsArray };
    }
    return null;
}

const checkTwoPair = (cards, doubleCards, prevDoubleCards) => {
    if (prevDoubleCards !== doubleCards && prevDoubleCards && doubleCards) {
        const doubleCardsArray = cards.filter(card => card.rank === doubleCards);
        const prevDoubleCardsArray = cards.filter(card => card.rank === prevDoubleCards);
        return { name: 'Two pair', cards: [...doubleCardsArray, ...prevDoubleCardsArray] };
    }
    return null;
}

const checkPair = (cards, doubleCards) => {
    if (doubleCards) {
        const doubleCardsArray = cards.filter(card => card.rank === doubleCards);
        return { name: 'Pair', cards: doubleCardsArray };
    }
    return null;
}

const getSortedByRanks = (cardsToSort) => {
    return cardsToSort.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
}

const getUniqueRanks = (sortedRanks) => {
    const uniqueRanks = {};
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
                    return chainCards;
                }
            } else {
                consecutiveCount = 1;
                chainCards = [uniqueRanksArray[i]];
            }
        }
    }
    return null;
}

const isSameSuit = (straightCards) => {
    if (straightCards.length === MAX_COMBINATION_SIZE) {
        for (let i = 0; i < straightCards.length; i++) {
            if (straightCards[0].suit !== straightCards[i].suit) {
                return false;
            }
        }
        return true;
    }
    return false;
}

const getTripleCards = (ranksCount) => {
    let tripleCards = null;
    for (const rank in ranksCount) {
        if (ranksCount[rank] === 3) {
            tripleCards = rank;
        }
    }
    return tripleCards;
}

const getDoubleCards = (ranksCount) => {
    let doubleCards = null;
    for (const rank in ranksCount) {
        if (ranksCount[rank] === 2) {
            doubleCards = rank;
        }
    }
    return doubleCards;
}

const getPrevDoubleCards = (ranksCount) => {
    let curDoubleCards = null;
    let prevDoubleCards = null;
    for (const rank in ranksCount) {
        if (ranksCount[rank] === 2){
            prevDoubleCards = curDoubleCards;
            curDoubleCards = rank;
        }
    }
    return prevDoubleCards;
}

export const checkHighestCombination = (userCards, tableCards) => {
    let cards = [...tableCards, ...userCards];
    cards = getSortedByRanks(cards);
    const ranksCount = {};
    const suitsCount = {};

    for (const card of cards) {
        ranksCount[card.rank] = ranksCount[card.rank] + 1 || 1;
        suitsCount[card.suit] = suitsCount[card.suit] + 1 || 1;
    }

    const uniqueRanksArray = getUniqueRanks(cards);
    const straightCards = getStraightCards(uniqueRanksArray);
    const tripleCards = getTripleCards(ranksCount);
    const doubleCards = getDoubleCards(ranksCount);
    const prevDoubleCards = getPrevDoubleCards(ranksCount);

    let combination = checkRoyalFlush(straightCards);
    if (combination) return combination;

    combination = checkStraightFlush(straightCards);
    if (combination) return combination;

    combination = checkFourKind(cards, ranksCount);
    if (combination) return combination;

    combination = checkFullHouse(cards, tripleCards, doubleCards);
    if (combination) return combination;

    combination = checkFlush(cards, suitsCount)
    if (combination) return combination;

    combination = checkStraight(straightCards);
    if (combination) return combination;

    combination = checkThreeKind(cards, tripleCards);
    if (combination) return combination;

    combination = checkTwoPair(cards, doubleCards, prevDoubleCards);
    if (combination) return combination;

    combination = checkPair(cards, doubleCards);
    if (combination) return combination;

    combination = { name: 'High card', cards: [userCards[0], userCards[1]] }
    return combination;
}
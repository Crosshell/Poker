'use strict';

import {MAX_COMBINATION_SIZE, RANKS} from "./constants.js";

const checkRoyalFlush = (straightCards) => {
    if (straightCards && isSameSuit(straightCards) && straightCards[0].rank === '10') {
        return { name: 'Royal flush', cards: straightCards };
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
            const fourOfAKindCards = cards.filter(card => card.rank === rank);
            return { name: 'Four of a kind', cards: fourOfAKindCards };
        }
    }
    return null;
}

const checkFullHouse = (cards, tripleRanks, pairRank) => {
    if (tripleRanks.length > 0 && (pairRank || tripleRanks.length > 1)) {
        const tripleCardsArray = cards.filter(card => card.rank === tripleRanks[0]);
        const pairCardsArray = cards.filter(card => card.rank === (pairRank || tripleRanks[1]));
        return { name: 'Full house', cards: [...tripleCardsArray, ...pairCardsArray] };
    }
    return null;
}

const checkFlush = (cards, suitsCount) => {
    for (const suit in suitsCount) {
        if (suitsCount[suit] >= MAX_COMBINATION_SIZE) {
            const flushCards = cards.filter(card => card.suit === suit);
            flushCards.reverse();
            const highestFlushCards  = flushCards.slice(0, MAX_COMBINATION_SIZE);
            return { name: 'Flush', cards: highestFlushCards };
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

const checkThreeKind = (cards, tripleRank) => {
    if (tripleRank) {
        const tripleCardsArray = cards.filter(card => card.rank === tripleRank);
        return { name: 'Three of a kind', cards: tripleCardsArray };
    }
    return null;
}

const checkTwoPair = (cards, pairRanks) => {
    if (pairRanks.length === 2) {
        const [firstPairRank, secondPairRank] = pairRanks;
        const firstPairCards = cards.filter(card => card.rank === firstPairRank);
        const secondPairCards = cards.filter(card => card.rank === secondPairRank);
        return { name: 'Two pair', cards: [...firstPairCards, ...secondPairCards] };
    }
    return null;
}

const checkPair = (cards, pairRank) => {
    if (pairRank) {
        const pairCardsArray = cards.filter(card => card.rank === pairRank);
        return { name: 'Pair', cards: pairCardsArray };
    }
    return null;
}

const getSortedByRanks = (cardsToSort) => {
    return cardsToSort.sort((a, b) => RANKS.indexOf(a.rank) - RANKS.indexOf(b.rank));
}

const getUniqueRanks = (sortedRanks) => {
    const uniqueRanks = new Set();
    return sortedRanks.filter(card => {
        if (!uniqueRanks.has(card.rank)) {
            uniqueRanks.add(card.rank);
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
    return straightCards.every(card => card.suit === straightCards[0].suit);
}

const getTripleAndPairs = (ranksCount) => {
    let tripleRanks = [];
    let pairRanks = [];
    for (const rank in ranksCount) {
        if (ranksCount[rank] === 3) {
            tripleRanks.unshift(rank);
        }
        if (ranksCount[rank] === 2) {
            pairRanks.unshift(rank);
        }
    }
    const highestTwoPairs = pairRanks.slice(0, 2);

    return { tripleRanks, pairRanks: highestTwoPairs };
}

export const checkHighestCombination = (userCards, tableCards) => {
    let allCards = [...tableCards, ...userCards];
    allCards = getSortedByRanks(allCards);
    const ranksCount = {};
    const suitsCount = {};

    for (const card of allCards) {
        ranksCount[card.rank] = (ranksCount[card.rank] || 0) + 1;
        suitsCount[card.suit] = (suitsCount[card.suit] || 0) + 1;
    }

    const uniqueRanksArray = getUniqueRanks(allCards);
    const straightCards = getStraightCards(uniqueRanksArray);
    const { tripleRanks, pairRanks } = getTripleAndPairs(ranksCount);

    const checks = [
        () => checkRoyalFlush(straightCards),
        () => checkStraightFlush(straightCards),
        () => checkFourKind(allCards, ranksCount),
        () => checkFullHouse(allCards, tripleRanks, pairRanks[0]),
        () => checkFlush(allCards, suitsCount),
        () => checkStraight(straightCards),
        () => checkThreeKind(allCards, tripleRanks[0]),
        () => checkTwoPair(allCards, pairRanks),
        () => checkPair(allCards, pairRanks[0])
    ];

    for (const check of checks) {
        const combination = check();
        if (combination) return combination;
    }

    return { name: 'High card', cards: userCards };
}

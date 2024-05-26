'use strict';

import {COMBINATIONS, FIRST_CARD_CHECK, RANKS} from "./constants.js";

const kickerCardWinner = (users, winners) => {
    let highestRankIndex = 0;
    for (const winnerID of winners){
        const currentRankIndex = RANKS.indexOf(users[winnerID].cards[0].rank);
        if (currentRankIndex > highestRankIndex){
            highestRankIndex = currentRankIndex;
        }
    }

    winners = winners.filter(winnerID => RANKS.indexOf(users[winnerID].cards[0].rank) === highestRankIndex);

    if (winners.length > 1){
        highestRankIndex = 0;
        for (const winnerID of winners){
            const currentRankIndex = RANKS.indexOf(users[winnerID].cards[1].rank);
            if (currentRankIndex > highestRankIndex){
                highestRankIndex = currentRankIndex;
            }
        }
        winners = winners.filter(winnerID => RANKS.indexOf(users[winnerID].cards[1].rank) === highestRankIndex);
    }
    return winners;
}

const getWinnersByNumCard = (users, winners, num) => {
    let highestRankIndex = 0;
    for (const winnerID of winners) {
        const currentRankIndex = RANKS.indexOf(users[winnerID].combination.cards[num].rank);
        if (currentRankIndex > highestRankIndex) {
            highestRankIndex = currentRankIndex;
        }
    }
    winners = winners.filter(winnerID => RANKS.indexOf(users[winnerID].combination.cards[num].rank) === highestRankIndex);
    return winners;
}

const checkAllCards = (users, winners, numCards) => {
    for (let i = 0; i < numCards; i++) {
        winners = getWinnersByNumCard(users, winners, i);
        if (winners.length <= 1) break;
    }
    return winners;
}

export const checkWinner = (users) => {
    let highestComboIndex = 0;
    for (const user in users) {
        const currentComboIndex = COMBINATIONS.indexOf(users[user].combination.name);
        if (currentComboIndex > highestComboIndex) {
            highestComboIndex = currentComboIndex;
        }
    }

    let winners = Object.keys(users).filter(user => COMBINATIONS.indexOf(users[user].combination.name) === highestComboIndex);

    const highestComboName = COMBINATIONS[highestComboIndex];

    if (winners.length > 1) {
        if (FIRST_CARD_CHECK.includes(highestComboName)){
            winners = getWinnersByNumCard(users, winners, 0);
            if (winners.length > 1){
                winners = kickerCardWinner(users, winners);
            }
        } else if (highestComboName === 'Two pair'){
            winners = getWinnersByNumCard(users, winners, 0);
            if (winners.length > 1){
                winners = getWinnersByNumCard(users, winners, 2);
            }
            if (winners.length > 1){
                winners = kickerCardWinner(users, winners);
            }
        } else if (highestComboName === 'Flush'){
            winners = checkAllCards(users, winners, 5);
            if (winners.length > 1){
                winners = kickerCardWinner(users, winners);
            }
        } else if (highestComboName === 'Full house'){
            winners = getWinnersByNumCard(users, winners, 0);
            if (winners.length > 1){
                winners = getWinnersByNumCard(users, winners, 3);
            }
            if (winners.length > 1){
                winners = kickerCardWinner(users, winners);
            }
        } else if (highestComboName === 'High card' || highestComboName === 'Royal flush'){
            winners = kickerCardWinner(users, winners);
        }
    }
    return winners;
}
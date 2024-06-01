'use strict';

import { MAX_PLAYERS } from "../src/constants/constants.js";
import { get } from "./ui.js";

export const initializePlayerSlots = () => {
    const createPlayerSlot = (slotNumber) => {
        const slot = document.createElement('div');
        slot.id = `gameSlot${slotNumber}`;
        slot.style.display = 'none';

        slot.innerHTML = `
            <div id="nameSlot${slotNumber}"></div>
            <div id="moneySlot${slotNumber}"></div>
            <div id="bidSlot${slotNumber}"></div>
            <div id="cardsSlot${slotNumber}">
                <img id='firstCardSlot${slotNumber}' src="images/cards/back-of-card.png" alt="handCard">
                <img id='secondCardSlot${slotNumber}' src="images/cards/back-of-card.png" alt="handCard">
            </div>
            <div id="dealerSlot${slotNumber}"></div>
            <div id="combinationSlot${slotNumber}"></div>
        `;

        return slot;
    };

    const slotsArea = get('slotsArea');
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        const slot = createPlayerSlot(i);
        slotsArea.appendChild(slot);

        const dealerSlot = get(`dealerSlot${i}`);
        const firstCardSlot = get(`firstCardSlot${i}`);
        const secondCardSlot = get(`secondCardSlot${i}`);
        const cardsSlot = get(`cardsSlot${i}`);

        dealerSlot.style.color = 'red';
        firstCardSlot.style.height = '20%';
        firstCardSlot.style.width = '20%';
        secondCardSlot.style.height = '20%'
        secondCardSlot.style.width = '20%';
        cardsSlot.style.display = 'flex';
        cardsSlot.style.justifyContent = 'center';
        cardsSlot.style.alignItems = 'center';
    }
}

export const initializeLobbySlots = () => {
    const createLobbySlot = (slotNumber) => {
        const slot = document.createElement('div');
        slot.id = `lobbySlot${slotNumber}`;
        slot.style.display = 'none';
        return slot;
    };

    const lobbySlots = get('lobbySlots');
    for (let i = 1; i <= MAX_PLAYERS; i++) {
        const slot = createLobbySlot(i);
        lobbySlots.appendChild(slot);
    }
}

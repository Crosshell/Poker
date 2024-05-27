import { START_MONEY } from "./constants.js";

export class User {
    constructor(id, ws) {
        this.id = id;
        this.isReady = false;
        this.ws = ws;
        this.cards = [];
        this.combination = null;
        this.money = START_MONEY;
        this.bid = 0;
        this.isDealer = false;
        this.hasFolded = false;
    }
}

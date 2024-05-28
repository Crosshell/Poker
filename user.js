import { START_MONEY } from "./constants.js";

export class User {
    constructor(id, ws) {
        this.id = id;
        this.ws = ws;
        this.isReady = false;
        this.cards = [];
        this.combination = null;
        this.money = START_MONEY;
        this.bid = 0;
        this.hasFolded = false;
    }
}

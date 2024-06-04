'use strict';

import { START_MONEY } from "../constants/constants.js";

export class User {
    constructor(id, ws, username) {
        this.id = id;
        this.ws = ws;
        this.username = username;
        this.isReady = false;
        this.cards = [];
        this.combination = null;
        this.money = START_MONEY;
        this.bid = 0;
        this.hasFolded = false;
    }
}

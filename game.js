const get = (id) => document.getElementById(id);

let yourUser = 'User 0';
let yourReadiness = 'Not Ready'
const connectButton = get('connect');
const startHTML = get('startScreen');
const connectingHTML = get('connectingMessage');
const lobbyHTML = get('lobby');
const readyButton = get('ready');
const lobby = get('lobby');
const usersArea = get('usersArea');
const tableHTML = get('table');
const controlButtons = get('controlPanel');
const callButton = get('call');
const foldButton = get('fold');
const raiseButton = get('raise');

document.addEventListener('DOMContentLoaded', () => {
    startScreen();
});

const startScreen = () => {
    connectButton.addEventListener('click', () => {
        startHTML.style.display = 'none';
        connectingHTML.style.display = 'block';
        connectToLobby();
    });
}

const connectToLobby = () => {
    const socket = new WebSocket('ws://127.0.0.1:8080');
    socket.addEventListener('open',  () => {
        console.log('Successful connection to lobby');
        connectingHTML.style.display = 'none';
        lobbyHTML.style.display = 'flex';

        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'getID':
                    yourUser = message.content;
                    const yourIDHTML = get(('lobby ' + yourUser).replace(/\s+/g, '-'));
                    yourIDHTML.textContent = `${yourUser} (You): ${yourReadiness}`;
                    yourIDHTML.style.display = 'flex';
                    break;
                case 'newConnect':
                    const connectedUsers = message.content;
                    for (const user of connectedUsers){
                        const userHTMLId = ('lobby ' + user).replace(/\s+/g, '-')
                        const connectedHTML = get(userHTMLId);
                        connectedHTML.style.display = 'flex';
                    }
                    break;
                case 'updateReadiness':
                    const userKey = message.userKey;
                    const userReadiness = message.content;
                    const userHTMLId = ('lobby ' + userKey).replace(/\s+/g, '-');
                    const userHTML = get(userHTMLId);
                    if (userKey === yourUser) {
                        userHTML.textContent = `${userKey} (You): ${userReadiness}`
                    } else {
                        userHTML.textContent = `${userKey}: ${userReadiness}`;
                    }
                    break;
                case 'getHandCards':
                    lobby.style.display = 'none'
                    game(socket, message.content);
                    break;
            }
        });
        readyButton.addEventListener('click', () => {
            yourReadiness = switchReadiness(yourReadiness);
            socket.send(JSON.stringify({ type: 'ready', content: yourReadiness }));
        });
    });
}

const switchReadiness = (yourReadiness) => {
    if (yourReadiness === 'Not Ready'){
        return 'Ready';
    }
    return 'Not Ready';
}

const game = (socket, handCards) => {
    usersArea.style.display = 'grid';
    tableHTML.style.display = 'flex';
    controlButtons.style.display = 'flex';
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        switch (message.type) {
            case 'getPlayingUsers':
                showPlayers(message.content);
                showYourHandCards(handCards);
                break;
            case 'updateMoney':
                updateUsersMoney(message.content);
                break;
            case 'updateBid':
                updateUsersBid(message.content);
                break;
            case 'getDealer':
                updateDealer(message.content);
                break;
        }
    });
}

const showPlayers = (usersToShow) => {
    for (const user of usersToShow) {
        const userHTMLId = ('game ' + user).replace(/\s+/g, '-');
        const gameUserHTML = get(userHTMLId);
        gameUserHTML.style.display = 'flex';
        if (user === yourUser){
            const yourNameHTMLId = ('name ' + user).replace(/\s+/g, '-');
            const yourNameHTML = get(yourNameHTMLId);
            yourNameHTML.textContent = 'YOU';
        }
    }
}

const showYourHandCards = (handCards) => {
    const firstHandCardHTML = get(('first-card ' + yourUser).replace(/\s+/g, '-'));
    const secondHandCardHTML = get(('second-card ' + yourUser).replace(/\s+/g, '-'));
    firstHandCardHTML.src = `images/cards/${handCards[0].rank}-${handCards[0].suit}.png`;
    secondHandCardHTML.src = `images/cards/${handCards[1].rank}-${handCards[1].suit}.png`;
}

const updateUsersMoney = (usersMoney) => {
    for (const user in usersMoney) {
        const userMoneyHTML = get(('money ' + user).replace(/\s+/g, '-'));
        userMoneyHTML.textContent = 'Money: $' + usersMoney[user];
    }
}

const updateUsersBid = (usersBid) => {
    for (const user in usersBid) {
        const userBidHTML = get(('bid ' + user).replace(/\s+/g, '-'));
        userBidHTML.textContent = 'Bid: $' + usersBid[user];
    }
}

const updateDealer = (dealer) => {
    const dealerHTML = get(('dealer ' + dealer).replace(/\s+/g, '-'));
    dealerHTML.textContent = 'Dealer';
}
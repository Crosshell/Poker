const get = (id) => document.getElementById(id);

let yourUser = 'User 0';
let yourReadiness = 'Not Ready'
const connectButton = get('connect');
const startHTML = get('startScreen');
const connectingHTML = get('connectingMessage');
const lobbyHTML = get('lobby');
const readyButton = get('ready');

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
                    const userHTMLId = ('lobby ' + userKey).replace(/\s+/g, '-')
                    const userHTML = get(userHTMLId);
                    if (userKey === yourUser) {
                        userHTML.textContent = `${userKey} (You): ${userReadiness}`
                    } else {
                        userHTML.textContent = `${userKey}: ${userReadiness}`;
                    }
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
document.addEventListener('DOMContentLoaded', () => {
    const getElement = (id) => document.getElementById(id);

    const connectButton = getElement('connect');
    const link = getElement('rules');
    const connectingMessage = getElement('connectingMessage');
    const gameArea = getElement('gameArea');

    const firstUserCardHTML = getElement('firstUserCard');
    const secondUserCardHTML = getElement('secondUserCard');

    const userIDHTML = getElement('userID');
    const enemyIDHTML = getElement('enemyID');

    let userID = '';
    let enemyID = '';

    const userBidHTML = getElement('userBid');
    const enemyBidHTML = getElement('enemyBid');

    const userMoneyHTML = getElement('userMoney');
    const enemyMoneyHTML = getElement('enemyMoney');

    const buttons = getElement('buttons');
    const callButton = getElement('call');
    const foldButton = getElement('fold');
    const raiseButton = getElement('raise');

    const flopCardsHTML = [getElement('flopCard1'), getElement('flopCard2'), getElement('flopCard3')];
    const turnCardHTML = getElement('turnCard');
    const riverCardHTML = getElement('riverCard');

    connectButton.addEventListener('click', () => {
        link.style.display = 'none';
        connectButton.style.display = 'none';
        connectingMessage.style.display = 'block';
        const socket = new WebSocket('ws://127.0.0.1:8080');

        socket.addEventListener('open',  () => {
            connectingMessage.style.display = 'none';
            console.log('Successful connection');
            gameArea.style.display = 'block';
        });

        socket.addEventListener('message', (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        });

        const handleServerMessage = (message) => {
            switch (message.type) {
                case 'dealHand':
                    handleDealHand(message.content);
                    break;
                case 'dealFlop':
                    handleDealFlop(message.content);
                    break;
                case 'dealTurn':
                    handleDealTurn(message.content);
                    break;
                case 'dealRiver':
                    handleDealRiver(message.content);
                    break;
                case 'userID':
                    handleUserID(message.content);
                    break;
                case 'enemiesID':
                    handleEnemiesID(message.content);
                    break;
                case 'updatedMoney':
                    handleUpdatedMoney(message.content);
                    break;
                case 'updatedBid':
                    handleUpdatedBid(message.content);
                    break;
                case 'fold':
                    handleFold();
                    break;
                case 'showdown':
                    handleShowdown(message.content);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        };

        const handleDealHand = (content) => {
            const [firstUserCard, secondUserCard] = content;
            firstUserCardHTML.src = `images/cards/${firstUserCard.rank}-${firstUserCard.suit}.png`;
            secondUserCardHTML.src = `images/cards/${secondUserCard.rank}-${secondUserCard.suit}.png`;
            buttons.style.display = 'flex';
        };

        const handleDealFlop = (content) => {
            content.forEach((card, index) => {
                flopCardsHTML[index].src = `images/cards/${card.rank}-${card.suit}.png`;
            });
        };

        const handleDealTurn = (content) => {
            const card = content[3];
            turnCardHTML.src = `images/cards/${card.rank}-${card.suit}.png`;
        };

        const handleDealRiver = (content) => {
            const card = content[4];
            riverCardHTML.src = `images/cards/${card.rank}-${card.suit}.png`;
        };

        const handleUserID = (content) => {
            userIDHTML.textContent = content;
            userID = content;
        };

        const handleEnemiesID = (content) => {
            enemyIDHTML.textContent = content;
            enemyID = content;
        };

        const handleUpdatedMoney = (content) => {
            userMoneyHTML.textContent = '$' + content[userID];
            enemyMoneyHTML.textContent = '$' + content[enemyID];
        };

        const handleUpdatedBid = (content) => {
            userBidHTML.textContent = 'Bid: $' + content[userID];
            enemyBidHTML.textContent = 'Bid: $' + content[enemyID];
        };

        const handleFold = () => {
            buttons.style.display = 'none';
            alert('You have folded.');
        };

        const handleShowdown = (winner) => {
            alert(`The winner is ${winner[0]} with ${winner[1]}`);
        };

        callButton.addEventListener('click', () => {
            socket.send(JSON.stringify({ type: 'call', userKey: userID }));
        });

        raiseButton.addEventListener('click', () => {
            const raiseAmount = parseInt(prompt('Enter raise amount:'));
            if (!isNaN(raiseAmount)) {
                socket.send(JSON.stringify({ type: 'raise', content: { raiseAmount }, userKey: userID }));
            } else {
                alert('Invalid raise amount');
            }
        });

        foldButton.addEventListener('click', () => {
            socket.send(JSON.stringify({ type: 'fold', userKey: userID }));
        });
    });
});

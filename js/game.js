let roomCode;
let userId;
let gameState = "wait";
const socket = io(); 
let room;
let currentMarker = null;

var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2
});
let x = 3;
let y = 4; 
let imageNumber = 1;

for (let i = y - 1; i >= 0; i--) {
    for (let j = 0; j < x; j++) {
        let bounds = [[i * 1000, j * 1000], [(i + 1) * 1000, (j + 1) * 1000]];
        let image = L.imageOverlay(`../images/cpmap${imageNumber}.jpg`, bounds).addTo(map);
        imageNumber++;
    }
}
map.fitBounds([[0, 0], [y * 1000, x * 1000]]);
map.on('click', (e) => {
    if (room.users[userId].status) return;
    if (currentMarker) map.removeLayer(currentMarker);
    console.log(e.latlng);
    currentMarker = L.marker(e.latlng).addTo(map);

});


socket.on('connect', () => {
    let cookie = document.cookie;
    if (!cookie.includes('userId')) {
        socket.emit('debug', 'Creation de l`uuid');
        console.log("Nouvel utilisateur");
        socket.emit('uuid');
        socket.on('uuid', (uuid) => { 
            document.cookie = 'userId=' + 0 + '; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/;';
            userId = document.cookie.split('=')[1];
            roomCode = window.location.pathname.split('/')[2];
            socket.emit('user create', userId, `Guest${Math.floor(Math.random() * 100)}`, roomCode);
            console.log(userId);
            socket.emit('room joined', roomCode, userId);
            location.reload();
        });                    
    } else {
        socket.emit('debug', 'UUid deja existant');
        userId = document.cookie.split('=')[1];
        roomCode = window.location.pathname.split('/')[2];
        socket.emit('room joined', roomCode, userId);
    }
    socket.emit('get room', roomCode);
    socket.on('room update', (roomC, thisRoom) => {
        if (roomCode == roomC) {
            room = thisRoom;
            gameState = thisRoom.gameState;
            if(gameState == "wait") {
                console.log('wait');
                document.getElementById('inputGameImage').classList.remove('active');
                document.getElementById('startButton').classList.add('active');
                document.getElementById('mapConfirmButton').classList.remove('active');
                document.getElementById('map').classList.remove('active');
            } else if (gameState.split(' ')[0] == "image") {
                const imageNumber = gameState.split(' ')[1];
                // console.log('gameState: image '+imageNumber);
                // console.log(room.users[userId].status);
                document.getElementById('mapConfirmButton').classList.remove('active');
                document.getElementById('map').classList.remove('active');
                if (room.users[userId].status == false) {
                    document.getElementById('inputGameImage').classList.add('active');
                } else {
                    document.getElementById('inputGameImage').classList.remove('active');
                }
                document.getElementById('startButton').classList.remove('active');

                if (!document.getElementById('panorama').classList.contains('active')) {
                    pannellum.viewer('panorama', {
                        "type": "equirectangular",
                        "disableKeyboardCtrl ": true,
                        "autoLoad": true,
                        "showZoomCtrl": false,
                        "showFullscreenCtrl": false,
                        "panorama": `${room.gameDB[imageNumber-1].image}`
                    });
                    document.getElementById('panorama').classList.add('active');
                }

            } 
            if (gameState.split(' ')[2] == "map") { // Si il a réussi a trouver le jeu --> on affiche la map 
                if (room.users[userId].status == false) {
                    // console.log('On affiche la map')
                    document.getElementById('panorama').classList.add('active');
                    document.getElementById('inputGameImage').classList.remove('active');
                    document.getElementById('map').classList.add('active');
                    document.getElementById('mapConfirmButton').classList.add('active');
                } else { // Si l'utilisateur n'a pas trouvé le jeu
                    document.getElementById('inputGameImage').classList.remove('active');
                }
            }
            if (thisRoom.owner == userId) {
                document.getElementById('startButton').disabled = false;
            }
        }
    });
    socket.on(`player update ${roomCode}`, players => {
        console.log(players);
        updatePlayerList(players);
    });


    // CHAT
    const chatMessages = document.getElementById('chat');
    const typeArea = document.getElementById('typeArea');
    typeArea.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (typeArea.value != "") socket.emit('chat message', roomCode, userId, typeArea.value);
            typeArea.value = '';
        }
    });
    socket.on(`chat message ${roomCode}`, (user, message) => {
        var scrollMaxY = window.scrollMaxY || (document.documentElement.scrollHeight - document.documentElement.clientHeight)

        const li = document.createElement('li');
        li.textContent = user + ": " +message;
        chatMessages.appendChild(li);
        chatMessages.scrollTop = chatMessages.scrollHeight +250;
    });
    socket.on('chat join', (user, roomC) => {
        if(roomC == roomCode) {
            setTimeout(() => {
                console.log(room.users[user]);
                username = room.users[user].name;
                if(!room.users[user].alive) return;
                const li = document.createElement('li');
                li.innerHTML = `<strong>${username} has joined the room</strong>`;
                chatMessages.appendChild(li);
            }, 100);
        }
    });
    socket.on('chat leave', (user, roomC) => {
        if(roomC == roomCode) {
            setTimeout(() => {
                username = room.users[user].name;
                if(room.users[user].alive) return;
                const li = document.createElement('li');
                li.innerHTML = `<strong>${username} has left the room</strong>`;
                chatMessages.appendChild(li);
            }, 500);
        }
    });
    


    // GAME
    socket.on('game start', async (roomC) => {
        console.log(room.gameDB);
        let tempstop = false;
        while(!tempstop) {
            if (room.gameDB.length > 0) {
                tempstop = true;

                if (roomC == roomCode) {
                    // console.log(room.gameDB);
                    // console.log(room.gameDB.length);
                    gameState = "image 1";
                    imageNumber = gameState.split(' ')[1];
                    document.getElementById('inputGameImage').classList.add('active');
                    document.getElementById('panorama').classList.add('active');
                    document.getElementById('startButton').classList.remove('active');
        
                    pannellum.viewer('panorama', {
                        "type": "equirectangular",
                        "disableKeyboardCtrl ": true,
                        "autoLoad": true,
                        "showZoomCtrl": false,
                        "showFullscreenCtrl": false,
                        "panorama": `${room.gameDB[imageNumber-1].image}`
                    });
                }
                break;
            }
            await new Promise(r => setTimeout(r, 100));
        }
    });

    inputGameImage = document.getElementById('inputGameImage');

    inputGameImage.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            if (inputGameImage.value != ""){
                let imageNumber = room.gameState.split(' ')[1];
                if (String(room.gameDB[imageNumber-1].game).toLowerCase().includes(inputGameImage.value.split(' ').join('').toLowerCase())) {
                    // console.log('correct');
                    document.getElementById('inputGameImage').classList.remove('active');
                    socket.emit('game answer', roomCode, userId, true, 'name', gameState, room.gameDB);
                } else {
                    document.getElementById('inputGameImage').classList.remove('active');
                    socket.emit('game answer', roomCode, userId, false, 'name', gameState, room.gameDB);
                }
                inputGameImage.value = '';

            }
        }
    });
});

socket.on('game update', (roomC, thisRoom, gameState,) => {
    if(roomC == roomCode) {
        room = thisRoom;
        gameState = thisRoom.gameState;
    }
});

socket.on('game image update', async (roomC, imageNumber) => {
    console.log(`imageNumber: ${imageNumber}`);
    if(roomC == roomCode) {
        let tempstop = false;
        while(!tempstop) {
            if (room.gameDB.length > 0) {
                tempstop = true;

                if (roomC == roomCode) {
                    pannellum.viewer('panorama', {
                        "type": "equirectangular",
                        "disableKeyboardCtrl ": true,
                        "autoLoad": true,
                        "showZoomCtrl": false,
                        "showFullscreenCtrl": false,
                        "panorama": `${room.gameDB[imageNumber-1].image}`
                    });
                }
                break;
            }
            await new Promise(r => setTimeout(r, 100));
        }

        document.getElementById('inputGameImage').classList.add('active');
        document.getElementById('mapConfirmButton').classList.remove('active');
        document.getElementById('map').classList.remove('active');
        inputGameImage.focus();
    }
});

socket.on('game end', (roomC) => {
    if(roomC == roomCode) {
        // document.getElementById('inputGameImage').classList.remove('active');
        // document.getElementById('panorama').classList.remove('active');
        let winners = [];
        let maxPoints = 0;

        for (const playerId in room.users) {
            const player = room.users[playerId];
            if (player.points > maxPoints) {
            maxPoints = player.points;
            winners = [player];
            } else if (player.points === maxPoints) {
            winners.push(player);
            }
        }

        if (winners.length > 0) {
            const winnerMessage = document.getElementById('winnerMessage');
            winnerMessage.innerHTML = `
                    <form id="roomForm" onsubmit="return false;">
                        <button type="button" id="croix" onclick="document.getElementById('winnerMessage').innerHTML = ''">X</button>
                        <div class="winners">
                            <h2>Winners</h2>
                            <ul>
                                ${winners.map(winner => `<li>${winner.name} with ${winner.points} points</li>`).join('')}
                            </ul>
                        </div>
                    </form>
                    <style>
                        #winnerMessage {
                            transition: 0.3s;
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            justify-content: center;
                            align-items: center;
                            transition: 0.3s;
                            z-index: 20;
                        }
                        #roomForm {
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background-color: white;
                            padding: 20px;
                            border-radius: 10px;
                            transition: 0.3s;
                        }
                        #croix {
                            position: absolute;
                            top: 0;
                            right: 0;
                            color: black;
                            border: none;
                            background-color: transparent;
                            width: 20px;
                            height: 20px;
                            cursor: pointer;
                            transition: 0.3s;
                        }
                        #croix:hover {
                            color: gray;
                        }
                    </style>
                `;
            document.body.appendChild(winnerMessage);
        }

        // on reset
        socket.emit('game reset', roomCode);
    }
});

socket.on('game reset', (roomC) => {
    if(roomC == roomCode) {
        document.getElementById('inputGameImage').classList.remove('active');
        document.getElementById('panorama').classList.remove('active');
    }
});

// Tabs
function showTab(tabId) {
    // console.log(`TabId: ${tabId}`);

    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');

    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    contents.forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(`tab${tabId}`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

function updatePlayerList(players) {
    socket.emit('get room', roomCode);
    var list = document.getElementById('scoreList');
    list.innerHTML = '';
    if (room) {
        for (const player in players) {

            if(player.alive == false) continue;
            var li = document.createElement('li');
            let host = '';
            if(player == room.owner) {
                host = ' (Host)';
            }
            li.textContent = `${players[player].name}${host}: ${players[player].points}`;
            list.appendChild(li);
        }
    }
    else {
        setTimeout(function(){
            updatePlayerList(players);
        }, 500);
    }
}

function startButton() {
    socket.emit('game start', roomCode);
}

function mapConfirmButton() {
    if (currentMarker && !room.users[userId].status) {
        let correct = [1880, 1445];
        let marker = currentMarker.getLatLng();
        let x = marker.lng;
        let y = marker.lat;
        let distance = Math.sqrt((x - correct[1])**2 + (y - correct[0])**2)
        let points = 530 - distance;
        console.log(`Distance: ${distance}`)

        if(points > 500) points = 500;
        if(points < 0) points = 0;
        points = Math.floor(points/5);
        console.log(`Points: ${points}`)
        room.users[userId].status = true;

        let correctMarker = L.marker(correct).addTo(map);
        let travel = L.polyline([correct, marker]).addTo(map);
        map.panTo(new L.latLng(correct[0], correct[1]));
        socket.emit('game answer', roomCode, userId, true, 'map', gameState, room.gameDB, points);
        map.removeLayer(currentMarker);
        map.removeLayer(travel);
        map.removeLayer(correctMarker);
    }
}

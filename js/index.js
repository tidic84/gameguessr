const socket = io();
            let username = '';

            let cookie = document.cookie;
            if (!cookie.includes('userId')) {
                console.log("Nouvel utilisateur");
                socket.emit('uuid');
                socket.on('uuid', (uuid) => {
                    socket.emit('debug', "Creation de l'uuid dans l'index");
                    document.cookie = 'userId=' + uuid + '; expires=Fri, 31 Dec 9999 23:59:59 GMT';
                });
            } else {
                socket.emit('get user', document.cookie.split('=')[1]);
                socket.on('user', (user) => {
                    username = user.name;
                    document.getElementById('username').value = username;
                });
                console.log("Utilisateur déjà existant");
            }

            socket.on('connect', () => {
                const popupForm = document.getElementById('popupForm');
                popupForm.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        socket.emit('debug', 'Enter pressed');
                        if (document.getElementById('submitButton')) {
                            submitJoinRoomForm();
                        }
                    }
                });

            });
            
            function createRoom() {
                // Récupérer le pseudo de l'utilisateur
                username = document.getElementById('username').value;

                if (!username) {
                    alert('Please enter a username');
                    return;
                }
                // Changer le contenu de la page
                document.getElementById('popupForm').innerHTML = `
                    <form id="roomForm">
                        <button type="button" id="croix" onclick="document.getElementById('popupForm').innerHTML = ''">X</button>
                        <label>Create Room</label>
                        <select id="mode">
                            <option value="classic" selected>Classic</option>
                            <option value="solo">Solo</option>
                            <option value="team">Team</option>
                        </select>
                        <select id="difficulty">
                            <option value="easy">Easy</option>
                            <option value="medium" selected>Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                        <select id="duration">
                            <option value="quick" selected>Quick</option>
                            <option value="medium">Medium</option>
                            <option value="long">Long</option>
                        </select>
                        <select id="privacy">
                            <option value="public" selected>Public</option>
                            <option value="private">Private</option>
                        </select>
                        <button type="button" id="submitCreateButton" onclick="submitRoomForm()">Create Room</button>
                    </form>
                    <style>
                        #popupForm {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background-color: rgba(0, 0, 0, 0.5);
                            justify-content: center;
                            align-items: center;
                            transition: 0.3s;

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
            }

            function submitRoomForm() {
                // Récupérer les valeurs du formulaire
                const mode = document.getElementById('mode').value;
                const difficulty = document.getElementById('difficulty').value;
                const duration = document.getElementById('duration').value;
                const privacy = document.getElementById('privacy').value;

                let users = {};
                const userId = document.cookie.split('=')[1];
                socket.emit('user create', userId, username);
                console.log(userId);
                users[userId] = {
                    name: username,
                    score: 0,
                    role: 'player', // 'player', 'spectator'
                    team: undefined, // 'team1', 'team2'
                }

                const room = {
                    name: username + "'s room",
                    owner: userId,
                    mode: mode,
                    difficulty: difficulty,
                    duration: duration,
                    privacy: privacy,
                    users: users,
                    code: generateCode(4)
                }
                socket.emit('room create', room);
                window.location.href = '/game/' + room.code;
            }

            function joinRoom() {
                username = document.getElementById('username').value;

                if (!username) {
                    alert('Please enter a username');
                    return;
                }
                // Changer le contenu de la page
                document.getElementById('popupForm').innerHTML = `
                    <form id="roomForm" onsubmit="return false;">
                        <button type="button" id="croix" onclick="document.getElementById('popupForm').innerHTML = ''">X</button>
                        <label for="roomCode">Room Code</label>
                        <input id="roomCode" placeholder="XXXXXX"></input>
                        <button type="button" id="submitButton" onclick="submitJoinRoomForm()">Join Room</button>
                    </form>
                    <style>
                        #popupForm {
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
            }

            function submitJoinRoomForm() {
                socket.emit('get rooms');
                socket.on('rooms', (rooms) => {
                    const roomCode = document.getElementById('roomCode').value;
                    if (rooms[roomCode]) {
                        const userId = document.cookie.split('=')[1];
                        socket.emit('user create', userId, username);
                        console.log(userId);
                        socket.emit('room joined', roomCode, userId);
                        window.location.href = '/game/' + roomCode;
                    } else {
                        alert('Room not found');
                    }
                });
            }
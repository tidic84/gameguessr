"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http_1 = require("http");
var url_1 = require("url");
var next_1 = require("next");
var socket_io_1 = require("socket.io");
var uuid_1 = require("uuid");
var fs_1 = require("fs");
var path_1 = require("path");
var dev = process.env.NODE_ENV !== 'production';
var hostname = 'localhost';
var port = parseInt(process.env.PORT || '3000', 10);
// État du serveur
var rooms = {};
var users = {};
var gameDB = [];
// Système de timers pour les rooms
var roomTimers = {};
var roomTimeLeft = {};
// Index des images pour chaque room
var roomImageIndex = {};
// Fonction pour démarrer le timer d'une room
function startRoomTimer(roomCode, duration, io) {
    // Nettoyer le timer existant s'il y en a un
    if (roomTimers[roomCode]) {
        clearInterval(roomTimers[roomCode]);
    }
    // Initialiser le temps et l'index d'image
    roomTimeLeft[roomCode] = duration;
    // Notifier les clients du démarrage du timer
    io.to(roomCode).emit('game timer start', duration);
    // Créer le timer
    roomTimers[roomCode] = setInterval(function () {
        var currentTime = roomTimeLeft[roomCode];
        if (currentTime === undefined)
            return;
        roomTimeLeft[roomCode] = currentTime - 1;
        // Envoyer la mise à jour du timer
        io.to(roomCode).emit('timer update', roomTimeLeft[roomCode]);
        // Si le temps est écoulé
        if (roomTimeLeft[roomCode] <= 0) {
            clearInterval(roomTimers[roomCode]);
            delete roomTimers[roomCode];
            delete roomTimeLeft[roomCode];
            // Notifier la fin du timer
            io.to(roomCode).emit('game timer stop');
            // Passer à l'image suivante automatiquement
            var room_1 = rooms[roomCode];
            if (room_1 && room_1.gameDB && room_1.gameDB.length > 0) {
                var currentIndex = roomImageIndex[roomCode] || 0;
                var nextIndex = currentIndex + 1;
                if (nextIndex < room_1.gameDB.length) {
                    // Passer à l'image suivante
                    roomImageIndex[roomCode] = nextIndex;
                    io.to(roomCode).emit('game image update', roomCode, nextIndex);
                    // Redémarrer le timer pour l'image suivante
                    setTimeout(function () {
                        startRoomTimer(roomCode, room_1.duration, io);
                    }, 3000); // 3 secondes de pause entre les images
                }
                else {
                    // Fin du jeu
                    room_1.gameState = 'end';
                    delete roomImageIndex[roomCode];
                    io.to(roomCode).emit('game end', roomCode);
                    io.emit('room update', roomCode, room_1);
                }
            }
            console.log("Timer \u00E9coul\u00E9 pour la room ".concat(roomCode));
        }
    }, 1000);
}
// Fonction pour arrêter le timer d'une room
function stopRoomTimer(roomCode, io) {
    if (roomTimers[roomCode]) {
        clearInterval(roomTimers[roomCode]);
        delete roomTimers[roomCode];
        delete roomTimeLeft[roomCode];
        delete roomImageIndex[roomCode];
        io.to(roomCode).emit('game timer stop');
    }
}
// Charger les données du jeu
try {
    var gameDataPath = (0, path_1.join)(process.cwd(), 'public/game.json');
    gameDB = JSON.parse((0, fs_1.readFileSync)(gameDataPath, 'utf-8'));
}
catch (error) {
    console.error('Erreur lors du chargement des données du jeu:', error);
}
var app = (0, next_1.default)({ dev: dev, hostname: hostname, port: port });
var handle = app.getRequestHandler();
app.prepare().then(function () {
    var server = (0, http_1.createServer)(function (req, res) {
        var parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    var io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on('connection', function (socket) {
        console.log('Nouvel utilisateur connecté:', socket.id);
        // Debug
        socket.on('debug', function (message) {
            console.log('Debug:', message);
        });
        // Obtenir toutes les rooms
        socket.on('get rooms', function () {
            socket.emit('rooms', rooms);
        });
        // Obtenir une room spécifique
        socket.on('get room', function (roomCode) {
            var room = rooms[roomCode];
            if (room) {
                socket.emit('room update', roomCode, room);
            }
        });
        // Obtenir un utilisateur
        socket.on('get user', function (userId) {
            var user = users[userId];
            if (user) {
                socket.emit('user', user);
            }
        });
        // Créer un utilisateur
        socket.on('user create', function (userId, username) {
            users[userId] = {
                id: userId,
                name: username,
                socketId: socket.id,
                points: 0
            };
            console.log('Utilisateur créé:', users[userId]);
            socket.emit('user', users[userId]);
        });
        // Créer une room
        socket.on('room create', function (roomData) {
            var room = {
                code: roomData.code,
                name: roomData.name,
                owner: roomData.owner,
                mode: roomData.mode,
                difficulty: roomData.difficulty,
                duration: roomData.duration,
                privacy: roomData.privacy,
                gameState: 'wait',
                gameDB: [],
                users: {}
            };
            rooms[roomData.code] = room;
            console.log('Room créée:', room);
            io.emit('rooms', rooms);
        });
        // Rejoindre une room
        socket.on('room joined', function (roomCode, userId) {
            var room = rooms[roomCode];
            var user = users[userId];
            if (room && user) {
                socket.join(roomCode);
                room.users[userId] = {
                    name: user.name,
                    points: user.points,
                    role: room.owner === userId ? 'admin' : 'player',
                    status: true,
                    alive: true
                };
                console.log("".concat(user.name, " a rejoint ").concat(roomCode));
                io.emit('room update', roomCode, room);
                io.emit('player update', roomCode, room.users);
                io.emit('chat join', userId, roomCode);
            }
            else {
                console.log('Room ou utilisateur inexistant');
            }
        });
        // Démarrer le jeu
        socket.on('game start', function (roomCode) {
            var room = rooms[roomCode];
            if (room) {
                room.gameState = 'playing';
                room.gameDB = gameDB;
                // Initialiser l'index d'image à 0
                roomImageIndex[roomCode] = 0;
                // Démarrer le timer pour cette room
                startRoomTimer(roomCode, room.duration, io);
                io.emit('game start', roomCode);
                io.emit('game update', roomCode, room, room.gameState);
                io.emit('room update', roomCode, room);
                io.to(roomCode).emit('game image update', roomCode, 0);
            }
        });
        // Répondre au jeu
        socket.on('game answer', function (roomCode, userId, correct, mode, gameState, roomGameDB, points) {
            var room = rooms[roomCode];
            var roomUser = room === null || room === void 0 ? void 0 : room.users[userId];
            if (!room || !roomUser)
                return;
            if (mode === 'name') {
                if (correct && !roomUser.status) {
                    roomUser.points += 100;
                    roomUser.status = true;
                    io.emit('player update', roomCode, room.users);
                }
            }
            else if (mode === 'map') {
                if (correct && roomUser.status) {
                    roomUser.points += points;
                    io.emit('player update', roomCode, room.users);
                }
            }
            io.emit('game update', roomCode, room, gameState);
        });
        // Passer à l'image suivante manuellement
        socket.on('next image', function (roomCode) {
            var room = rooms[roomCode];
            if (room && room.gameDB && room.gameDB.length > 0) {
                var currentIndex = roomImageIndex[roomCode] || 0;
                var nextIndex = currentIndex + 1;
                if (nextIndex < room.gameDB.length) {
                    // Arrêter le timer actuel
                    stopRoomTimer(roomCode, io);
                    // Passer à l'image suivante
                    roomImageIndex[roomCode] = nextIndex;
                    io.to(roomCode).emit('game image update', roomCode, nextIndex);
                    // Redémarrer le timer pour l'image suivante
                    setTimeout(function () {
                        startRoomTimer(roomCode, room.duration, io);
                    }, 1000); // 1 seconde de pause
                }
                else {
                    // Fin du jeu
                    room.gameState = 'end';
                    delete roomImageIndex[roomCode];
                    stopRoomTimer(roomCode, io);
                    io.to(roomCode).emit('game end', roomCode);
                    io.emit('room update', roomCode, room);
                }
            }
        });
        // Réinitialiser le jeu
        socket.on('game reset', function (roomCode) {
            var room = rooms[roomCode];
            if (room) {
                room.gameState = 'wait';
                room.gameDB = [];
                // Arrêter le timer
                stopRoomTimer(roomCode, io);
                // Réinitialiser les scores
                Object.values(room.users).forEach(function (user) {
                    user.points = 0;
                    user.status = true;
                    user.alive = true;
                });
                io.emit('game reset', roomCode);
                io.emit('game update', roomCode, room, room.gameState);
                io.emit('player update', roomCode, room.users);
                io.emit('room update', roomCode, room);
            }
        });
        // Générer UUID
        socket.on('uuid', function () {
            socket.emit('uuid', (0, uuid_1.v4)());
        });
        // Messages de chat
        socket.on('chat message', function (roomCode, userId, message) {
            var room = rooms[roomCode];
            var user = users[userId];
            if (room && user) {
                console.log("Message de ".concat(user.name, " dans ").concat(roomCode, ": ").concat(message));
                io.to(roomCode).emit('chat message', roomCode, user.name, message);
            }
        });
        // Déconnexion
        socket.on('disconnect', function () {
            console.log('Utilisateur déconnecté:', socket.id);
            var userId = '';
            for (var uid in users) {
                var user = users[uid];
                if (user && user.socketId === socket.id) {
                    userId = uid;
                    break;
                }
            }
            if (userId) {
                var _loop_1 = function (roomCode) {
                    var room = rooms[roomCode];
                    var roomUser = room === null || room === void 0 ? void 0 : room.users[userId];
                    if (room && roomUser) {
                        roomUser.alive = false;
                        io.emit('player update', roomCode, room.users);
                        io.emit('chat leave', userId, roomCode);
                        io.emit('room update', roomCode, room);
                        // Supprimer la room si vide
                        var aliveUsers = Object.values(room.users).filter(function (user) { return user.alive; });
                        if (aliveUsers.length === 0) {
                            setTimeout(function () {
                                var currentRoom = rooms[roomCode];
                                if (currentRoom && Object.values(currentRoom.users).every(function (user) { return !user.alive; })) {
                                    stopRoomTimer(roomCode, io);
                                    delete rooms[roomCode];
                                    console.log("Room ".concat(roomCode, " supprim\u00E9e (vide)"));
                                }
                            }, 5000);
                        }
                    }
                };
                for (var roomCode in rooms) {
                    _loop_1(roomCode);
                }
                delete users[userId];
            }
        });
    });
    server.listen(port, function () {
        console.log("> Serveur pr\u00EAt sur http://".concat(hostname, ":").concat(port));
        console.log('> Socket.io server running');
    });
});

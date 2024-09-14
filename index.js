const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { readFileSync } = require('fs');

const app = express();
const server = createServer(app);
const io = new Server(server);

let rooms = {};
let users = {};

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/js/:file', (req, res) => {
    const file = req.params.file;
    res.sendFile(join(__dirname, 'js', file));
});

app.get('/images/:file', (req, res) => {
    const file = req.params.file;
    res.sendFile(join(__dirname, 'res/img', file));
});

app.get('/game/:roomCode', (req, res) => {
    const roomCode = req.params.roomCode;
    if (rooms[roomCode]) {
        res.sendFile(__dirname + '/game.html');
    } else {
        res.status(404).send('Room does not exist');
    }
});

let gameDB = JSON.parse(readFileSync('./res/json/game.json', 'utf-8'));

io.on('connection', (socket) => {
    
    // console.log('a user connected ' + socket.id);
    
    socket.on('debug', (msg) => {
        console.log(`debug message: ${msg}`);
    });

    socket.on('get rooms', () => {
        socket.emit('rooms', rooms);
    }); 

    socket.on('get room', (roomCode) => {
        io.emit('room update', roomCode, rooms[roomCode]);
    });

    socket.on('get user', (userId) => {
        socket.emit('user', users[userId]);
    });

    // socket.on('disconnect', () => {
    //     console.log('user disconnected');
    //     let userId = "";
    //     for(let user in users) {
    //         if(users[user].socketId === socket.id) {
    //             userId = user;
    //             for (let room in rooms) {
    //                 if (rooms[room].users[userId]) {
    //                     delete rooms[room].users[userId];
    //                     io.emit(`player update ${room}`, rooms[room].users);
    //                     io.emit('chat leave', users[userId].name, room);
    //                 }
    //                 if(Object.keys(rooms[room].users).length === 0) {
    //                     setTimeout(function(){
    //                             if(rooms[room]) {
    //                                 if(Object.keys(rooms[room].users).length === 0) {
    //                                 delete rooms[room];
    //                                 // console.log('room deleted');
    //                             }
    //                         }
    //                     }, 10000);
    //                 }
    //             }
    //         }
    //     }
    // });
    socket.on('disconnect', () => {
        console.log('user disconnected');
        let userId = "";
        for(let user in users) {
            if(users[user].socketId === socket.id) {
                userId = user;
                for (let room in rooms) {
                    if (rooms[room].users[userId]) {
                        // setTimeout(function(){
                            rooms[room].users[userId].alive = false;
                            io.emit(`player update ${room}`, rooms[room].users);
                            io.emit('chat leave', userId, room);
                            io.emit('room update', room, rooms[room]);
                        // }, 250);
                    }
                    if(Object.keys(rooms[room].users).length === 0 || Object.values(rooms[room].users).every(user => user.alive === false)) {
                        setTimeout(function(){
                                if(rooms[room]) {
                                    if(Object.keys(rooms[room].users).length === 0 || Object.values(rooms[room].users).every(user => user.alive === false)) {
                                    delete rooms[room];
                                    // console.log('room deleted');
                                }
                            }
                        }, 10000);
                    }
                }
            }
        }
    });

    
    // socket.on('room leave', (roomCode, userId) => {
    //     if (rooms[roomCode]) {
    //         console.log(`room ${roomCode} left`);
    //         delete rooms[roomCode].users[userId].name;
    //         io.emit(`player update ${roomCode}`, rooms[roomCode].users);
    //     } else {
    //         console.log('room does not exist');
    //     }
    // })
    
    socket.on('user create', (userId, username) => {
        users[`${userId}`] = {
            name: username,
            socketId: socket.id
        };
        socket.id = userId;
        console.log('user created');
        console.log(users);
    })
    
    socket.on('room create', (room) => {
        rooms[room.code] = {
            name: room.name,
            owner: room.owner,
            mode: room.mode,
            difficulty: room.difficulty,
            duration: room.duration,
            privacy: room.privacy,
            gameState: "wait",
            gameDB: {},
            users: {}
        };
        
        console.log('room created');
        console.log(rooms);
        
    });
    
    socket.on('room joined', (roomCode, userId) => {
        console.log(`User: ${userId} joined room: ${roomCode}`);
        if(users[userId]) console.log(`${users[userId].name}`);
        if (users[userId]) {
            if (users[userId].socketId !== socket.id) {
                users[userId].socketId = socket.id;
            }
        }
        if (rooms[roomCode]) {
            console.log(`room ${roomCode} joined`);
            console.log(rooms[roomCode].users);
            if (!rooms[roomCode].users[userId]) {
                rooms[roomCode].users[userId] = {
                    name: users[userId].name,
                    points: 0,
                    role: 'player', 
                    team: undefined,
                    status: false,
                    alive: true
                };
            } else {
                rooms[roomCode].users[userId].name = users[userId].name;
                rooms[roomCode].users[userId].alive = true;
            }
            io.emit(`player update ${roomCode}`, rooms[roomCode].users);
            io.emit('chat join', userId, roomCode);
            
        } else {
            console.log('room does not exist');
        }
    });
    
    socket.on('game start', async (roomCode) => {
        gameDB = await JSON.parse(readFileSync('./res/json/game.json', 'utf-8'));
        rooms[roomCode].gameState = "image 1";
        rooms[roomCode].gameDB = gameDB; // <--- A MODIFIER
        io.emit('game start', roomCode);
        io.emit('game update', roomCode, rooms[roomCode], rooms[roomCode].gameState);
        io.emit('room update', roomCode, rooms[roomCode]);
    });

    socket.on('game answer', (roomCode, userId, correct , mode, gameState, roomGameDB) => {
        if (correct && mode == "name" && rooms[roomCode].users[userId].status == false) rooms[roomCode].users[userId].points += 100;
        rooms[roomCode].users[userId].status = true;
        io.emit(`player update ${roomCode}`, rooms[roomCode].users);

        // Changer d'image
        if (Object.values(rooms[roomCode].users).every(user => user.status == true)) {
            console.log('all players answered');
            console.log(roomGameDB[gameState.split(' ')[1]]);
            if(roomGameDB[gameState.split(' ')[1]]) {
                console.log('next image');
                rooms[roomCode].gameState = `image ${parseInt(gameState.split(' ')[1])+1}`;
                rooms[roomCode].users = Object.fromEntries(Object.entries(rooms[roomCode].users).map(([key, value]) => [key, {...value, status: false}]));
                io.emit('game update', roomCode, rooms[roomCode], rooms[roomCode].gameState);
                io.emit('room update', roomCode, rooms[roomCode]);
                io.emit('game image update', roomCode, parseInt(gameState.split(' ')[1])+1);
            } else {
                console.log('end of game');
                rooms[roomCode].gameState = "end";
                rooms[roomCode].users = Object.fromEntries(Object.entries(rooms[roomCode].users).map(([key, value]) => [key, {...value, status: false}]));
                io.emit('game update', roomCode, rooms[roomCode], rooms[roomCode].gameState);
                io.emit('room update', roomCode, rooms[roomCode]);
                io.emit('game end', roomCode);
            }
        }
    })

    socket.on('game reset', (roomCode) => {
        setTimeout(function(){
            rooms[roomCode].gameState = "wait";
            rooms[roomCode].users = Object.fromEntries(Object.entries(rooms[roomCode].users).map(([key, value]) => [key, {...value, points: 0}]));
            io.emit('game update', roomCode, rooms[roomCode], rooms[roomCode].gameState);
            io.emit('room update', roomCode, rooms[roomCode]);
            io.emit(`player update ${roomCode}`, rooms[roomCode].users);
            io.emit('game reset', roomCode);

        }, 2500);
    });

    socket.on('uuid', () => {
        socket.emit('uuid', uuidv4());
    });
    
    socket.on('chat message' , (roomCode, userId, message) => {
        // console.log(users[userId].name);
        io.emit('game update', roomCode, rooms[roomCode], rooms[roomCode].gameState);
        io.emit(`chat message ${roomCode}`, users[userId].name, message);
    });
    
    
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});
const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = createServer(app);
const io = new Server(server);

let rooms = {};
let users = {};

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/js/:file', (req, res) => {
    if(req.params.file === 'three.min.js' || req.params.file === 'panolens.min.js') {
        const file = req.params.file;
        res.sendFile(join(__dirname, 'js', file));
    }
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
/*
## TEMPLATE FOR USER CREATION
{
    id: uuidv4(),
    name: 'user1',
    points: 0
}
## TEMPLATE FOR ROOM CREATION
{
    name: 'room1',
    users: [user],
    mode: 'mode1', // 'classic', 'solo', 'team'
    difficulty: 'difficulty1', // 'easy', 'medium', 'hard'
    duration: 'quick', // 'quick', 'medium, 'long'
    privacy: 'privacy1', // 'public', 'private', 'password
}
*/


io.on('connection', (socket) => {
    
    console.log('a user connected ' + socket.id);
    

    socket.on('disconnect', () => {
        console.log('user disconnected');
        let userId = "";
        for(let user in users) {
            if(users[user].socketId === socket.id) {
                userId = user;
                for (let room in rooms) {
                    if (rooms[room].users[userId]) {
                        delete rooms[room].users[userId];
                        io.emit(`player update ${room}`, rooms[room].users);
                    }
                }
            }
        }
    });

    socket.on('room leave', (roomCode, userId) => {
        if (rooms[roomCode]) {
            console.log(`room ${roomCode} left`);
            delete rooms[roomCode].users[userId].name;
            io.emit(`player update ${roomCode}`, rooms[roomCode].users);
        } else {
            console.log('room does not exist');
        }
    })

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
            mode: room.mode,
            difficulty: room.difficulty,
            duration: room.duration,
            privacy: room.privacy,
            users: {}
        };
    
        console.log('room created');
        console.log(rooms);

    });

    socket.on('room joined', (roomCode, userId) => {
        if (users[userId]) {
            if (users[userId].socketId !== socket.id) {
                users[userId].socketId = socket.id;
            }
        }
        if (rooms[roomCode]) {
            console.log(`room ${roomCode} joined`);
            console.log(rooms[roomCode].users);
            rooms[roomCode].users[userId] = {
                name: users[userId].name,
                points: 0,
                role: 'player', 
                team: undefined,
                status: false
            };
            io.emit(`player update ${roomCode}`, rooms[roomCode].users);
            

            for (let [key, value] of Object.entries(rooms[roomCode].users)) {
                console.log(`Key: ${key}, Value: ${value}`);
            }
            for(user in users) {
                console.log(users[user].socketId);
            }
            
        } else {
            console.log('room does not exist');
        }
    });

    socket.on('uuid', () => {
        socket.emit('uuid', uuidv4());
    });

    socket.on('chat message' , (roomCode, userId, message) => {
        console.log(users[userId].name);
        io.emit(`chat message ${roomCode}`, users[userId].name, message);
    });
    
    
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});

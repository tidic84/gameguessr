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

    socket.on('room create', (room) => {
        rooms[room.code] = {
            name: room.name,
            users: room.owner,
            mode: room.mode,
            difficulty: room.difficulty,
            duration: room.duration,
            privacy: room.privacy
        };
    
        console.log('room created');
        console.log(rooms);

    });

    socket.on('uuid', () => {
        socket.emit('uuid', uuidv4());
    });
    
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});

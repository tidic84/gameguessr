import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export const configureSocketServer = (httpServer: HTTPServer) => {
  const io = new SocketServer(httpServer);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};
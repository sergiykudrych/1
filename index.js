const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Используем папку public для статических файлов
app.use(express.static(path.join(__dirname, './public')));

// Подключаем Socket.io
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });

    socket.on('screen-share', (screenStream) => {
      socket.to(roomId).emit('screen-shared', screenStream);
    });
  });
});

// Запускаем сервер на порту 5500
server.listen(5500, () => {
  console.log('Server is running on http://localhost:5500');
});

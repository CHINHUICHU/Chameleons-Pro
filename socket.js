require('dotenv').config();
const { Server } = require('socket.io');
const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const { subscriber } = require('./util/subscriber');
const { SERVER_PORT } = process.env;
const { socketAuth } = require('./util/util');

const io = new Server(server);

io.use(socketAuth);

io.on('connection', (socket) => {
  console.log(socket.user);
  console.log('a user connected');
  //   io.to(socket.user.user_id).emit('hello', 'world');
});

subscriber.on('message', (channel, finishedJob) => {
  console.log(JSON.parse(finishedJob));
  io.to(JSON.parse(finishedJob).user_id).emit('hello', finishedJob);
});

server.listen(SERVER_PORT, () => {
  console.log(`server is listening on port ${SERVER_PORT}`);
});

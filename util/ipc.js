require('dotenv').config();
const ipc = require('node-ipc').default;

const { IPC_SERVER_ID, IPC_NETWORK_HOST } = process.env;

ipc.config = {
  appspace: 'app.',
  socketRoot: '/tmp/',
  id: 'chameleons-pro-server',
  retry: 1500,
  silent: true,
};

module.exports = ipc;

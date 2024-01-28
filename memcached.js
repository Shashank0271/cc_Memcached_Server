const { MemeCachedClient } = require("./classes.js");
const {
  handleSetAddReplaceRequest,
  handleGetRequest,
} = require("./handler.js");
const net = require("net");
let port = 11211;

module.exports.startServer = (options) => {
  if (options && options.port) {
    port = options.port;
  }
  let storage;
  const server = net.createServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`starting memcached server on port ${port}`);
    storage = new Map();
  });
  server.on("connection", (serverEndPointSocket) => {
    console.log(`client connected : `, serverEndPointSocket.address());

    const socket = new MemeCachedClient(serverEndPointSocket.address());

    let data = "";

    serverEndPointSocket.on("data", (chunk) => {
      data += chunk.toString();
      //SET ADD REPLACE
      if (
        data.startsWith("set") ||
        data.startsWith("add") ||
        data.startsWith("replace")
      ) {
        data = handleSetAddReplaceRequest(
          data,
          serverEndPointSocket,
          socket,
          storage
        );
      }
      //GET
      else if (data.startsWith("get")) {
        handleGetRequest(data, serverEndPointSocket, socket, storage);
        data = "";
      }
    });
  });
};

/*
storage------
socket : {
  key : {
    datablock : datablock ,
    flag : flag ,
    byteCount : byteCount ,
  }
}
*/

/*
  <message name> <key> <flags> <exptime> <byte count> [noreply]\r\n
  <data block>\r\n
*/

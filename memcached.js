const { Message, Data, MemeCachedClient } = require("./classes.js");
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
      if (data.startsWith("set")) {
        //true when we enter both the first and the second messages
        //now we have to check if we have entered 2 messages
        const com = data.split("\r\n");
        if (com.length === 3) {
          const message = parsemessage(com[0]);
          const dataBlock = com[1].substring(0, message.byteCount);

          if (!storage[socket]) {
            storage.set(socket, new Map()); //new entry created for this client
          }
          const currentTime = new Date();
          const expirationTime = new Date(currentTime);
          expirationTime.setSeconds(currentTime.getSeconds() + message.exptime);
          storage
            .get(socket)
            .set(
              message.key,
              new Data(
                dataBlock,
                message.flag,
                message.byteCount,
                expirationTime
              )
            );

          data = "";
          serverEndPointSocket.write("STORED\r\n");
        }
      } else if (data.startsWith("get")) {
        
        const key = data.substring(
          data.indexOf("get") + 4,
          data.indexOf("\r\n")
        );

        const requiredData = storage.get(socket).get(key);

        if (!requiredData) {
          serverEndPointSocket.write("END\r\n");
        } else if (requiredData.hasExpired()) {
          storage.get(socket).delete(key);
          serverEndPointSocket.write("END\r\n");
        } else {
          serverEndPointSocket.write(
            `VALUE ${key} ${requiredData.flag} ${requiredData.byteCount} \r\n${requiredData.datablock} \r\n`
          );
        }

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
function parsemessage(message) {
  message = message.split(" ");
  const name = message[0];
  const key = message[1];
  const flag = Number(message[2]);
  const exptime = Number(message[3]);
  const byteCount = Number(message[4]);
  return new Message(name, key, flag, exptime, byteCount);
}

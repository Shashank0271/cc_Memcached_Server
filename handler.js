const { Data } = require("./classes.js");
const { parseSetMessage, parseGetMessage } = require("./parser.js");

module.exports.handleSetRequest = (
  data,
  serverEndPointSocket,
  socket,
  storage
) => {
  //true when we enter both the first and the second messages
  //now we have to check if we have entered 2 messages

  const com = data.split("\r\n");
  if (com.length === 3) {
    const message = parseSetMessage(com[0]);

    const dataBlock = com[1].substring(0, message.byteCount);

    if (!storage[socket]) {
      storage.set(socket, new Map()); //new entry created for this client
    }

    let expirationTime;
    if (message.exptime !== 0) {
      const currentTime = new Date();
      expirationTime = new Date(currentTime);
      expirationTime.setSeconds(currentTime.getSeconds() + message.exptime);
    }

    storage
      .get(socket)
      .set(
        message.key,
        new Data(dataBlock, message.flag, message.byteCount, expirationTime)
      );

    data = "";

    if (!message.noreply) {
      serverEndPointSocket.write("STORED\r\n");
    }
  }
  return data;
};

module.exports.handleGetRequest = (
  data,
  serverEndPointSocket,
  socket,
  storage
) => {
  const message = parseGetMessage(data);
  const key = message.key;
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
};

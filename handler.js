const { Data } = require("./classes.js");
const { parseSetMessage, parseGetMessage } = require("./parser.js");

module.exports.handleSetAddReplaceRequest = (
  data,
  serverEndPointSocket,
  socket,
  storage
) => {
  //true when we enter both the first and the second messages
  //now we have to check if we have entered 2 messages
  const com = data.split("\r\n");
  if (com.length === 3) {
    console.log("entered set handler");
    const message = parseSetMessage(com[0]);
    const type = message.name;

    if (
      type === "add" &&
      storage.get(socket) &&
      storage.get(socket).get(message.key)
    ) {
      //add command stores the data only if the server doesn't already hold the data
      serverEndPointSocket.write("NOT_STORED\r\n");
      return "";
    }

    if (
      type === "replace" &&
      (!storage.get(socket) || !storage.get(socket).get(message.key))
    ) {
      serverEndPointSocket.write("NOT_STORED\r\n");
      return "";
    }

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
    } else {
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
      `VALUE ${key} ${requiredData.flag} ${requiredData.byteCount} \r\n${requiredData.datablock}\r\n`
    );
  }
};

module.exports.handlePrependAppend = (
  data,
  serverEndPointSocket,
  socket,
  storage
) => {
  console.log("------------entered prepend/append handler-------------");
  const com = data.split("\r\n");
  if (com.length === 3) {
    const message = parseSetMessage(com[0]);
    const key = message.key;

    //if the value does not exist then dont proceed
    if (!storage.get(socket) && !storage.get(socket).get(key)) {
      serverEndPointSocket.write("NOT STORED\r\n");
      return "";
    }

    const existingData = storage.get(socket).get(key); //DATA
    console.log(existingData);

    const value = com[1].substring(0, message.byteCount);

    let newData;

    if (message.name === "prepend") {
      //prepend
      newData = value + existingData.datablock;
    } else {
      //append
      newData = existingData.datablock + value;
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
        key,
        new Data(newData, message.flag, message.byteCount, expirationTime)
      );
    serverEndPointSocket.write("STORED\r\n");
    return "";
  } else {
    return data;
  }
};

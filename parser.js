const { Message } = require("./classes");

module.exports.parseSetMessage = (message) => {
  message = message.split(" ");
  const name = message[0];
  const key = message[1];
  const flag = Number(message[2]);
  const exptime = Number(message[3]);
  const byteCount = Number(message[4]);
  const noreply = message.length > 4 && message[5] === "noreply";
  return new Message({ name, key, flag, exptime, byteCount, noreply });
};

module.exports.parseGetMessage = (data) => {
  const key = data.substring(data.indexOf("get") + 4, data.indexOf("\r\n"));
  return new Message({ key });
};

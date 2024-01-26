const net = require("net");
let port = 11211;

triggerPrompt = async () => {
  const portSpecified = process.argv[2] === "-p";
  if (portSpecified) {
    try {
      const portNumer = Number(process.argv[3]);
      startServer({ port: portNumer });
    } catch (e) {
      console.log("Please provide appropriate port !");
      process.exit(0);
    }
  } else if (process.argv.length > 2) {
    console.log("please provide a valid input");
    process.exit(0);
  } else {
    startServer({});
  }
};

function startServer(options) {
  if (options && options.port) {
    port = options.port;
  }
  const server = net.createServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(`starting memcached server on port ${port}`);
  });
  server.on("connection", (serverEndPointSocket) => {
    console.log(`client connected : ${serverEndPointSocket.address()}`);
    serverEndPointSocket.on("data", (chunk) => {
      const command = chunk.toString("utf-8");
      const parsedCommand = parseCommand(command);
    });
  });
}

//returns the parsed command in the form of a json object
/*
  <command name> <key> <flags> <exptime> <byte count> [noreply]\r\n
  <data block>\r\n
*/
function parseCommand(command) {
  command = command.split(" ");
  const name = command[0];
  const key = command[1];
  const flag = Number(command[2]);
  const exptime = Number(command[3]);
  const byteCount = Number(command[4]);
  return new Message(name, key, flag, exptime, byteCount);
}

triggerPrompt();

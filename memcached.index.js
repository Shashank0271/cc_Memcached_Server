const net = require("net");
const { Message, Data, MemeCachedClient } = require("./classes.js");
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
        //true when we enter both the first and the second commands
        //now we have to check if we have entered 2 commands

        const com = data.split("\r\n");
        if (com.length === 3) {
          const command = parseCommand(com[0]);
          const dataBlock = com[1].substring(0, command.byteCount);

          if (!storage[socket]) {
            storage.set(socket, new Map()); //new entry created for this client
          }

          storage
            .get(socket)
            .set(
              command.key,
              new Data(dataBlock, command.flag, command.byteCount)
            );
          console.log(dataBlock);
          data = "";
          serverEndPointSocket.write("STORED\r\n");
        }
      } else if (data.startsWith("get")) {
        const key = data.substring(
          data.indexOf("get") + 4,
          data.indexOf("\r\n")
        );
        const requiredData = storage.get(socket).get(key);
        console.log(requiredData);
        if (!requiredData) {
          socket.write("END\r\n");
        } else {
          serverEndPointSocket.write(
            `VALUE ${key} ${requiredData.flag} ${requiredData.byteCount} \r\n${requiredData.datablock} \r\n`
          );
        }
        data = "";
      }
    });
  });
}

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

const { startServer } = require("./memcached.js");

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
    console.log("invalid input");
    process.exit(0);
  } else {
    startServer({});
  }
};

triggerPrompt();

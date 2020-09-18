
const { initSdk, processReady, activateGameSession, acceptPlayerSession, getInstanceCertificate, terminateGameSession } = require('./dist/index.js');
// const log = require('why-is-node-running')

async function main() {
  await initSdk();
  console.log("Initialized!");

  await processReady({
    port: 3000,
    logParameters: [],
    onStartGameSession: async (gameSession) => {
      console.log("OnStartGameSession");
      console.log(gameSession);
      await activateGameSession();

      setTimeout(terminateGameSession, 90 * 1000);
    },
  });

  const result = await getInstanceCertificate();
  console.dir(result.hostName);
};

main();
// setTimeout(log, 3000);

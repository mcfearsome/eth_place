import { default as EthPlaceWorker } from './ethPlaceWorker.js'

var worker = new EthPlaceWorker();

worker.daemon();

process.on('SIGTERM', function () {
  if (worker === undefined) return;
  worker.closeDaemon();
});

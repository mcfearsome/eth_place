'use strict';

var _ethPlaceWorker = require('./ethPlaceWorker.js');

var _ethPlaceWorker2 = _interopRequireDefault(_ethPlaceWorker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var worker = new _ethPlaceWorker2.default();

worker.daemon();

process.on('SIGTERM', function () {
  if (worker === undefined) return;
  worker.closeDaemon();
});
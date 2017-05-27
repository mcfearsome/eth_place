'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
// import { default as contract } from 'truffle-contract'


var _web = require('web3');

var _web2 = _interopRequireDefault(_web);

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _EthPlace = require('./EthPlace.json');

var _EthPlace2 = _interopRequireDefault(_EthPlace);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CONTRACT_ADDRESS = process.env.ETHPLACE_ADDRESS;
var GETH_HOST = process.env.GETH_HOST;
var GETH_PORT = process.env.GETH_PORT;
var REDIS_HOST = process.env.REDIS_HOST;
var REDIS_PORT = process.env.REDIS_PORT;
var NUM_PIXELS = 999999;

var times = function times(n) {
  return function (f) {
    var iter = function iter(i) {
      if (i === n) return;
      f(i);
      iter(i + 1);
    };
    return iter(0);
  };
};

var EthPlaceWorker = function () {
  function EthPlaceWorker() {
    _classCallCheck(this, EthPlaceWorker);

    console.log('ADDRESS: ' + CONTRACT_ADDRESS);
    this.redisClient = _redis2.default.createClient(REDIS_PORT, REDIS_HOST);

    this.gethHost = GETH_HOST;
    this.gethPort = GETH_PORT;
    this.web3 = new _web2.default(this.web3Provider());
    this.EthPlace = this.web3.eth.contract(_EthPlace2.default.abi);
    this.contractAddress = CONTRACT_ADDRESS;
    this.contractInstance = this.EthPlace.at(this.contractAddress);
    this.PixelPurchasedEvent = this.contractInstance.PixelPurchased({});
  }

  _createClass(EthPlaceWorker, [{
    key: 'web3Provider',
    value: function web3Provider() {
      return new _web2.default.providers.HttpProvider(this.gethLocation());
    }
  }, {
    key: 'gethLocation',
    value: function gethLocation() {
      return 'http://' + this.gethHost + ':' + this.gethPort;
    }
  }, {
    key: 'daemon',
    value: function daemon() {
      var redisClient = this.redisClient;

      this.PixelPurchasedEvent.watch(function (err, event) {
        console.log(event);
        if (err) {
          console.log(err);
        }
        if (event == null) return;
        console.log('storing pixel: ' + event.args.location);
        console.log('color: ' + event.args.color);
        console.log('purchaser: ' + event.args.purchaser);
        redisClient.hmset('pixel_' + event.args.location, {
          'purchaser': event.args.purchaser,
          'color': event.args.color,
          'url': event.args.url
        });
      });
    }
  }, {
    key: 'closeDaemon',
    value: function closeDaemon() {
      this.PixelPurchased.stopWatching();
    }
  }, {
    key: 'sync',
    value: function sync() {
      var redisClient = this.redisClient;
      var EthPlace = this.EthPlace;
      times(NUM_PIXELS)(function (x) {
        var pixel = EthPlace.getPixel(x);
        redisClient.hmset('pixel_' + x, {
          'purchaser': pixel[1],
          'color': pixel[2],
          'url': pixel[3]
        });
      });
    }
  }]);

  return EthPlaceWorker;
}();

exports.default = EthPlaceWorker;
import { default as Web3 } from 'web3';
// import { default as contract } from 'truffle-contract'
import { default as redis } from 'redis'
import ethplace_artifacts from './EthPlace.json'

const CONTRACT_ADDRESS = process.env.ETHPLACE_ADDRESS;
const GETH_HOST = process.env.GETH_HOST;
const GETH_PORT = process.env.GETH_PORT;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;
const NUM_PIXELS = 999999;

const times = n => f => {
  let iter = i => {
    if (i === n) return
    f (i)
    iter (i + 1)
  }
  return iter (0)
}

class EthPlaceWorker {
  constructor() {
    console.log('ADDRESS: ' + CONTRACT_ADDRESS);
    this.redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);

    this.gethHost = GETH_HOST;
    this.gethPort = GETH_PORT;
    this.web3 = new Web3(this.web3Provider());
    this.EthPlace = this.web3.eth.contract(ethplace_artifacts.abi);
    this.contractAddress = CONTRACT_ADDRESS;
    this.contractInstance = this.EthPlace.at(this.contractAddress);
    this.PixelPurchasedEvent = this.contractInstance.PixelPurchased({});
  }

  web3Provider() {
    return new Web3.providers.HttpProvider(this.gethLocation());
  }

  gethLocation() {
    return 'http://' + this.gethHost + ':' + this.gethPort;
  }

  daemon() {
    var redisClient = this.redisClient;

    this.PixelPurchasedEvent.watch(
      function(err, event) {
        console.log(event);
        if(err) {
          console.log(err);
        }
        if (event == null) return;
        console.log('storing pixel: ' + event.args.location);
        console.log('color: ' + event.args.color);
        console.log('purchaser: ' + event.args.purchaser);
        redisClient.hmset(
          'pixel_' + event.args.location,
          {
            'purchaser': event.args.purchaser,
            'color': event.args.color,
            'url': event.args.url
          }
        );
      }
    )
  }

  closeDaemon() {
    this.PixelPurchased.stopWatching();
  }

  sync() {
    var redisClient = this.redisClient;
    var EthPlace = this.EthPlace;
    times(NUM_PIXELS) (
      x => {
        let pixel = EthPlace.getPixel(x);
        redisClient.hmset(
          'pixel_' + x,
          {
            'purchaser': pixel[1],
            'color': pixel[2],
            'url': pixel[3]
          }
        )
      }

    )
  }

}

export { EthPlaceWorker as default }

pragma solidity ^0.4.11;

contract EthPlace {
  address owner;
  uint constant maxLocation = 999999;
  uint constant bidIncrement = 1000000000000000;
  struct Pixel {
    address owner;
    string color;
    string url;
    uint price;
  }
  uint public refundBalance;
  mapping (uint => Pixel) pixels;
  mapping (address => uint) public pendingRefunds;
  event PixelPurchased(uint indexed location, address purchaser, string color, string url, uint price);
  event PixelRefunded(address refundAddress);

  modifier onlyOwner {
    require(msg.sender == owner);
    _;
  }

  function EthPlace() {
    owner = msg.sender;
  }

  function getPixel(uint x, uint y) constant returns (address, string, string, uint) {
    uint location = pixelLocation(x, y);
    Pixel pixel = pixels[location];
    return (pixel.owner, pixel.color, pixel.url, pixel.price);
  }

  function getPixel(uint location) constant returns (address, string, string, uint) {
    Pixel pixel = pixels[location];
    return (pixel.owner, pixel.color, pixel.url, pixel.price);
  }

  function bidPixel(uint location, string color, string url) public payable {
    assert(location <= maxLocation);
    Pixel currentPixel = pixels[location];

    uint minBid = bidIncrement;
    // Has this pixel been bid on before?
    if (currentPixel.owner != 0x0) {
      minBid = currentPixel.price + bidIncrement;
    }

    // Minimum bid for this pixel not met
    assert(msg.value >= minBid);

    // Set refund data
    address refundAddress = currentPixel.owner;
    uint refundAmount = currentPixel.price;

    // Set the new owner of the pixel
    currentPixel.owner = msg.sender;
    currentPixel.color = color;
    currentPixel.url = url;
    currentPixel.price = msg.value;

    // Now that currentPixel has been set, we can refund the old owner
    if (refundAddress != 0x0) {
      pendingRefunds[refundAddress] = pendingRefunds[refundAddress] + refundAmount;
      refundBalance += refundAmount;
      PixelRefunded(refundAddress);
    }

    PixelPurchased(
      location,
      msg.sender,
      currentPixel.color,
      currentPixel.url,
      currentPixel.price
    );
  }

  function claimRefund() {
    uint amount = pendingRefunds[msg.sender];
    assert(amount > 0);
    pendingRefunds[msg.sender] = 0;
    refundBalance -= amount;
    if (!msg.sender.send(amount)) {
        pendingRefunds[msg.sender] = amount;
        refundBalance += amount;
    }
  }

  function pixelLocation(uint x, uint y) private returns (uint) {
    return x + (y * 1000);
  }

  function close() onlyOwner {
    selfdestruct(owner);
  }

  function withdraw() onlyOwner {
    owner.transfer(this.balance - refundBalance);
  }
}

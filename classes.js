class Message {
  constructor(options) {
    this.name = options.name;
    this.key = options.key;
    this.flag = options.flag;
    this.exptime = options.exptime;
    this.byteCount = options.byteCount;
    this.noreply = options.noreply;
  }
}

class Data {
  //'value' corresponding to each key
  constructor(datablock, flag, byteCount, expirationtime) {
    this.datablock = datablock;
    this.flag = flag;
    this.byteCount = byteCount;
    this.expirationtime = expirationtime;
  }

  hasExpired() {
    return new Date() >= this.expirationtime;
  }
}

class MemeCachedClient {
  constructor(options) {
    this.address = options.address;
    this.family = options.family;
    this.port = options.port;
  }
}

module.exports = { Message, Data, MemeCachedClient };

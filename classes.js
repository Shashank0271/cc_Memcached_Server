class Message {
  constructor(name, key, flag, exptime, byteCount) {
    this.name = name;
    this.key = key;
    this.flag = flag;
    this.exptime = exptime;
    this.byteCount = byteCount;
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

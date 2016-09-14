BTDevice = (function() {
  // ------------------------------------------------
  // Collectin of functions for generating test data
  // ------------------------------------------------
  var BTDevice = function(macAddress) {
    this["BTFound"] = {};
    this["BTDeviceType"] = "DEVICE_TYPE_DUAL";
    this["MACAddress"] = macAddress || this.getRandomMACaddress();
    this["friendlyName"] = this.getRandomName();
    this["lastSeen"] = this.getUNIXTime();
    this["rssi"] = Math.floor(Math.random() * maxDistance);
    this["timesDiscovered"] = 0;
    this["type"] = "uncategorized";
  };

  // Returns a random hex-value.
  BTDevice.prototype.getRandomHexValue = function() {
    var length = 2;
    var chars = "0123456789ABCDEF";
    var hex = "";
    while(length--) hex += chars[(Math.random() * 16) | 0];
    return hex;
  };

  // Returns a random MAC-address.
  BTDevice.prototype.getRandomMACaddress = function() {
    var mac = "";
    mac += this.getRandomHexValue() + ":";
    mac += this.getRandomHexValue() + ":";
    mac += this.getRandomHexValue() + ":";
    mac += this.getRandomHexValue() + ":";
    mac += this.getRandomHexValue() + ":";
    mac += this.getRandomHexValue();
    return mac;
  };

  // Returns a random name.
  BTDevice.prototype.getRandomName = function() {
    return "XXRBJ151800103";
  };

  // Returns a random UNIX timestamp.
  BTDevice.prototype.getUNIXTime = function() {
    var unix = Math.round(+new Date()/1000);
    return unix;
  };

  // Add a device to the found list.
  BTDevice.prototype.addDevice = function(device) {
    if(!(device["MACAddress"] in this["BTFound"]))
    {
      this["BTFound"][device["MACAddress"]] = {};
      this["BTFound"][device["MACAddress"]]["ref"] = device;
      this["BTFound"][device["MACAddress"]]["rssi"] = device.getDistanceTo(this); 
      this["BTFound"][device["MACAddress"]]["lastSeen"] = this.getUNIXTime();
      this["BTFound"][device["MACAddress"]]["timesDiscovered"] = Math.floor(Math.random() * 10) + 1;
      device.addDevice(this);
    }
  };

  // Get ID.
  BTDevice.prototype.getID = function() {
    var id = this["MACAddress"].replace(/:/gi, "");
    return id;
  }

  BTDevice.prototype.getDistanceTo = function(device) {
    if((device["MACAddress"] in this["BTFound"]))
    {
      return this["BTFound"][device["MACAddress"]]["rssi"];
    }

    return Math.floor(Math.random() * 99) + 1;
  };

  // Serialize the device and return a json object.
  BTDevice.prototype.serialize = function() {
    // Create device descriptor.
    var json = {
      "BTFound": {},
      "MACAddress": this["MACAddress"],
      "friendlyName": this["friendlyName"],
      "lastSeen": this["lastSeen"]
    };

    // Add found devices.
    var btFound = this["BTFound"];
    Object.keys(btFound).forEach(function(key, index) {
      var dev = btFound[key] 
        json["BTFound"][key] = {
          "BTDeviceType":     dev["ref"]["BTDeviceType"],
          "MACAddress":       dev["ref"]["MACAddress"],
          "friendlyName":     dev["ref"]["friendlyName"],
          "lastSeen":         dev["lastSeen"],
          "rssi":             dev["rssi"],
          "timesDiscovered":  dev["timesDiscovered"],
          "type":             dev["ref"]["type"]
        };
    });

    return json;
  };

  return BTDevice;
})();

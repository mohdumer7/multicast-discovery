const adb = require("adbkit");
const debug = require("debug");
const client = adb.createClient();
const onDevices = () => {
  client
    .trackDevices()
    .then(function (tracker) {
      tracker.on("add", function (device) {
        debug("Device %s was plugged in", device.id);
        client.listDevices().then(function (devices) {
          debug(devices);
          console.log("devices", devices);
          return devices;
        });
      });
      tracker.on("remove", function (device) {
        debug("Device %s was unplugged", device.id);
        client.listDevices().then(function (devices) {
          debug(devices);
          console.log("devices", devices);
        });
      });
      tracker.on("end", function () {
        debug("Tracking stopped");
      });
    })
    .catch(function (err) {
      debug("Something went wrong:", err.stack);
    });
};

const connect = async (args) => {
  const { id, ip, port } = args;
  const success = "Successfully opened wireless connection";
  const fail = "Failed to open wireless connection";

  // console.log("Connecting to", ip, "on port", port);

  try {
    // console.log("Attempting to connect to", ip, "on port", port);
    await client.connect(ip, port);
    console.log("connect", { success: true, message: success });
  } catch (err) {
    console.error("Connection error", {
      success: false,
      message: fail,
      stack: err,
    });
  }
};

const disconnect = (ip) => {
  client
    .disconnect(ip)
    .then((id) => {
      debug(id);
      console.log("connect", {
        success: false,
        message: "Device shutdown succeeded",
      });
    })
    .catch((err) => {
      debug(err);
      console.log("connect", {
        success: false,
        message: "Device shutdown failed",
      });
    });
};

module.exports = {
  connect,
  disconnect,
  onDevices,
};

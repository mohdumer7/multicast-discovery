const adb = require("adbkit");
const client = adb.createClient();
const debug = require("debug")("scrcpy");

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
      debugor("Something went wrong:", err.stack);
    });
};
const connect = (args) => {
  const { id, ip } = args;
  const success = "Successfully opened wireless connection";
  const fail = "Failed to open wireless connection";
  if (id) {
    client
      .tcpip(id)
      .then(function (port) {
        client
          .connect(ip, port)
          .then(function (err) {
            if (err) {
              console.log("connect Error", {
                success: false,
                message: fail,
                stack: err,
              });
              return;
            }
            console.log("connect", { success: true, message: success });
          })
          .catch((stack) => {
            console.log("connect", { success: false, message: fail, stack });
          });
      })
      .catch(() => {
        client
          .connect(ip)
          .then(function (err) {
            if (err) {
              console.log("connect", { success: false, message: fail });
              return;
            }
            console.log("connect", { success: true, message: success });
          })
          .catch(() => {
            console.log("connect", { success: false, message: fail });
          });
      });
  } else {
    client
      .connect(ip)
      .then(function (err) {
        if (err) {
          console.log("connect", { success: false, message: fail });
          return;
        }
        console.log("connect", { success: true, message: success });
      })
      .catch(() => {
        console.log("connect", { success: false, message: fail });
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

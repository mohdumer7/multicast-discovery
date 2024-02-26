const adb = require("adbkit");
const debug = require("debug");
const client = adb.createClient();
const { exec } = require("child_process");
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

const captureScreen = (deviceId) => {
  const streamingUrl = `rtmp://localhost/live/ADBSCRCPY`;

  const adbCommand = `adb -s ${deviceId} shell screenrecord --output-format=h264 - | ffmpeg -re -i - -c:v libx264 -b:v 1M -preset ultrafast -tune zerolatency -f flv ${streamingUrl}`;

  const adbProcess = exec(adbCommand);

  adbProcess.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  adbProcess.stderr.on("data", (data) => {
    console.error(data.toString());
  });

  adbProcess.on("exit", (code) => {
    console.log(`ADB process exited with code ${code}`);
  });
};

module.exports = {
  connect,
  disconnect,
  onDevices,
  captureScreen,
};

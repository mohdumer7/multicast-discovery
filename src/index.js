const EventEmitter = require("events");
const bonjour = require("bonjour")({ interval: 1000 });
let screenCastDevices = [];
const adb = require("../main/adb");
const scrcpy = require("../main/scrcpy");
class DeviceDiscovery extends EventEmitter {
  static SERVICEUP = "Service Up";
  static SERVICEDOWN = "Service Down";
  static EVENTNAME = "Update";
  constructor(options) {
    super();
    this.devices = [];
    this.changed = true;
    this.deviceTimeoutThreshold = options.deviceTimeoutThreshold || 3000;
    this.lastUpEventTime = null;
    this.serviceType = options.serviceType || "adb-tls-connect";
    this.intervals = [];
  }

  startDeviceDiscovery() {
    this.setupIntervals();
  }

  startBonjourDiscovery() {
    try {
      this.browser = bonjour.find({ type: this.serviceType });

      this.browser.on("up", (service) => {
        this.lastUpEventTime = Date.now();
        this.updateDevices(service);
      });

      this.browser.on("down", (service) => {
        console.log(`${this.serviceType} server went down:`, service);
        this.removeDisconnectedDevice(service);
      });
    } catch (error) {
      this.emitError(`Error starting Bonjour discovery: ${error.message}`);
    }
  }

  updateDevices(service) {
    try {
      const existingDeviceIndex = this.devices.findIndex(
        (device) => device.fqdn === service.fqdn
      );

      if (existingDeviceIndex !== -1) {
        this.devices[existingDeviceIndex] = this.createDeviceObject(service);
      } else {
        this.devices.push(this.createDeviceObject(service));
        this.changed = true;
      }

      this.sendDevicesEvent(DeviceDiscovery.SERVICEUP);
    } catch (error) {
      this.emitError(`Error updating devices: ${error.message}`);
    }
  }

  removeDisconnectedDevice(service) {
    try {
      this.devices = this.devices.filter(
        (device) => device.address !== service?.referer?.address
      );

      this.sendDevicesEvent(DeviceDiscovery.SERVICEDOWN);
    } catch (error) {
      this.emitError(`Error removing disconnected device: ${error.message}`);
    }
  }

  createDeviceObject(service) {
    return {
      ...service,
      lastUpdateTime: this.lastUpEventTime,
    };
  }

  checkDeviceTimeouts() {
    try {
      const currentTime = Date.now();
      this.devices = this.devices.filter((device) => {
        const isNotTimeout =
          currentTime - device.lastUpdateTime <= this.deviceTimeoutThreshold;
        this.changed = this.changed || !isNotTimeout;
        return isNotTimeout;
      });

      this.sendDevicesEvent(DeviceDiscovery.SERVICEDOWN);
    } catch (error) {
      this.emitError(`Error checking device timeouts: ${error.message}`);
    }
  }

  sendDevicesEvent(type) {
    if (this.changed) {
      this.emit(DeviceDiscovery.EVENTNAME, { type, devices: this.devices });
      this.changed = false;
    }
  }

  clearAndRestartBonjourDiscovery() {
    try {
      if (this.browser) {
        this.browser.stop();
      }

      this.startBonjourDiscovery();
    } catch (error) {
      this.emitError(
        `Error clearing and restarting Bonjour discovery: ${error.message}`
      );
    }
  }

  emitError(errorMessage) {
    this.emit("Device Discovery Error", errorMessage);
  }

  setupIntervals() {
    this.intervals.push(
      setInterval(() => this.clearAndRestartBonjourDiscovery(), 100)
    );
    this.intervals.push(setInterval(() => this.checkDeviceTimeouts(), 100));
  }
  cleanup() {
    // Clear all intervals
    if (this.browser) {
      this.browser.stop();
    }
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
  }
}

const options = {
  deviceTimeoutThreshold: 3000,
  serviceType: "adb-tls-connect",
};
const deviceDiscovery = new DeviceDiscovery(options);

deviceDiscovery.on("Update", (devices) => {
  // console.log(devices.devices);
  devices.devices.forEach((device, index) => {
    const id = device.name.split("-")[1];
    const ip = device.referer.address;
    const port = device.port;

    if (!screenCastDevices.includes(port)) {
      // adb.onDevices();
      console.log(`Device ${index + 1} Connected`);
      const config = {
        source: `C:\\scrcpy`,
        title: "scrcpy",
        bitRate: 8,
        maxSize: 0,
        maxFps: 30,
        window: {
          x: 0,
          y: 0,
          height: 100,
          width: 100,
        },
      };
      // adb.connect(args);
      adb
        .connect({ id, ip, port })
        .then(() => {
          console.log(`Casting Device ${index + 1}`);

          const scrId = String(`${ip}:${port}`);
          const event = new EventEmitter();
          event.on(`casting down`, (port) => {
            console.log("Removing Device");
            screenCastDevices = screenCastDevices.filter(
              (devicePort) => devicePort != Number(port)
            );
          });
          // scrcpy.open({
          //   config,
          //   devices: [{ id: scrId, type: "device" }],
          //   event,
          // });
          console.log("---------------------------");
          screenCastDevices.push(port);
        })
        .catch((err) =>
          console.log({
            status: "Error",
            Error: err,
            message:
              "Generally Connection Errors occur due to authorisation, Please Connect to your PC once and authorise",
          })
        );
    }
  });
});

deviceDiscovery.on("Device Discovery Error", (error) => {
  console.error(`An error occurred: ${error}`);
});

deviceDiscovery.startDeviceDiscovery();
console.log("Discovery Started....");
// module.exports = DeviceDiscovery;

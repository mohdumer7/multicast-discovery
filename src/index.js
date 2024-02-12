const EventEmitter = require("events");
const bonjour = require("bonjour")({ interval: 1000 });
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

      // Filter out devices that haven't been updated within the threshold
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
  console.log(devices);
  if (devices.devices[0]) {
    const id = devices.devices[0].name.split("-")[1];
    const ip = devices.devices[0].referer.address;
    const id1 = [{ id: String(`${ip}:5555`), type: "device" }];
    adb.onDevices();
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
    adb.connect({ id, ip });

    console.log(id1);
    scrcpy.open({
      config,
      devices: [{ id: "192.168.1.12:5555", type: "device" }],
    });
  } else {
    console.log("No Devices Found!");
  }
});

deviceDiscovery.on("Device Discovery Error", (error) => {
  console.error(`An error occurred: ${error}`);
});

deviceDiscovery.startDeviceDiscovery();

// module.exports = DeviceDiscovery;

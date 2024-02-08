const EventEmitter = require("events");
const bonjour = require("bonjour")({ interval: 1000 });

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

    this.setupIntervals();
    this.startBonjourDiscovery();
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
    this.intervals.forEach((intervalId) => clearInterval(intervalId));
  }
}

module.exports = DeviceDiscovery;

# device-dicovery

The provided code utilizes the Bonjour protocol to discover nearby devices on the same network as the server is connected to. The application continuously listens for Bonjour events related to a custom service type. The discovered devices are tracked and stored in an array, including their relevant information such as address, fully qualified domain name (fqdn), and the timestamp of the last update.

The code employs intervals to periodically clear and restart the Bonjour discovery process, log changes in the devices array, and check for devices that haven't sent updates within a specified timeout threshold. Additionally, the application emits a "devicesChanged" event whenever the devices array is updated, allowing observers to react to changes in real-time.

The structure is designed to be modular and generic, allowing for easy customization and potential use as a library. The code includes error handling, and there's a cleanup function to clear intervals and remove event listeners when needed.


### INSTALLATION
```shell
npm i
```

### USAGE
```javascript
const DeviceDiscovery = require("device-discovery");

const options = {
  deviceTimeoutThreshold: 3000,
  serviceType: "adb-tls-connect",
}
const deviceDiscovery = new DeviceDiscovery(options);

deviceDiscovery.on("Update", (devices) => {
  console.log("Devices have changed:", devices);
});
```


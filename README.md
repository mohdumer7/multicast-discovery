# device-dicovery

The provided code utilizes the Bonjour protocol to discover nearby devices on the same network as the server is connected to. The application continuously listens for Bonjour events related to a custom service type. The discovered devices are tracked and stored in an array, including their relevant information such as address, fully qualified domain name (fqdn), and the timestamp of the last update.

The structure is designed to be modular and generic, allowing for easy customization and potential use as a library. The code includes error handling, and there's a cleanup function to clear intervals and remove event listeners when needed.


### INSTALLATION
```shell
npm install device-discovery
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

deviceDiscovery.on('Device Discovery Error', (error) => {
  console.error(`An error occurred: ${error}`);
});

//deviceDiscovery.cleanup() //this function can be used for cleanup
```

### Events to subscribe 

1. Update
2. Error

### Options 

1. deviceTimeoutThreshold (Milliseconds)
2. serviceType ([refer](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml))

#### This is an open-source Project, Please feel free to contribute ❤️

// Test dependencies are required and exposed in common/bootstrap.js

exports['Tessel.prototype.findAvailableNetworks'] = {
  setUp: function(done) {
    this.sandbox = sinon.sandbox.create();
    this.findAvailableNetworks = this.sandbox.spy(Tessel.prototype, 'findAvailableNetworks');
    this.logsWarn = this.sandbox.stub(logs, 'warn', function() {});
    this.logsInfo = this.sandbox.stub(logs, 'info', function() {});

    this.tessel = TesselSimulator();

    done();
  },

  tearDown: function(done) {
    this.tessel.mockClose();
    this.sandbox.restore();
    done();
  },

  noNetworks: function(test) {
    test.expect(1);

    this.tessel.findAvailableNetworks()
      .then(function(networks) {
        test.equal(networks.length, 0);
        test.done();
      });

    var networks = JSON.stringify({
      results: []
    });

    this.tessel._rps.stdout.push(networks);

    setImmediate(() => {
      this.tessel._rps.emit('close');
    });
  },

  someNetworks: function(test) {
    test.expect(2);

    var networks = {
      results: [{
        ssid: 'ssid1',
        quality: 21,
        max_quality: 73,
      }, {
        ssid: 'ssid2',
        quality: 5,
        max_quality: 73,
      }, ]
    };

    this.tessel.findAvailableNetworks()
      .then((found) => {
        test.equal(found.length, networks.results.length);
        test.equal(this.findAvailableNetworks.callCount, 1);
        test.done();
      });

    this.tessel._rps.stdout.push(JSON.stringify(networks));

    setImmediate(() => {
      this.tessel._rps.emit('close');
    });
  },

  compareSignalStrengths: function(test) {
    test.expect(5);

    var bestNetwork = {
      ssid: 'best',
      quality: 60,
      quality_max: 73,
    };

    var worstNetwork = {
      ssid: 'worst',
      quality: 5,
      quality_max: 73,
    };

    var middleNetwork = {
      ssid: 'middle',
      quality: 10,
      quality_max: 73,
    };

    var networks = {
      results: [bestNetwork, worstNetwork, middleNetwork]
    };

    this.tessel.findAvailableNetworks()
      .then((found) => {
        test.equal(found.length, networks.results.length);
        test.equal(this.findAvailableNetworks.callCount, 1);
        test.equal(found[0].ssid, bestNetwork.ssid);
        test.equal(found[1].ssid, middleNetwork.ssid);
        test.equal(found[2].ssid, worstNetwork.ssid);
        test.done();
      });

    this.tessel._rps.stdout.push(JSON.stringify(networks));

    setImmediate(() => {
      this.tessel._rps.emit('close');
    });
  },
};

module.exports['Tessel.prototype.connectToNetwork'] = {
  setUp: function(done) {
    this.sandbox = sinon.sandbox.create();
    this.connectToNetwork = this.sandbox.spy(Tessel.prototype, 'connectToNetwork');
    this.logsWarn = this.sandbox.stub(logs, 'warn', function() {});
    this.logsInfo = this.sandbox.stub(logs, 'info', function() {});
    this.setNetworkSSID = this.sandbox.spy(commands, 'setNetworkSSID');
    this.setNetworkPassword = this.sandbox.spy(commands, 'setNetworkPassword');
    this.setNetworkEncryption = this.sandbox.spy(commands, 'setNetworkEncryption');
    this.commitWirelessCredentials = this.sandbox.spy(commands, 'commitWirelessCredentials');
    this.reconnectWifi = this.sandbox.spy(commands, 'reconnectWifi');
    this.getWifiInfo = this.sandbox.spy(commands, 'getWifiInfo');
    this.tessel = TesselSimulator();

    done();
  },
  tearDown: function(done) {
    this.tessel.mockClose();
    this.sandbox.restore();
    done();
  },
  noPassword: function(test) {
    test.expect(8);
    var creds = {
      ssid: 'tank',
      password: undefined
    };

    // Test is expecting several closes...;
    this.tessel._rps.on('control', (command) => {
      if (command.toString() === 'ubus call iwinfo info {"device":"wlan0"}') {
        // Write to stdout so it completes as expected
        // Wrap in setImmediate to make sure listener is set up before emitting
        setImmediate(() => {
          this.tessel._rps.stdout.emit('data', 'signal');
        });
      } else {
        setImmediate(() => {
          // Remove any listeners on stdout so we don't break anything when we write to it
          this.tessel._rps.stdout.removeAllListeners();

          // Continue
          this.tessel._rps.emit('close');
        });
      }
    });

    this.tessel.connectToNetwork(creds)
      .then(() => {
        test.equal(this.setNetworkSSID.callCount, 1);
        test.equal(this.setNetworkPassword.callCount, 0);
        test.equal(this.setNetworkEncryption.callCount, 1);
        test.equal(this.commitWirelessCredentials.callCount, 1);
        test.equal(this.reconnectWifi.callCount, 1);
        test.ok(this.setNetworkSSID.lastCall.calledWith(creds.ssid));
        test.ok(this.setNetworkEncryption.lastCall.calledWith('none'));
        test.ok(this.getWifiInfo.callCount, 1);
        test.done();
      })
      .catch(function(error) {
        test.fail(error);
        test.done();
      });
  },
  properCredentials: function(test) {
    test.expect(9);
    var creds = {
      ssid: 'tank',
      password: 'fish'
    };

    // Test is expecting several closes...;
    this.tessel._rps.on('control', (command) => {
      if (command.toString() === 'ubus call iwinfo info {"device":"wlan0"}') {
        // Write to stdout so it completes as expected
        // Wrap in setImmediate to make sure listener is set up before emitting
        setImmediate(() => {
          this.tessel._rps.stdout.emit('data', 'signal');
        });
      } else {
        setImmediate(() => {
          // Remove any listeners on stdout so we don't break anything when we write to it
          this.tessel._rps.stdout.removeAllListeners();

          // Continue
          this.tessel._rps.emit('close');
        });
      }
    });

    this.tessel.connectToNetwork(creds)
      .then(() => {
        test.equal(this.setNetworkSSID.callCount, 1);
        test.equal(this.setNetworkPassword.callCount, 1);
        test.equal(this.setNetworkEncryption.callCount, 1);
        test.equal(this.commitWirelessCredentials.callCount, 1);
        test.equal(this.reconnectWifi.callCount, 1);
        test.ok(this.setNetworkSSID.lastCall.calledWith(creds.ssid));
        test.ok(this.setNetworkPassword.lastCall.calledWith(creds.password));
        test.ok(this.setNetworkEncryption.lastCall.calledWith('psk2'));
        test.ok(this.getWifiInfo.callCount, 1);
        test.done();
      })
      .catch(function(error) {
        test.fail(error);
        test.done();
      });
  },

  properCredentialsWithSecurity: function(test) {
    test.expect(9);
    var creds = {
      ssid: 'tank',
      password: 'fish',
      security: 'wpa2'
    };

    // Test is expecting several closes...;
    this.tessel._rps.on('control', (command) => {
      if (command.toString() === 'ubus call iwinfo info {"device":"wlan0"}') {
        // Write to stdout so it completes as expected
        // Wrap in setImmediate to make sure listener is set up before emitting
        setImmediate(() => {
          this.tessel._rps.stdout.emit('data', 'signal');
        });
      } else {
        setImmediate(() => {
          // Remove any listeners on stdout so we don't break anything when we write to it
          this.tessel._rps.stdout.removeAllListeners();

          // Continue
          this.tessel._rps.emit('close');
        });
      }
    });

    this.tessel.connectToNetwork(creds)
      .then(() => {
        test.equal(this.setNetworkSSID.callCount, 1);
        test.equal(this.setNetworkPassword.callCount, 1);
        test.equal(this.setNetworkEncryption.callCount, 1);
        test.equal(this.commitWirelessCredentials.callCount, 1);
        test.equal(this.reconnectWifi.callCount, 1);
        test.ok(this.setNetworkSSID.lastCall.calledWith(creds.ssid));
        test.ok(this.setNetworkPassword.lastCall.calledWith(creds.password));
        test.ok(this.setNetworkEncryption.lastCall.calledWith(creds.security));
        test.ok(this.getWifiInfo.callCount, 1);
        test.done();
      })
      .catch(function(error) {
        test.fail(error);
        test.done();
      });
  },

  connectionFails: function(test) {
    test.expect(9);
    var creds = {
      ssid: 'tank',
      password: 'not_gonna_work'
    };
    var errMessage = 'Unable to connect to the network.';

    // Test is expecting several closes...;
    this.tessel._rps.on('control', (command) => {
      if (command.toString() === 'ubus call iwinfo info {"device":"wlan0"}') {
        // Write to stderr so it completes as expected
        // Wrap in setImmediate to make sure listener is set up before emitting
        setImmediate(() => {
          this.tessel._rps.stdout.emit('data', errMessage);
        });
      } else {
        setImmediate(() => {
          // Remove any listeners on stderr so we don't break anything when we write to it
          this.tessel._rps.stdout.removeAllListeners();

          // Continue
          this.tessel._rps.emit('close');
        });
      }
    });

    this.tessel.connectToNetwork(creds)
      .then(function() {
        test.fail('Test should have rejected with an error.');
        test.done();
      })
      .catch(() => {
        test.equal(this.setNetworkSSID.callCount, 1);
        test.equal(this.setNetworkPassword.callCount, 1);
        test.equal(this.setNetworkEncryption.callCount, 1);
        test.equal(this.commitWirelessCredentials.callCount, 1);
        test.equal(this.reconnectWifi.callCount, 1);
        test.ok(this.setNetworkSSID.lastCall.calledWith(creds.ssid));
        test.ok(this.setNetworkPassword.lastCall.calledWith(creds.password));
        test.ok(this.setNetworkEncryption.lastCall.calledWith('psk2'));
        test.ok(this.getWifiInfo.callCount, 1);
        test.done();
      });
  },

  connectionTimeout: function(test) {
    test.expect(10);
    var creds = {
      ssid: 'tank',
      password: 'not_gonna_work'
    };

    // Make it timeout super fast so this test doesn't take forever
    Tessel.__wifiConnectionTimeout = 10;

    // Test is expecting several closes...;
    this.tessel._rps.on('control', (command) => {
      if (command.toString() !== 'ubus call iwinfo info {"device":"wlan0"}') {
        setImmediate(() => {
          // Remove any listeners on stderr so we don't break anything when we write to it
          this.tessel._rps.stderr.removeAllListeners();

          // Continue
          this.tessel._rps.emit('close');
        });
      }
    });

    this.tessel.connectToNetwork(creds)
      .then(function() {
        test.fail('Test should have rejected with an error.');
        test.done();
      })
      .catch((error) => {
        test.ok(error.toLowerCase().indexOf('timed out') !== -1);
        test.equal(this.setNetworkSSID.callCount, 1);
        test.equal(this.setNetworkPassword.callCount, 1);
        test.equal(this.setNetworkEncryption.callCount, 1);
        test.equal(this.commitWirelessCredentials.callCount, 1);
        test.equal(this.reconnectWifi.callCount, 1);
        test.ok(this.setNetworkSSID.lastCall.calledWith(creds.ssid));
        test.ok(this.setNetworkPassword.lastCall.calledWith(creds.password));
        test.ok(this.setNetworkEncryption.lastCall.calledWith('psk2'));
        test.ok(this.getWifiInfo.callCount, 1);
        test.done();
      });
  }
};

module.exports['Tessel.setWifiState'] = {
  setUp: function(done) {
    this.sandbox = sinon.sandbox.create();
    this.logsWarn = this.sandbox.stub(logs, 'warn', function() {});
    this.logsInfo = this.sandbox.stub(logs, 'info', function() {});
    this.tessel = TesselSimulator();
    this.simpleExec = this.sandbox.spy(this.tessel, 'simpleExec');
    this.turnOnWifi = this.sandbox.spy(commands, 'turnOnWifi');
    this.commitWirelessCredentials = this.sandbox.spy(commands, 'commitWirelessCredentials');
    this.reconnectWifi = this.sandbox.spy(commands, 'reconnectWifi');
    this.getWifiInfo = this.sandbox.spy(commands, 'getWifiInfo');

    done();
  },
  tearDown: function(done) {
    this.tessel.mockClose();
    this.sandbox.restore();
    done();
  },

  setWifiStateTruthy: function(test) {
    test.expect(7);
    var state = true;

    // Test is expecting several closes...;
    this.tessel._rps.on('control', (command) => {
      if (command.toString() === 'ubus call iwinfo info {"device":"wlan0"}') {
        // Write to stdout so it completes as expected
        // Wrap in setImmediate to make sure listener is set up before emitting
        setImmediate(() => {
          this.tessel._rps.stdout.emit('data', 'signal');
        });
      } else {
        setImmediate(() => {
          // Remove any listeners on stdout so we don't break anything when we write to it
          this.tessel._rps.stdout.removeAllListeners();

          // Continue
          this.tessel._rps.emit('close');
        });
      }
    });

    this.tessel.setWiFiState(state)
      .then(() => {
        test.equal(this.simpleExec.calledThrice, true);
        test.equal(this.turnOnWifi.callCount, 1);
        test.equal(this.commitWirelessCredentials.callCount, 1);
        test.equal(this.reconnectWifi.callCount, 1);
        test.equal(this.logsInfo.calledTwice, true);
        test.equal(this.logsInfo.lastCall.args[1].indexOf('Enabled.') !== -1, true);
        test.ok(this.getWifiInfo.callCount, 1);
        test.done();
      })
      .catch(function(err) {
        test.fail(err);
        test.done();
      });
  },
  setWifiStateFalsy: function(test) {
    test.expect(7);
    var state = false;

    // Test is expecting several closes...;
    this.tessel._rps.on('control', (command) => {
      if (command.toString() === 'ubus call iwinfo info {"device":"wlan0"}' && state) {
        // Write to stdout so it completes as expected
        // Wrap in setImmediate to make sure listener is set up before emitting
        setImmediate(() => {
          this.tessel._rps.stdout.emit('data', 'signal');
        });
      } else {
        setImmediate(() => {
          // Remove any listeners on stdout so we don't break anything when we write to it
          this.tessel._rps.stdout.removeAllListeners();

          // Continue
          this.tessel._rps.emit('close');
        });
      }
    });

    this.tessel.setWiFiState(state)
      .then(() => {
        test.equal(this.simpleExec.calledThrice, true);
        test.equal(this.turnOnWifi.callCount, 1);
        test.equal(this.commitWirelessCredentials.callCount, 1);
        test.equal(this.reconnectWifi.callCount, 1);
        test.equal(this.logsInfo.calledOnce, true);
        test.equal(this.logsInfo.lastCall.args[1].indexOf('Disabled.') !== -1, true);
        test.ok(this.getWifiInfo.callCount, 1);
        test.done();
      })
      .catch(function(err) {
        test.fail(err);
        test.done();
      });
  }

};

'use strict';
const path = require('path');

module.exports = {
  contractName: 'RevenueSplit',
  wasmPath: path.join(__dirname, '../circuit.wasm'),
  provingKeyPath: path.join(__dirname, '../proving_key'),
  verifyingKeyPath: path.join(__dirname, '../verifying_key'),
};

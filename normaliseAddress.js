const AWS = require('aws-sdk')

const normaliseAddress = function(info) {
  // If there are undefined or empty lines, move future lines up
  const lines = [];
  if (info.addressLine1) { lines.push(info.addressLine1) };
  if (info.addressLine2) { lines.push(info.addressLine2) };
  if (info.addressLine3) { lines.push(info.addressLine3) };
  if (info.addressLine4) { lines.push(info.addressLine4) };
  for (let index = 0; index < 4; index++) {
    if (!lines[index]) {
      lines[index] = '';
    }
  }
  // Update the original object with lines in correct order
  info.addressLine1 = lines[0];
  info.addressLine2 = lines[1];
  info.addressLine3 = lines[2];
  info.addressLine4 = lines[3];
  return info;
}

module.exports = normaliseAddress;
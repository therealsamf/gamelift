
const gamelift = require('bindings')('gamelift.node');

console.log('gamelift', gamelift);

const processReady = new gamelift.ProcessReady();
console.log('processReady', processReady);
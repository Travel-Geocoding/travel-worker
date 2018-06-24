const BullQueue = require('bull');
const processor = require('../job-processors/process-address-geocoding.js');

const REDIS_URL = process.env.SCALINGO_REDIS_URL;

const Queue = {
  GEOCODING: new BullQueue('GEOCODING Queue', REDIS_URL),
};

Queue.registerProcessors = function() {
  console.log('> processors registered');
  // Queue.GEOCODING.process('../job-processors/process-address-geocoding.js');

  Queue.GEOCODING.process(function(job) {
    return processor(job);
  });

};


console.log('> connected to redis at: ' + REDIS_URL);
module.exports = Queue;
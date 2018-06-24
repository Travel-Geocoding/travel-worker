const BullQueue = require('bull');
const geocodingProcessor = require('../job-processors/process-address-geocoding.js');

const REDIS_URL = process.env.SCALINGO_REDIS_URL;

const Queue = {
  GEOCODING: new BullQueue('GEOCODING Queue', REDIS_URL),
};

Queue.registerProcessors = function() {
  console.log('> processors registered');

  Queue.GEOCODING.process(function(job) {
    return geocodingProcessor(job);
  });

};


console.log('> connected to redis at: ' + REDIS_URL);
module.exports = Queue;
const BullQueue = require('bull');
const geocodingProcessor = require('../job-processors/process-address-geocoding.js');

const REDIS_URL = process.env.SCALINGO_REDIS_URL;
const queueOptions = {
  limiter: {
    max: 25,
    duration: 1000,
  },
};

const Queue = {
  GEOCODING: new BullQueue('GEOCODING Queue', REDIS_URL, queueOptions),
};

Queue.registerProcessors = function() {
  console.log('> processors registered');

  Queue.GEOCODING.process(5, function(job) {
    return geocodingProcessor(job);
  });
};


console.log('> connected to redis at: ' + REDIS_URL);
module.exports = Queue;
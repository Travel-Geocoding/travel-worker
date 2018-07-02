const BullQueue = require('bull');
const geocodingProcessor = require('../job-processors/process-address-geocoding');
const upadteProcessor = require('../job-processors/process-address-udpate');

const REDIS_URL = process.env.SCALINGO_REDIS_URL;
const queueOptions = {
  limiter: {
    max: 25,
    duration: 1000,
  },
};


// Step Job 1 - launch job to create intinaries - page by page create job for all the entries
// Step Job 2 - for each location entry in db create a job to create all itinaries for that location (page by page)
// Step Job 3 - for each location couple create the itinary entry with the distance GPS if distance > 50km launch last job
// Step Job 4 - for the location couple create the get the location distance using Gmap

const Queue = {
  GEOCODING: new BullQueue('GEOCODING Queue', REDIS_URL, queueOptions),
  UPDATE_DATA: new BullQueue('UDPATE DATA Queue', REDIS_URL),
};

Queue.registerProcessors = function() {
  console.log('> processors registered');

  Queue.GEOCODING.process(5, function(job) {
    return geocodingProcessor(job);
  });

  Queue.UPDATE_DATA.process(5, function(job) {
    return upadteProcessor(job);
  });
};


console.log('> connected to redis at: ' + REDIS_URL);
module.exports = Queue;
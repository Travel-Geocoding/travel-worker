const BullQueue = require('bull');

const geocodingProcessor = require('../job-processors/process-address-geocoding');
const upadteProcessor = require('../job-processors/process-address-udpate');
const initiatingRouteCalcluationProcessor = require('../job-processors/process-initiating-route-calculation');
const routesForPointProcessor = require('../job-processors/process-routes-for-point');
const insertRouteProcessor = require('../job-processors/process-insert-route');

const REDIS_URL = process.env.SCALINGO_REDIS_URL;
const queueOptions = {
  limiter: {
    max: 25,
    duration: 1000,
  },
};

const queueOptionsForRouteForLocation = {
  limiter: {
    max: 1,
    duration: 1000,
  },
};

const Queue = {
  GEOCODING: new BullQueue('GEOCODING Queue', REDIS_URL, queueOptions),
  UPDATE_DATA: new BullQueue('UDPATE DATA Queue', REDIS_URL),
  LAUNCH_ROUTE_CALCULATION: new BullQueue('LAUNCH ROUTE CALCULATION Queue', REDIS_URL),
  ROUTES_FOR_LOCATION: new BullQueue('ROUTES FOR LOCATION Queue', REDIS_URL, queueOptionsForRouteForLocation),
  INSERT_ROUTE: new BullQueue('INSERT ROUTE Queue', REDIS_URL),
  LAUNCH_BULK_API_JOBS: new BullQueue('LAUNCH BULK API JOBS Queue', REDIS_URL),
};

Queue.registerProcessors = function() {
  console.log('> processors registered');

  Queue.GEOCODING.process(5, function(job) {
    return geocodingProcessor(job);
  });

  Queue.UPDATE_DATA.process(5, function(job) {
    return upadteProcessor(job);
  });

  Queue.LAUNCH_ROUTE_CALCULATION.process(function(job) {
    return initiatingRouteCalcluationProcessor(job);
  });

  Queue.ROUTES_FOR_LOCATION.process(function(job) {
    return routesForPointProcessor(job);
  });

  Queue.INSERT_ROUTE.process(10, function(job) {
    return insertRouteProcessor(job);
  });
  // delete jobs completed 1 sec ago
  Queue.INSERT_ROUTE.clean(1000);
};


console.log('> connected to redis at: ' + REDIS_URL);
module.exports = Queue;
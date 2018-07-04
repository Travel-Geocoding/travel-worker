Queue = require('./queue');

class Job {

  constructor({
    queue,
    data,
  } = {}) {
    this.queue = queue;
    this.data = data;
  }

  static createRoutesForLocation({ location }) {
    return new Job({
      queue: Queue.ROUTES_FOR_LOCATION,
      data: { location },
    });
  }

  static insertRoute({ route }) {
    return new Job({
      queue: Queue.INSERT_ROUTE,
      data: { route },
    });
  }
}

module.exports = Job;

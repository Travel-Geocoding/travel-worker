const server = require('../server/server-instance');
const Route = require('../models/route');

module.exports = function(job) {

  return Promise.resolve(job)
    .then((job) => {
      server.logger().info(`Start route detail job for route: ${job.data.routeId}`);
      console.log('job.data ', job.data);
      return job.data;
    })
    .then(() => {
      server.logger().info(`Completed route detail job for route: ${job.data.routeId}`);
    })
    .catch((error) => {
      server.logger().error(`Failed route detail job for route: ${job.data.routeId}, because: ${error}`);
      throw error;
    });
};

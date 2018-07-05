const server = require('../server/server-instance');
const Error = require('../models/error');
const Route = require('../models/route');
const RouteRepository = require('../repositories/route-repository');

module.exports = function(job) {

  return Promise.resolve(job)
    .then((job) => {
      server.logger().info(`Start route ${job.data.route.id} insertion job`);
      return new Route(job.data.route);
    })
    .then((route) => {
      return getSameOrReversedRoute({ route })
        .then((receivedRoute) => {
          if (route.state === Route.State.DONE) {
            return;
          }
          if (route.state === Route.State.NEED_GOOGLE) {
            receivedRoute.state = route.state;
            return RouteRepository.update(receivedRoute);
          }
        })
        .catch((error) => {
          if (error instanceof Error.NotFoundError) {
            return RouteRepository.create(route);
          } else {
            throw error;
          }
        });
    })
    .then(() => {
      server.logger().info(`Completed route ${job.data.route.id} insertion job`);
    })
    .catch((error) => {
      server.logger().error(`Failed route ${job.data.route.id} insertion job because: ${error}`);
      throw error;
    });
};

function getSameOrReversedRoute({ route }) {
  return RouteRepository.get(route.id)
    .catch((error) => {
      if (error instanceof Error.NotFoundError) {

        const reversedRouteId = route.reversedRouteId;
        return RouteRepository.get(reversedRouteId);
      } else {
        throw error;
      }
    });
}
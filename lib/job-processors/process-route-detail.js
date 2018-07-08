const server = require('../server/server-instance');
const Route = require('../models/route');
const RouteRepository = require('../repositories/route-repository');
const googleClient = require('../google-client');

module.exports = function(job) {

  return Promise.resolve(job)
    .then((job) => {
      server.logger().info(`Start route detail job for route: ${job.data.route.id}`);
      return { route: job.data.route, apiKey: job.data.apiKey };
    })
    .then(({ route, apiKey }) => {
      return googleClient
        .destination({
          apiKey,
          origin: `${route.startLatitude},${route.startLongitude}`,
          destination: `${route.destinationLatitude},${route.destinationLongitude}`,
        })
        .then(extractRouteDataFromJSON)
        .then((routeDetailData) => {
          route.state = Route.State.DONE;
          route.googleStatus = routeDetailData.googleStatus;
          route.travelMode = routeDetailData.travelMode;
          route.travelDistance = routeDetailData.travelDistance;
          route.travelDuration = routeDetailData.travelDuration;
          route.travelDurationText = routeDetailData.travelDurationText;
          route.travelInTrafficDistance = routeDetailData.travelInTrafficDistance;
          route.travelInTrafficDuration = routeDetailData.travelInTrafficDuration;
          route.travelInTrafficDurationText = routeDetailData.travelInTrafficDurationText;

          return route;
        })
        .then(RouteRepository.update);
    })
    .then(() => {
      server.logger().info(`Completed route detail job for route: ${job.data.route.id}`);
    })
    .catch((error) => {
      server.logger().error(`Failed route detail job for route: ${job.data.route.id}, because: ${error}`);

      const route = job.data.route;
      route.state = Route.State.DONE;
      route.googleStatus = `ERROR - ${error.toString()}`;

      return RouteRepository
        .update(route)
        .catch((dbError) => {
          server.logger().error(`Failed Update Job for store n°${id} because: ${dbError} -- COULD NOT SAVE IN DB`);
        })
        .then(() => {
          // to mark the job as failed
          throw error;
        });

      throw error;
    });
};

function extractRouteDataFromJSON(googleMapJSON) {
  const status = googleMapJSON['status'];

  if (status === 'OK') {
    const travelDistance = googleMapJSON['routes'][0]['legs'][0]['distance']['value'];
    const travelDuration = googleMapJSON['routes'][0]['legs'][0]['duration']['value'];
    const travelDurationText = googleMapJSON['routes'][0]['legs'][0]['duration']['text'];
    const travelInTrafficDistance = googleMapJSON['routes'][0]['legs'][0]['distance']['value'];
    const travelInTrafficDuration = googleMapJSON['routes'][0]['legs'][0]['duration_in_traffic']['value'];
    const travelInTrafficDurationText = googleMapJSON['routes'][0]['legs'][0]['duration_in_traffic']['text'];

    return {
      googleStatus: status,
      travelMode: 'driving',
      travelDistance,
      travelDuration,
      travelDurationText,
      travelInTrafficDistance,
      travelInTrafficDuration,
      travelInTrafficDurationText,
    };

  } else {

    return {
      googleStatus: `ERROR - ${status}`,
    };
  }
}

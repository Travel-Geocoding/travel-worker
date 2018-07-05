const server = require('../server/server-instance');
const Route = require('../models/route');
const Job = require('../job-manager/job');
const JobLauncher = require('../job-manager/job-launcher');
const LocationRepository = require('../repositories/location-repository');

const maxSizeOfClosestLocationArray = process.env.NUMBER_OF_CLOSEST_STORES_FOR_ROUTING;

module.exports = function(job) {

  let totalPageCount = 1;
  let closestLocationRoutes = [];

  let startLocation;

  return Promise.resolve(job)
    .then((job) => {
      server.logger().info(`Start route calculation job for location: ${job.data.location.id}`);
      startLocation = job.data.location;
    })
    .then(() => LocationRepository.listWithPagination({ pageNumber: 1 }))
    .then((firstLocationResult) => {

      totalPageCount = firstLocationResult.page.totalPageCount;

      firstLocationResult.locations
        .filter((location) => startLocation.id !== location.id)
        .forEach((location) => {

          const sortedLocationsResult = calculationOfSortedLocations({
            startLocation,
            newLocation: location,
            existingClosestRouteArray: closestLocationRoutes,
          });

          closestLocationRoutes = sortedLocationsResult.closestLocationRoutes;
          const farthestLocationRoutes = sortedLocationsResult.farthestLocationRoutes;

          farthestLocationRoutes.forEach((route) => {
            const job = Job.insertRoute({ route });
            JobLauncher.launch({ job });
          });

        });
    })
    .then(() => {

      const initialPromise = Promise.resolve();

      return Array.from({ length: totalPageCount - 1 }, (v, i) => i + 2)
        .reduce((sequentialPromises, pageNumber) => {

          return sequentialPromises
            .then(() => LocationRepository.listWithPagination({ pageNumber }))
            .then((locationPageResult) => {

              locationPageResult.locations
                .filter((location) => startLocation.id !== location.id)
                .forEach((location) => {

                  const sortedLocationsResult = calculationOfSortedLocations({
                    startLocation,
                    newLocation: location,
                    existingClosestRouteArray: closestLocationRoutes,
                  });

                  closestLocationRoutes = sortedLocationsResult.closestLocationRoutes;
                  const farthestLocationRoutes = sortedLocationsResult.farthestLocationRoutes;

                  farthestLocationRoutes.forEach((route) => {

                    const job = Job.insertRoute({ route });
                    JobLauncher.launch({ job });
                  });
                });
            });

        }, initialPromise);

    })
    .then(() => {
      closestLocationRoutes.forEach((route) => {
        route.state = Route.State.NEED_GOOGLE;

        const job = Job.insertRoute({ route });
        JobLauncher.launch({ job });
      });
    })
    .then(() => {
      server.logger().info(`Completed route calculation job for location: ${job.data.location.id}`);
    })
    .catch((error) => {
      server.logger().error(`Failed route calculation job for location: ${job.data.location.id}, because: ${error}`);
      throw error;
    });
};

function calculationOfSortedLocations({ startLocation, newLocation, existingClosestRouteArray }) {

  const R = 6378137; // metres
  const φ1 = startLocation.latitude * Math.PI / 180;
  const φ2 = newLocation.latitude * Math.PI / 180;
  const Δφ = (newLocation.latitude - startLocation.latitude) * Math.PI / 180;
  const Δλ = (newLocation.longitude - startLocation.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const straitDistance = Math.round(R * c);

  const newRoute = Route.createFromLocations({
    start: startLocation,
    destination: newLocation,
    state: Route.State.DONE,
    straitDistance,
  });

  existingClosestRouteArray
    .push(newRoute);

  existingClosestRouteArray
    .sort((routeA, routeB) => routeA.straitDistance > routeB.straitDistance);

  const farthestLocationRoutes = existingClosestRouteArray.splice(maxSizeOfClosestLocationArray);

  return {
    closestLocationRoutes: existingClosestRouteArray,
    farthestLocationRoutes,
  };
}
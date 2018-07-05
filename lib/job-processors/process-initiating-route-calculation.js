const server = require('../server/server-instance');
const Job = require('../job-manager/job');
const JobLauncher = require('../job-manager/job-launcher');
const LocationRepository = require('../repositories/location-repository');

module.exports = function() {

  let totalPageCount = 1;

  return Promise.resolve()
    .then(() => {
      server.logger().info(`Start initiation of route calculation job`);
    })
    .then(() => LocationRepository.listWithPagination({ pageNumber: 1 }))
    .then((firstLocationResult) => {

      totalPageCount = firstLocationResult.page.totalPageCount;

      firstLocationResult.locations.forEach((location) => {
        const job = Job.createRoutesForLocation({ location });
        JobLauncher.launch({ job });
      });
    })
    .then(() => {

      const initialPromise = Promise.resolve();

      return Array.from({ length: totalPageCount - 1 }, (v, i) => i + 2)
        .reduce((sequentialPromises, pageNumber) => {

          return sequentialPromises
            .then(() => LocationRepository.listWithPagination({ pageNumber }))
            .then((locationPageResult) => {

              locationPageResult.locations.forEach((location) => {
                const job = Job.createRoutesForLocation({ location });
                JobLauncher.launch({ job });
              });
            });

        }, initialPromise);

    })
    .then(() => {
      server.logger().info(`Completed initiation of route calculation job`);
    })
    .catch((error) => {
      server.logger().error(`Failed initiation of route calculation job because: ${error}`);
      throw error;
    });
};

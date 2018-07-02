const server = require('../server/server-instance');
const LocationRepository = require('../repositories/location-repository');

module.exports = function(job) {

  const id = job.data.address.id;

  return Promise.resolve(job)
    .then((job) => {
      server.logger().info(`Start Update job for store n°${id}`);
      return job.data.address;
    })
    .then((data) => {

      const locationUpdateData = {
        id: data.id,
        name: data.name,
        address: data.address,
        postalCode: data.postalCode,
        municipality: data.municipality,
        matchType: data.matchType,
        matchedAddress: data.matchedAddress,
        latitude: data.latitude,
        longitude: data.longitude,
      };

      return locationUpdateData;
    })
    .then(LocationRepository.update)
    .then(() => {
      server.logger().info(`Completed Update Job for store n°${id}`);
    })
    .catch((error) => {
      server.logger().error(`Failed Update Job for store n°${id} because: ${error}`);

      return LocationRepository
        .update({
          id,
          matchType: `ERROR - ${error.toString()}`,
        })
        .catch((dbError) => {
          server.logger().error(`Failed Update Job for store n°${id} because: ${dbError} -- COULD NOT SAVE IN DB`);
        })
        .then(() => {
          // to mark the job as failed
          throw error;
        });
    });
};

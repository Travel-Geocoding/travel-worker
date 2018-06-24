const server = require('../server/server-instance');
const Location = require('../models/location');
const LocationRepository = require('../repositories/location-repository');

module.exports = function(job) {

  const id = job.data.address.id;

  Promise.resolve(job)
    .then((job) => {
      server.logger().info(`Start Geocoding job for store n°${id}`);
      return job.data.address;
    })
    .then((data) => {

      const location = new Location({
        id: data.id,
        name: data.name,
        address: data.address,
        postalCode: data.postalCode,
        municipality: data.municipality,
      });

      return location;
    })
    .then((location) => LocationRepository.create(location))
    .then(() => {
      server.logger().info(`Geocoded and saved store n°${id}`);
    })
    .catch((error) => {
      server.logger().error(`Failed store n°${id} because: ${error}`);
    });
};
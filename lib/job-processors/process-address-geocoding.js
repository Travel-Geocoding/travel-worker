const server = require('../server/server-instance');
const Location = require('../models/location');
const LocationRepository = require('../repositories/location-repository');
const GoogleMapClient = require('../google-client');

/*
 * En premier lieu si l’adresse commence par un chiffre
 * —> recherche concaténation : adresse, code postal, commune
 * Si l’adresse ne commence pas par un chiffre :
 * —> recherche concaténation : nom du magasin, adresse, code postal, commune
 */
module.exports = function(job) {

  const id = job.data.address.id;

  return Promise.resolve(job)
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
    .then(LocationRepository.create)
    .then(extractAddressFromLocation)
    .then((address) => GoogleMapClient.geocode({ address }))
    .then(extractLocationDataFromGeocodingJSON(id))
    .then(LocationRepository.update)
    .then(() => {
      server.logger().info(`Completed Geocoding Job for store n°${id}`);
    })
    .catch((error) => {
      server.logger().error(`Failed Geocoded Job store n°${id} because: ${error}`);

      return LocationRepository
        .update({
          id,
          matchType: `ERROR - ${error.toString()}`,
        })
        .catch((error) => {
          server.logger().error(`Failed Geocoded Job for store n°${id} because: ${error} -- COULD NOT SAVE IN DB`);
        })
        .then(() => {
          // to mark the job as failed
          throw error;
        });
    });
};

function extractAddressFromLocation(location) {
  if (location.address.match(/^\d/)) {
    return `${location.address}, ${location.postalCode}, ${location.municipality}`;
  } else {
    return `${location.name}, ${location.address}, ${location.postalCode}, ${location.municipality}`;
  }
}

function extractLocationDataFromGeocodingJSON(id) {

  return (geocodingJSON) => {
    const status = geocodingJSON['status'];

    if (status === 'OK') {
      const matchType = geocodingJSON['results'][0]['geometry']['location_type'];
      const matchedAddress = geocodingJSON['results'][0]['formatted_address'];
      const latitude = `${geocodingJSON['results'][0]['geometry']['location']['lat']}`;
      const longitude = `${geocodingJSON['results'][0]['geometry']['location']['lng']}`;

      return {
        id,
        latitude,
        longitude,
        matchType,
        matchedAddress,
      };

    } else {

      return {
        id,
        matchType: `ERROR - ${status}`,
      };
    }
  };
}
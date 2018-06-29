const googleMapsClient = require('@google/maps').createClient({
  key: process.env.GOOGLE_API_KEY,
  Promise: Promise,
});

module.exports = {
  geocode({ address }) {
    return googleMapsClient.geocode({ address })
      .asPromise()
      .then((response) => response.json);
  },
};
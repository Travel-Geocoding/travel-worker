const GoogleMaps = require('@google/maps');

const googleMapsClient = GoogleMaps.createClient({
  key: process.env.GOOGLE_API_KEY,
  Promise: Promise,
});

module.exports = {
  geocode({ address }) {
    return googleMapsClient.geocode({ address })
      .asPromise()
      .then((response) => response.json);
  },

  destination({
    apiKey,
    origin, // =41.43206,-81.38992
    destination, // =41.43206,-81.38992
  }) {
    return GoogleMaps
      .createClient({
        key: apiKey,
        Promise: Promise,
      })
      .directions({
        origin,
        destination,
        // mardi 16 octobre 2018 13:00 GMT (15h en France) => epoch timestamp: 1539694800
        departure_time: '1539694800',
        mode: 'driving',
        traffic_model: 'best_guess',
        language: 'en',
        units: 'metric',
      })
      .asPromise()
      .then((response) => response.json);
  },
};
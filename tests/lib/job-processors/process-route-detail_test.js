const { expect, sinon } = require('../../test-helper');

const Route = require('../../../lib/models/route');
const RouteRepository = require('../../../lib/repositories/route-repository');
const GoogleMapClient = require('../../../lib/google-client');
const processRouteDetail = require('../../../lib/job-processors/process-route-detail');

describe('Unit | Job Processors | Process Route Detail', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(RouteRepository, 'update').resolves();
    sandbox.stub(GoogleMapClient, 'destination').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('when the address starts with an integer', () => {

    let promise;

    // given
    const apiKey = 'ThisIsAnApiKey';
    const route = new Route({
      id: 'C01-C02',
      state: Route.State.PROCESSING,
      startId: 'C01',
      startLatitude: '45.7430422',
      startLongitude: '4.5000000',
      destinationId: 'C02',
      destinationLatitude: '45.7430422',
      destinationLongitude: '5.1000000',
      straitDistance: 23456,

    });

    const job = {
      data: {
        apiKey,
        route: Object.assign({}, route),
      },
    };
    const googleMapResult = {
      'geocoded_waypoints': [
        // deleted for clarity
      ],
      'routes': [
        {
          'bounds': {
            // deleted for clarity
          },
          'copyrights': 'Map data ©2018 GeoBasis-DE/BKG (©2009), Google',
          'legs': [
            {
              'distance': {
                'text': '752 km',
                'value': 752455,
              },
              'duration': {
                'text': '6 hours 55 mins',
                'value': 24891,
              },
              'duration_in_traffic': {
                'text': '6 hours 56 mins',
                'value': 24987,
              },
              'end_address': '48 Rue de la Résistance, 42000 Saint-Étienne, France',
              'end_location': {
                'lat': 45.435847,
                'lng': 4.3870642,
              },
              'start_address': '6 Place Louise de Bettignies, 59800 Lille, France',
              'start_location': {
                'lat': 50.6406024,
                'lng': 3.0645764,
              },
              'steps': [
                // deleted for clarity
              ],
              'traffic_speed_entry': [],
              'via_waypoint': [],
            },
          ],
          'overview_polyline': {
            // deleted for clarity
          },
          'summary': 'A26',
          'warnings': [],
          'waypoint_order': [],
        },
      ],
      'status': 'OK',
    };

    // when
    beforeEach(() => {
      GoogleMapClient.destination.resolves(googleMapResult);
      RouteRepository.update.resolves();

      promise = processRouteDetail(job);
    });

    // then
    it('should succeded', () => {
      return expect(promise).to.have.fulfilled;
    });
    it('should call to googleClient to make geocoding request', () => {
      return promise
        .then(() => expect(GoogleMapClient.destination).to.have.been.calledWith({
          apiKey,
          origin: '45.7430422,4.5000000',
          destination: '45.7430422,5.1000000',
        }));
    });
    it('should call to update the route with details in database', () => {
      const expectedUpdateRoute = new Route({
        id: 'C01-C02',
        state: Route.State.DONE,
        startId: 'C01',
        startLatitude: '45.7430422',
        startLongitude: '4.5000000',
        destinationId: 'C02',
        destinationLatitude: '45.7430422',
        destinationLongitude: '5.1000000',
        straitDistance: 23456,
        googleStatus: 'OK',
        travelMode: 'driving',
        travelDistance: 752455,
        travelDuration: 24891,
        travelDurationText: '6 hours 55 mins',
        travelInTrafficDistance: 752455,
        travelInTrafficDuration: 24987,
        travelInTrafficDurationText: '6 hours 56 mins',
      });

      return promise
        .then(() => expect(RouteRepository.update).to.have.been.calledWith(expectedUpdateRoute));
    });
  });

  context('when the GoogleClient returns an error', () => {

    let promise;

    // given
    const apiKey = 'ThisIsAnApiKey';
    const route = new Route({
      id: 'C01-C02',
      state: Route.State.PROCESSING,
      startId: 'C01',
      startLatitude: '45.7430422',
      startLongitude: '4.5000000',
      destinationId: 'C02',
      destinationLatitude: '45.7430422',
      destinationLongitude: '5.1000000',
      straitDistance: 23456,
    });

    const job = {
      data: {
        apiKey,
        route: Object.assign({}, route),
      },
    };
    const googleMapResult = {
      'error_message': 'You have exceeded your daily request quota for this API. [...]',
      'results': [],
      'status': 'OVER_QUERY_LIMIT',
    };

    // when
    beforeEach(() => {
      GoogleMapClient.destination.resolves(googleMapResult);
      RouteRepository.update.resolves();

      promise = processRouteDetail(job);
    });

    // then
    it('should succeded', () => {
      return expect(promise).to.have.fulfilled;
    });
    it('should call to googleClient to make geocoding request', () => {
      return promise
        .then(() => expect(GoogleMapClient.destination).to.have.been.calledWith({
          apiKey,
          origin: '45.7430422,4.5000000',
          destination: '45.7430422,5.1000000',
        }));
    });
    it('should call to update the route with status update in database', () => {
      const expectedUpdateRoute = new Route({
        id: 'C01-C02',
        state: Route.State.DONE,
        startId: 'C01',
        startLatitude: '45.7430422',
        startLongitude: '4.5000000',
        destinationId: 'C02',
        destinationLatitude: '45.7430422',
        destinationLongitude: '5.1000000',
        straitDistance: 23456,
        googleStatus: 'ERROR - OVER_QUERY_LIMIT',
      });

      return promise
        .then(() => expect(RouteRepository.update).to.have.been.calledWith(expectedUpdateRoute));
    });
  });

  context('when the GoogleClient fails', () => {

    let promise;

    // given
    const apiKey = 'ThisIsAnApiKey';
    const route = new Route({
      id: 'C01-C02',
      state: Route.State.PROCESSING,
      startId: 'C01',
      startLatitude: '45.7430422',
      startLongitude: '4.5000000',
      destinationId: 'C02',
      destinationLatitude: '45.7430422',
      destinationLongitude: '5.1000000',
      straitDistance: 23456,
    });

    const job = {
      data: {
        apiKey,
        route: Object.assign({}, route),
      },
    };
    const googleMapClientError = new Error('this is an error message');

    // when
    beforeEach(() => {
      GoogleMapClient.destination.rejects(googleMapClientError);
      RouteRepository.update.resolves();

      promise = processRouteDetail(job);
    });

    // then
    it('should fail', () => {
      return expect(promise).to.have.been.rejected;
    });
    it('should call to googleClient to make geocoding request', () => {
      return promise
        .catch(() => expect(GoogleMapClient.destination).to.have.been.calledWith({
          apiKey,
          origin: '45.7430422,4.5000000',
          destination: '45.7430422,5.1000000',
        }));
    });
    it('should call to update the route with status update in database', () => {
      const expectedUpdateRoute = new Route({
        id: 'C01-C02',
        state: Route.State.DONE,
        startId: 'C01',
        startLatitude: '45.7430422',
        startLongitude: '4.5000000',
        destinationId: 'C02',
        destinationLatitude: '45.7430422',
        destinationLongitude: '5.1000000',
        straitDistance: 23456,
        googleStatus: 'ERROR - Error: this is an error message',
      });

      return promise
        .catch(() => expect(RouteRepository.update).to.have.been.calledWith(expectedUpdateRoute));
    });
  });
});

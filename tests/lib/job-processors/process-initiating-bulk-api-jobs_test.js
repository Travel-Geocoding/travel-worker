process.env.NUMBER_OF_CALLS_BY_API_KEY = 3;

const { expect, sinon } = require('../../test-helper');

const Job = require('../../../lib/job-manager/job');
const Page = require('../../../lib/models/page');
const RoutePaginationResult = require('../../../lib/models/route-pagination-result');
const Route = require('../../../lib/models/route');
const Location = require('../../../lib/models/location');
const RouteRepository = require('../../../lib/repositories/route-repository');
const JobLauncher = require('../../../lib/job-manager/job-launcher');

const processInitiatingBulkApiJobs = require('../../../lib/job-processors/process-initiating-bulk-api-jobs');

describe('Unit | Job Processors | Initiating Route Calculation', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(RouteRepository, 'listWithPaginationForProcessNeeding');
    sandbox.stub(RouteRepository, 'update');
    sandbox.stub(JobLauncher, 'launch');
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('working stuff', () => {

    let promise;

    const apiKey = 'SecretKey';

    const location1 = new Location({
      id: 'C01',
      name: 'CASINO SHOP',
      address: '10 PLACE GEOFFROY GUICHARD',
      postalCode: '42110',
      municipality: 'FEURS',
      matchType: 'RANGE_INTERPOLATED',
      matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
      latitude: '45.7430422',
      longitude: '4.5',
    });
    const location2 = new Location({
      id: 'C02',
      name: 'CASINO SHOP',
      address: '10 PLACE GEOFFROY GUICHARD',
      postalCode: '42110',
      municipality: 'FEURS',
      matchType: 'RANGE_INTERPOLATED',
      matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
      latitude: '45.7430422',
      longitude: '5',
    });
    const location3 = new Location({
      id: 'C03',
      name: 'CASINO SHOP',
      address: '10 PLACE GEOFFROY GUICHARD',
      postalCode: '42110',
      municipality: 'FEURS',
      matchType: 'RANGE_INTERPOLATED',
      matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
      latitude: '45.7430422',
      longitude: '6',
    });
    const location4 = new Location({
      id: 'C04',
      name: 'CASINO SHOP',
      address: '10 PLACE GEOFFROY GUICHARD',
      postalCode: '42110',
      municipality: 'FEURS',
      matchType: 'RANGE_INTERPOLATED',
      matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
      latitude: '45.7430422',
      longitude: '7',
    });

    const routeBetween2and4 = Route.createFromLocations({
      start: location2, destination: location4, state: Route.State.NEED_GOOGLE, straitDistance: 155371,
    });
    const routeBetween2and1 = Route.createFromLocations({
      start: location2, destination: location1, state: Route.State.NEED_GOOGLE, straitDistance: 38844,
    });
    const routeBetween2and3 = Route.createFromLocations({
      start: location2, destination: location3, state: Route.State.NEED_GOOGLE, straitDistance: 77687,
    });
    const routeBetween3and4 = Route.createFromLocations({
      start: location3, destination: location4, state: Route.State.NEED_GOOGLE, straitDistance: 77687,
    });

    const firstPaginationResult = new RoutePaginationResult({
      routes: [routeBetween2and4, routeBetween2and1],
      page: new Page({
        currentPageNumber: 1,
        pageSize: 2,
        totalPageCount: 2,
        totalRowCount: 4,
      }),
    });

    const secondPaginationResult = new RoutePaginationResult({
      routes: [routeBetween2and3, routeBetween3and4],
      page: new Page({
        currentPageNumber: 2,
        pageSize: 2,
        totalPageCount: 2,
        totalRowCount: 4,
      }),
    });

    beforeEach(() => {
      RouteRepository.listWithPaginationForProcessNeeding.onFirstCall().resolves(firstPaginationResult);
      RouteRepository.listWithPaginationForProcessNeeding.onSecondCall().resolves(secondPaginationResult);
      RouteRepository.update.resolves();

      promise = processInitiatingBulkApiJobs({ data: { apiKey } });
    });

    // then
    it('should succed', () => {
      return expect(promise).to.have.fulfilled;
    });
    it('should get the routes needing api detail travel information', () => {
      promise.then(() => {
        return expect(RouteRepository.listWithPaginationForProcessNeeding).to.have.been.called;
      });
    });
    it('should update state of each of those route to processing', () => {
      const routeBetween2and4Processing = new Route(routeBetween2and4);
      routeBetween2and4Processing.state = Route.State.PROCESSING;
      const routeBetween2and1Processing = new Route(routeBetween2and1);
      routeBetween2and1Processing.state = Route.State.PROCESSING;
      const routeBetween2and3Processing = new Route(routeBetween2and3);
      routeBetween2and3Processing.state = Route.State.PROCESSING;

      const expectedRoutes = [
        [routeBetween2and4Processing],
        [routeBetween2and1Processing],
        [routeBetween2and3Processing],
      ];

      promise.then(() => {
        return expect(RouteRepository.update.args).to.deep.equal(expectedRoutes);
      })
    });
    it('should launch for each of those route a detail route job', () => {
      const expectedJobs = [
        [{ job: Job.geocodeRouteDetail({ routeId: routeBetween2and4.id, apiKey }) }],
        [{ job: Job.geocodeRouteDetail({ routeId: routeBetween2and1.id, apiKey }) }],
        [{ job: Job.geocodeRouteDetail({ routeId: routeBetween2and3.id, apiKey }) }],
      ];

      return promise
        .then(() => expect(JobLauncher.launch.args).to.deep.equal(expectedJobs));
    });
  });
});

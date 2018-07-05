process.env.NUMBER_OF_CLOSEST_STORES_FOR_ROUTING = 2;

const { expect, sinon } = require('../../test-helper');
const processRouteForPoint = require('../../../lib/job-processors/process-routes-for-point');

const Page = require('../../../lib/models/page');
const LocationPaginationResult = require('../../../lib/models/location-pagination-result');
const Location = require('../../../lib/models/location');
const Route = require('../../../lib/models/route');

const JobLauncher = require('../../../lib/job-manager/job-launcher');
const LocationRepository = require('../../../lib/repositories/location-repository');
const Job = require('../../../lib/job-manager/job');

describe('Unit | Job Processors | Routes for point', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(LocationRepository, 'listWithPagination');
    sandbox.stub(JobLauncher, 'launch');
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('for two pages of locations', () => {

    let promise;

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

    const firstPaginationResult = new LocationPaginationResult({
      locations: [location1, location2],
      page: new Page({
        currentPageNumber: 1,
        pageSize: 2,
        totalPageCount: 2,
        totalRowCount: 4,
      }),
    });

    const secondPaginationResult = new LocationPaginationResult({
      locations: [location3, location4],
      page: new Page({
        currentPageNumber: 2,
        pageSize: 2,
        totalPageCount: 2,
        totalRowCount: 4,
      }),
    });

    const routeBetween2and4 = Route.createFromLocations({
      start: location2, destination: location4, state: Route.State.DONE, straitDistance: 155371,
    });
    const routeBetween2and1 = Route.createFromLocations({
      start: location2, destination: location1, state: Route.State.NEED_GOOGLE, straitDistance: 38844,
    });
    const routeBetween2and3 = Route.createFromLocations({
      start: location2, destination: location3, state: Route.State.NEED_GOOGLE, straitDistance: 77687,
    });

    beforeEach(() => {
      LocationRepository.listWithPagination.onFirstCall().resolves(firstPaginationResult);
      LocationRepository.listWithPagination.onSecondCall().resolves(secondPaginationResult);

      promise = processRouteForPoint({
        data: {
          location: location2,
        },
      });
    });

    // then
    it('should succeded', () => {
      return expect(promise).to.have.fulfilled;
    });
    it('should create 3 jobs with the first two needing google', () => {
      const expectedJobs = [
        [{ job: Job.insertRoute({ route: routeBetween2and4 }) }],
        [{ job: Job.insertRoute({ route: routeBetween2and1 }) }],
        [{ job: Job.insertRoute({ route: routeBetween2and3 }) }],
      ];

      return promise
        .then(() => expect(JobLauncher.launch.args).to.deep.equal(expectedJobs));
    });
  });
});

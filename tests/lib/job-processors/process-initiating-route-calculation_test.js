const { expect, sinon } = require('../../test-helper');
const processInitiatingRouteCalculation = require('../../../lib/job-processors/process-initiating-route-calculation');

const Page = require('../../../lib/models/page');
const LocationPaginationResult = require('../../../lib/models/location-pagination-result');
const Location = require('../../../lib/models/location');
const JobLauncher = require('../../../lib/job-manager/job-launcher');
const LocationRepository = require('../../../lib/repositories/location-repository');
const Job = require('../../../lib/job-manager/job');

describe('Unit | Job Processors | Initiating Route Calculation', () => {

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

    const firstPaginationResult = new LocationPaginationResult({
      locations: [
        new Location({
          id: 'C01',
          name: 'CASINO SHOP',
          address: '10 PLACE GEOFFROY GUICHARD',
          postalCode: '42110',
          municipality: 'FEURS',
          matchType: 'RANGE_INTERPOLATED',
          matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
          latitude: '45.7430422',
          longitude: '4.224061799999999',
        }),
        new Location({
          id: 'C02',
          name: 'CASINO SHOP',
          address: '10 PLACE GEOFFROY GUICHARD',
          postalCode: '42110',
          municipality: 'FEURS',
          matchType: 'RANGE_INTERPOLATED',
          matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
          latitude: '45.7430422',
          longitude: '4.224061799999999',
        }),
      ],
      page: new Page({
        currentPageNumber: 1,
        pageSize: 2,
        totalPageCount: 2,
        totalRowCount: 3,
      }),
    });

    const secondPaginationResult = new LocationPaginationResult({
      locations: [
        new Location({
          id: 'C03',
          name: 'CASINO SHOP',
          address: '10 PLACE GEOFFROY GUICHARD',
          postalCode: '42110',
          municipality: 'FEURS',
          matchType: 'RANGE_INTERPOLATED',
          matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
          latitude: '45.7430422',
          longitude: '4.224061799999999',
        }),
      ],
      page: new Page({
        currentPageNumber: 2,
        pageSize: 2,
        totalPageCount: 2,
        totalRowCount: 3,
      }),
    });

    beforeEach(() => {
      LocationRepository.listWithPagination.onFirstCall().resolves(firstPaginationResult);
      LocationRepository.listWithPagination.onSecondCall().resolves(secondPaginationResult);

      promise = processInitiatingRouteCalculation();
    });

    // then
    it('should call to update the Location in database', () => {
      const expectedJobs = [
        [{ job: Job.createRoutesForLocation({ location: firstPaginationResult.locations[0] }) }],
        [{ job: Job.createRoutesForLocation({ location: firstPaginationResult.locations[1] }) }],
        [{ job: Job.createRoutesForLocation({ location: secondPaginationResult.locations[0] }) }],
      ];

      return promise
        .then(() => expect(JobLauncher.launch.args).to.deep.equal(expectedJobs));
    });
  });
});

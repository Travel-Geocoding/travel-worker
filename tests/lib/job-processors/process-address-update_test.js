const { expect, sinon } = require('../../test-helper');

const LocationRepository = require('../../../lib/repositories/location-repository');
const processAddressUpdate = require('../../../lib/job-processors/process-address-udpate');

describe('Unit | Job Processors | Process Address Update', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(LocationRepository, 'update').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('when the address updates properly', () => {

    let promise;

    // given
    const job = {
      data: {
        address: {
          id: 'C0470',
          name: 'CASINO SHOP',
          address: '10 PLACE GEOFFROY GUICHARD',
          postalCode: '42110',
          municipality: 'FEURS',
          matchType: "RANGE_INTERPOLATED",
          matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
          latitude: '45.7430422',
          longitude: '4.224061799999999',
        },
      },
    };

    const expectedUpdateObject = {
      id: 'C0470',
      name: 'CASINO SHOP',
      address: '10 PLACE GEOFFROY GUICHARD',
      postalCode: '42110',
      municipality: 'FEURS',
      matchType: "RANGE_INTERPOLATED",
      matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
      latitude: '45.7430422',
      longitude: '4.224061799999999',
    };

    // when
    beforeEach(() => {
      LocationRepository.update.resolves(expectedUpdateObject);

      promise = processAddressUpdate(job);
    });

    // then
    it('should call to update the Location in database', () => {
      return promise
        .then(() => expect(LocationRepository.update).to.have.been.calledWith(expectedUpdateObject));
    });
  });
});

const { expect, sinon } = require('../../test-helper');

const Location = require('../../../lib/models/location');
const LocationRepository = require('../../../lib/repositories/location-repository');
const processAddressGeocoding = require('../../../lib/job-processors/process-address-geocoding');

describe('Unit | Job Processors | Process Address Geocoding', () => {


  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(LocationRepository, 'create').resolves();
    // sandbox.stub(server, 'logger').return({ info: () => undefined });
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('when the address starts with an integer', () => {

    const job = {
      data: {
        address: {
          id: 'C0470',
          name: 'CASINO SHOP',
          address: '10 PLACE GEOFFROY GUICHARD',
          postalCode: '42110',
          municipality: 'FEURS',
        },
      },
    };

    it('should call to create the Location in database', () => {
      // given
      const expectedLocationObject = new Location({
        id: 'C0470',
        name: 'CASINO SHOP',
        address: '10 PLACE GEOFFROY GUICHARD',
        postalCode: '42110',
        municipality: 'FEURS',
      });

      // when
      const promise = processAddressGeocoding(job);

      // then
      return promise
        .then(() => expect(LocationRepository.create).to.have.been.calledWith(expectedLocationObject));
    });
  });
});

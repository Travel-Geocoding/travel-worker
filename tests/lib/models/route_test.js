const { expect } = require('../../test-helper');

const Location = require('../../../lib/models/location');
const Route = require('../../../lib/models/route');

describe('Unit | Models | Route', () => {

  context('reversedRouteId', () => {

    // then
    it('should generate reversedRouteId', () => {
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

      const route = Route.createFromLocations({
        start: location1, destination: location2, state: Route.State.NEED_GOOGLE, straitDistance: 155371,
      });

      expect(route.id).to.equal('C01-C02');
      expect(route.reversedRouteId).to.equal('C02-C01');
    });
  });
});

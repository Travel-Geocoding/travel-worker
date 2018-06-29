const { expect, sinon } = require('../../test-helper');

const Location = require('../../../lib/models/location');
const LocationRepository = require('../../../lib/repositories/location-repository');
const GoogleMapClient = require('../../../lib/google-client');
const processAddressGeocoding = require('../../../lib/job-processors/process-address-geocoding');

describe('Unit | Job Processors | Process Address Geocoding', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(LocationRepository, 'create').resolves();
    sandbox.stub(LocationRepository, 'update').resolves();
    sandbox.stub(GoogleMapClient, 'geocode').resolves();
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('when the address starts with an integer', () => {

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
        },
      },
    };
    const googleMapResult = {
      'results': [
        {
          'address_components': [ // deleted for brievety
          ],
          'formatted_address': '10 Place Geoffroy Guichard, 42110 Feurs, France',
          'geometry': {
            'location': {
              'lat': 45.7430422,
              'lng': 4.224061799999999,
            },
            'location_type': 'RANGE_INTERPOLATED',
            'viewport': {
              'northeast': {
                'lat': 45.7443911802915,
                'lng': 4.225410780291502,
              },
              'southwest': {
                'lat': 45.7416932197085,
                'lng': 4.222712819708497,
              },
            },
          },
          'partial_match': true,
          'place_id': 'Ei8xMCBQbGFjZSBHZW9mZnJveSBHdWljaGFyZCwgNDIxMTAgRmV1cnMsIEZyYW5jZSIaEhgKFAoSCXNhJtUuR_RHESThlg20lhNcEAo',
          'types': ['street_address'],
        },
      ],
      'status': 'OK',
    };

    const expectedCreationLocationObject = new Location({
      id: 'C0470',
      name: 'CASINO SHOP',
      address: '10 PLACE GEOFFROY GUICHARD',
      postalCode: '42110',
      municipality: 'FEURS',
    });
    const expectedUpdateLocationObject = new Location({
      id: 'C0470',
      latitude: '45.7430422',
      longitude: '4.224061799999999',
      matchType: 'RANGE_INTERPOLATED',
      matchedAddress: '10 Place Geoffroy Guichard, 42110 Feurs, France',
    });
    const expectedAddressToGeocode = '10 PLACE GEOFFROY GUICHARD, 42110, FEURS';

    // when
    beforeEach(() => {
      GoogleMapClient.geocode.resolves(googleMapResult);
      LocationRepository.create.resolves(expectedCreationLocationObject);
      LocationRepository.update.resolves(expectedUpdateLocationObject);

      promise = processAddressGeocoding(job);
    });

    // then
    it('should call to create the Location without geodata in database', () => {
      return promise
        .then(() => expect(LocationRepository.create).to.have.been.calledWith(expectedCreationLocationObject));
    });
    it('should call to googleClient to make geocoding request', () => {
      return promise
        .then(() => expect(GoogleMapClient.geocode).to.have.been.calledWith({ address: expectedAddressToGeocode }));
    });
    it('should call to update the Location with the geodata in database', () => {
      return promise
        .then(() => expect(LocationRepository.update).to.have.been.calledWith(expectedUpdateLocationObject));
    });
  });

  context('when the address does not start with an integer', () => {

    let promise;

    // given
    const job = {
      data: {
        address: {
          id: 'C8001',
          name: 'CASINO SHOP',
          address: 'RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL',
          postalCode: '83150',
          municipality: 'BANDOL',
        },
      },
    };
    const googleMapResult = {
      'results': [
        {
          'address_components': [ // deleted for brievety
          ],
          'formatted_address': '24 Rue de la République, 83150 Bandol, France',
          'geometry': {
            'location': {
              'lat': 43.1358763,
              'lng': 5.7537058,
            },
            'location_type': 'ROOFTOP',
            'viewport': {
              'northeast': {
                'lat': 43.1372252802915,
                'lng': 5.755054780291502,
              },
              'southwest': {
                'lat': 43.1345273197085,
                'lng': 5.752356819708497,
              },
            },
          },
          'partial_match': true,
          'place_id': 'ChIJGeoFYhIHyRIRmGBWm5uIGIU',
          'types': [
            'establishment',
            'food',
            'grocery_or_supermarket',
            'point_of_interest',
            'store',
            'supermarket',
          ],
        },
      ],
      'status': 'OK',
    };

    const expectedCreationLocationObject = new Location({
      id: 'C8001',
      name: 'CASINO SHOP',
      address: 'RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL',
      postalCode: '83150',
      municipality: 'BANDOL',
    });
    const expectedUpdateLocationObject = new Location({
      id: 'C8001',
      latitude: '43.1358763',
      longitude: '5.7537058',
      matchType: 'ROOFTOP',
      matchedAddress: '24 Rue de la République, 83150 Bandol, France',
    });
    const expectedAddressToGeocode = 'CASINO SHOP, RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL, 83150, BANDOL';

    // when
    beforeEach(() => {
      GoogleMapClient.geocode.resolves(googleMapResult);
      LocationRepository.create.resolves(expectedCreationLocationObject);
      LocationRepository.update.resolves(expectedUpdateLocationObject);

      promise = processAddressGeocoding(job);
    });

    // then
    it('should call to create the Location without geodata in database', () => {
      return promise
        .then(() => expect(LocationRepository.create).to.have.been.calledWith(expectedCreationLocationObject));
    });
    it('should call to googleClient to make geocoding request', () => {
      return promise
        .then(() => expect(GoogleMapClient.geocode).to.have.been.calledWith({ address: expectedAddressToGeocode }));
    });
    it('should call to update the Location with the geodata in database', () => {
      return promise
        .then(() => expect(LocationRepository.update).to.have.been.calledWith(expectedUpdateLocationObject));
    });
  });

  context('when the GoogleClient returns an error', () => {

    let promise;

    // given
    const job = {
      data: {
        address: {
          id: 'C8001',
          name: 'CASINO SHOP',
          address: 'RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL',
          postalCode: '83150',
          municipality: 'BANDOL',
        },
      },
    };
    const googleMapResult = {
      'error_message': 'You have exceeded your daily request quota for this API. [...]',
      'results': [],
      'status': 'OVER_QUERY_LIMIT',
    };

    const expectedCreationLocationObject = new Location({
      id: 'C8001',
      name: 'CASINO SHOP',
      address: 'RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL',
      postalCode: '83150',
      municipality: 'BANDOL',
    });
    const expectedUpdateLocationObject = new Location({
      id: 'C8001',
      matchType: 'ERROR - OVER_QUERY_LIMIT',
    });
    const expectedAddressToGeocode = 'CASINO SHOP, RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL, 83150, BANDOL';

    // when
    beforeEach(() => {
      GoogleMapClient.geocode.resolves(googleMapResult);
      LocationRepository.create.resolves(expectedCreationLocationObject);
      LocationRepository.update.resolves(expectedUpdateLocationObject);

      promise = processAddressGeocoding(job);
    });

    // then
    it('should call to create the Location without geodata in database', () => {
      return promise
        .then(() => expect(LocationRepository.create).to.have.been.calledWith(expectedCreationLocationObject));
    });
    it('should call to googleClient to make geocoding request', () => {
      return promise
        .then(() => expect(GoogleMapClient.geocode).to.have.been.calledWith({ address: expectedAddressToGeocode }));
    });
    it('should call to update the Location with the error in database', () => {
      return promise
        .then(() => expect(LocationRepository.update).to.have.been.calledWith(expectedUpdateLocationObject));
    });
  });

  context('when the GoogleClient fails', () => {

    let promise;

    // given
    const job = {
      data: {
        address: {
          id: 'C8001',
          name: 'CASINO SHOP',
          address: 'RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL',
          postalCode: '83150',
          municipality: 'BANDOL',
        },
      },
    };

    const googleMapClientError = new Error('this is an error message');
    const expectedCreationLocationObject = new Location({
      id: 'C8001',
      name: 'CASINO SHOP',
      address: 'RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL',
      postalCode: '83150',
      municipality: 'BANDOL',
    });
    const expectedUpdateLocationObject = new Location({
      id: 'C8001',
      matchType: 'ERROR - Error: this is an error message',
    });
    const expectedAddressToGeocode = 'CASINO SHOP, RUE GABRIEL PERI - RUE PONS ET 24 RUE DE LA REPUBL, 83150, BANDOL';

    // when
    beforeEach(() => {
      GoogleMapClient.geocode.rejects(googleMapClientError);
      LocationRepository.create.resolves(expectedCreationLocationObject);
      LocationRepository.update.resolves(expectedUpdateLocationObject);

      promise = processAddressGeocoding(job);
    });

    // then
    it('should call to create the Location without geodata in database', () => {
      return promise
        .then(() => expect(LocationRepository.create).to.have.been.calledWith(expectedCreationLocationObject));
    });
    it('should call to googleClient to make geocoding request', () => {
      return promise
        .then(() => expect(GoogleMapClient.geocode).to.have.been.calledWith({ address: expectedAddressToGeocode }));
    });
    it('should call to update the Location with the error in database', () => {
      return promise
        .then(() => expect(LocationRepository.update).to.have.been.called);
    });
  });
});

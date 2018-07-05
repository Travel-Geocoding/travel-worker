const { expect, sinon } = require('../../test-helper');
const processInsertRoute = require('../../../lib/job-processors/process-insert-route');

const Location = require('../../../lib/models/location');
const Error = require('../../../lib/models/error');
const Route = require('../../../lib/models/route');

const RouteRepository = require('../../../lib/repositories/route-repository');
const Job = require('../../../lib/job-manager/job');

describe('Unit | Job Processors | Insert Route', () => {

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(RouteRepository, 'get');
    sandbox.stub(RouteRepository, 'update');
    sandbox.stub(RouteRepository, 'create');
  });

  afterEach(() => {
    sandbox.restore();
  });

  context('when the route does not exist in db', () => {

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

    const route = Route.createFromLocations({
      start: location1, destination: location2, state: Route.State.DONE, straitDistance: 155371,
    });

    beforeEach(() => {
      RouteRepository.get.rejects(new Error.NotFoundError());

      // objects are plain JSON
      const job = Job.insertRoute({ route: Object.assign({}, route) });

      promise = processInsertRoute(job);
    });

    it('should succeded', () => {
      return expect(promise).to.have.fulfilled;
    });
    it('should call the route repository to try and get a route with the same id', () => {
      return promise.then(() => expect(RouteRepository.get.firstCall).to.have.been.calledWithExactly(route.id));
    });
    it('should call the route repository to try and get a route with the reversed id', () => {
      return promise.then(() => expect(RouteRepository.get.secondCall).to.have.been.calledWithExactly(route.reversedRouteId));
    });
    it('should save it', () => {
      return promise.then(() => expect(RouteRepository.create).to.have.been.calledWith(route));
    });
  });

  context('when the route does exist in db', () => {

    context('and the route status is Done', () => {

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

      const route = Route.createFromLocations({
        start: location1, destination: location2, state: Route.State.DONE, straitDistance: 155371,
      });
      const routeFromRepo = Route.createFromLocations({
        start: location1, destination: location2, state: Route.State.DONE, straitDistance: 155371,
      });

      beforeEach(() => {
        RouteRepository.get.resolves(routeFromRepo);

        // objects are plain JSON
        // objects are plain JSON
      const job = Job.insertRoute({ route: Object.assign({}, route) });

        promise = processInsertRoute(job);
      });

      it('should succeded', () => {
        return expect(promise).to.have.fulfilled;
      });
      it('should call the route repository to try and get a route with the same id', () => {
        return promise.then(() => expect(RouteRepository.get.firstCall).to.have.been.calledWithExactly(route.id));
      });
      it('should not call the route repository to try and get a route with the reversed id', () => {
        return promise.then(() => expect(RouteRepository.get.secondCall).to.equal(null));
      });
      it('should not save it nor update it', () => {
        return promise
          .then(() => expect(RouteRepository.create).to.not.have.been.called)
          .then(() => expect(RouteRepository.update).to.not.have.been.called);
      });
    });

    context('and the route to insert needs processing and the route received is Done', () => {

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

      const route = Route.createFromLocations({
        start: location1, destination: location2, state: Route.State.NEED_GOOGLE, straitDistance: 155371,
      });
      const routeFromRepo = Route.createFromLocations({
        start: location1, destination: location2, state: Route.State.DONE, straitDistance: 155371,
      });

      beforeEach(() => {
        RouteRepository.get.onFirstCall().rejects(new Error.NotFoundError());
        RouteRepository.get.onSecondCall().resolves(routeFromRepo);

        // objects are plain JSON
      const job = Job.insertRoute({ route: Object.assign({}, route) });

        promise = processInsertRoute(job);
      });

      it('should succeded', () => {
        return expect(promise).to.have.fulfilled;
      });
      it('should call the route repository to try and get a route with the same id', () => {
        return promise.then(() => expect(RouteRepository.get.firstCall).to.have.been.calledWithExactly(route.id));
      });
      it('should not call the route repository to try and get a route with the reversed id', () => {
        return promise.then(() => expect(RouteRepository.get.secondCall).to.have.been.calledWithExactly(route.reversedRouteId));
      });
      it('should update it', () => {
        return promise
          .then(() => expect(RouteRepository.create).to.not.have.been.called)
          .then(() => expect(RouteRepository.update).to.have.been.calledWithExactly(route));
      });
    });
  });
});

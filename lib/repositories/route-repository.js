const Error = require('../models/error');
const BookshelfRoute = require('../datas/route');
const Page = require('../models/page');
const Route = require('../models/route');
const RoutePaginationResult = require('../models/route-pagination-result');

function convertBookshelfToDomain(bookshelfRoute) {
  const route = new Route(bookshelfRoute.toJSON());
  route.googleStatus = bookshelfRoute.get('google_status');
  return route;
}

function convertBookshelfPageToDomain(bookshelfRoutePaginationResult) {

  const page = new Page({
    currentPageNumber: bookshelfRoutePaginationResult.pagination.page,
    pageSize: bookshelfRoutePaginationResult.pagination.pageSize,
    totalPageCount: bookshelfRoutePaginationResult.pagination.pageCount,
    totalRowCount: bookshelfRoutePaginationResult.pagination.rowCount,
  });

  const routes = bookshelfRoutePaginationResult.models
    .map(convertBookshelfToDomain);

  return new RoutePaginationResult({
    routes,
    page,
  });
}

function convertToBookshelf(route) {
  // route.google_status = route.googleStatus
  return {
    id: route.id,
    state: route.state,
    startId: route.startId,
    startLatitude: route.startLatitude,
    startLongitude: route.startLongitude,
    destinationId: route.destinationId,
    destinationLatitude: route.destinationLatitude,
    destinationLongitude: route.destinationLongitude,
    straitDistance: route.straitDistance,
    googleStatus: route.googleStatus,
    google_status: route.googleStatus,
    travelMode: route.travelMode,
    travelDistance: route.travelDistance,
    travelDuration: route.travelDuration,
    travelDurationText: route.travelDurationText,
    travelInTrafficDistance: route.travelInTrafficDistance,
    travelInTrafficDuration: route.travelInTrafficDuration,
    travelInTrafficDurationText: route.travelInTrafficDurationText,
  };
}

module.exports = {

  create(route) {

    return new BookshelfRoute(convertToBookshelf(route))
      .save(null, { method: 'insert' })
      .then(convertBookshelfToDomain);
  },

  update(route) {

    return new BookshelfRoute({ id } = route)
      .where({ id })
      .save(convertToBookshelf(route), { method: 'update', patch: true, require: true })
      .then(convertBookshelfToDomain);
  },

  get(id) {

    return BookshelfRoute
      .where({ id })
      .fetch({ require: true })
      .then(convertBookshelfToDomain)
      .catch(err => {
        if (err instanceof BookshelfRoute.NotFoundError) {
          throw new Error.NotFoundError(`No Route found for ID ${id}`);
        } else {
          throw err;
        }
      });
  },

  listWithPaginationForProcessNeeding({ pageNumber }) {

    return BookshelfRoute
      .query('where', 'state', '=', `${Route.State.NEED_GOOGLE}`)
      .fetchPage({
        pageSize: 20,
        page: pageNumber,
      })
      .then(convertBookshelfPageToDomain)
      .catch((error) => {
        const server = require('../server/server-instance');
        server.logger().error(`Failed route repository get listWithPagination because: ${error}`);
        throw error;
      });
  },
};


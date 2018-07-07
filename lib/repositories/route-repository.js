const Error = require('../models/error');
const BookshelfRoute = require('../datas/route');
const Page = require('../models/page');
const Route = require('../models/route');
const RoutePaginationResult = require('../models/route-pagination-result');

function convertBookshelfToDomain(bookshelfRoute) {
  return new Route(bookshelfRoute.toJSON());
}

function convertBookshelfPageToDomain(bookshelfRoutePaginationResult) {

  const page = new Page({
    currentPageNumber: bookshelfRoutePaginationResult.pagination.page,
    pageSize: bookshelfRoutePaginationResult.pagination.pageSize,
    totalPageCount: bookshelfRoutePaginationResult.pagination.pageCount,
    totalRowCount: bookshelfRoutePaginationResult.pagination.rowCount,
  });

  const routes = bookshelfRoutePaginationResult.models
    .map((bookshelfRoute) => new Route(bookshelfRoute.toJSON()));

  return new RoutePaginationResult({
    routes,
    page,
  });
}

module.exports = {

  create(route) {

    return new BookshelfRoute(route)
      .save(null, { method: 'insert' })
      .then(convertBookshelfToDomain);
  },

  update(route) {

    return new BookshelfRoute({ id } = route)
      .where({ id })
      .save(route, { method: 'update', patch: true, require: true })
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


const Error = require('../models/error');
const BookshelfRoute = require('../datas/route');
const Route = require('../models/route');

function convertBookshelfToDomain(bookshelfRoute) {
  return new Route(bookshelfRoute.toJSON());
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
};


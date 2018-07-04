const bookshelf = require('../bookshelf');
const BookshelfLocation = require('../datas/location');
const Location = require('../models/location');
const LocationPaginationResult = require('../models/location-pagination-result');
const Page = require('../models/page');

function convertBookshelfToDomain(bookshelfLocation) {
  return new Location(bookshelfLocation.toJSON());
}

function convertBookshelfPageToDomain(bookshelfLocationPaginationResult) {

  const page = new Page({
    currentPageNumber: bookshelfLocationPaginationResult.pagination.page,
    pageSize: bookshelfLocationPaginationResult.pagination.pageSize,
    totalPageCount: bookshelfLocationPaginationResult.pagination.pageCount,
    totalRowCount: bookshelfLocationPaginationResult.pagination.rowCount,
  });

  const locations = bookshelfLocationPaginationResult.models
    .map((bookshelfLocation) => new Location(bookshelfLocation.toJSON()));

  return new LocationPaginationResult({
    locations,
    page,
  });
}

module.exports = {

  create(location) {

    return new BookshelfLocation(location)
      .save(null, { method: 'insert' })
      .then(convertBookshelfToDomain);
  },

  update(location) {

    return new BookshelfLocation({ id } = location)
      .where({ id })
      .save(location, { method: 'update', patch: true, require: true })
      .then(convertBookshelfToDomain);
  },

  get(id) {

    return BookshelfLocation
      .where({ id })
      .fetch({ require: true })
      .then(convertBookshelfToDomain);
  },

  pluckIds() {
    return bookshelf.knex.table('locations').pluck('id');
  },

  listWithPagination({ pageNumber }) {

    return BookshelfLocation
      .query({ whereNotNull: 'id' })
      .fetchPage({
        pageSize: 20,
        page: pageNumber,
      })
      .then(convertBookshelfPageToDomain);
  },
};


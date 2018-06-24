const BookshelfLocation = require('../datas/location');
const Location = require('../models/location');

function convertBookshelfToDomain(bookshelfLocation) {
  return new Location(bookshelfLocation.toJSON());
}

module.exports = {

  create(location) {

    return new BookshelfLocation(location)
      .save(null, { method: 'insert' })
      .then(convertBookshelfToDomain);
  },

  get(id) {

    return BookshelfLocation
      .where({ id })
      .fetch({ require: true })
      .then(convertBookshelfToDomain);
  },
};


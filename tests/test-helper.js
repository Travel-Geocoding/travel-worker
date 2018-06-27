// Chai
const chai = require('chai');
const expect = chai.expect;
chai.use(require('chai-as-promised'));

// Sinon
const sinon = require('sinon');
chai.use(require('sinon-chai'));

// Knex
const knexConfig = require('../db/knexfile');
const knex = require('knex')(knexConfig['test']);

// Hapi
const server = require('../lib/server/server-instance');
server.logger = () => {
  return {
    info: () => undefined,
    error: () => undefined,
  };
};

module.exports = {
  expect,
  knex,
  sinon,
};

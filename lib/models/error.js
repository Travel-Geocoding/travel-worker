class DomainError extends Error {
  constructor(message) {
    super(message);
  }
}

class MaxNumberOfCallsExceeded extends DomainError {
  constructor(message) {
    super(message);
  }
}

class NotFoundError extends DomainError {
  constructor(message) {
    super(message);
  }
}

module.exports = {
  DomainError,
  MaxNumberOfCallsExceeded,
  NotFoundError,
};

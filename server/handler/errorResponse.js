const Boom = require('@hapi/boom');

const errorResponse = (error) => {
  const statusCode = error.output?.payload?.statusCode || error.response?.status;
  const statusMessage = error.output?.payload?.message || error.response?.statusText;
  switch (statusCode) {
    case 400:
      return Boom.badRequest(statusMessage);
    case 404:
      return Boom.notFound(statusMessage);
    default:
      return Boom.badImplementation();
  }
};

module.exports = {
  errorResponse
};

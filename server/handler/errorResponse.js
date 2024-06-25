const Boom = require('@hapi/boom');

const errorResponse = (error) => {
  switch (error.output?.payload?.statusCode) {
    case 400:
      return Boom.badRequest(error.output.payload.message);
    default:
      return Boom.badImplementation();
  }
};

module.exports = {
  errorResponse
};

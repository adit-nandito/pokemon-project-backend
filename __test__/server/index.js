const express = require('express');

const app = express();

const createTestServer = (path, plugin) => {
  // Middleware
  app.use(express.json());
  app.use(
    express.urlencoded({
      extended: true
    })
  );

  app.use((req, res, next) => {
    const oldSend = res.send;
    res.send = async (data) => {
      res.send = oldSend; // set function back to avoid the 'double-send'
      const statusCode = data.output?.statusCode || res.statusCode;
      let bodyResponse = data;
      if (statusCode !== 200 && data.isBoom) {
        bodyResponse = data.output.payload;
      }

      return res.status(statusCode).send(bodyResponse);
    };

    next();
  });

  app.use(path, plugin);

  return app.listen(null, () => {});
};

module.exports = {
  createTestServer
};

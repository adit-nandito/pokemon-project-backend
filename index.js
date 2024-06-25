const express = require('express');
require('dotenv').config();
const Pokemon = require('./server/api/pokemon');

const Port = process.env.PORT || '5000';
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Route middlewares
app.use('/api/pokemon', Pokemon);

app.listen(Port, () => {
  console.log(['Info'], `Server started on port ${Port}`);
});

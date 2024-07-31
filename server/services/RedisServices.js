const _ = require('lodash');
const Redis = require('ioredis');

let client = null;

/*
 *  PRIVATE FUNCTION
 */
const __redis = () => {
  if (process.env.NODE_ENV === 'test') {
    client = null;
  }

  if (_.isNull(client) || (!_.isEmpty(client) && client.status === 'end')) {
    const singleRedis = process.env.SINGLE_REDIS || '127.0.0.1:6379';
    if (singleRedis) {
      const redisArr = singleRedis.split(':');
      const host = redisArr[0];
      const port = redisArr[1];
      client = new Redis({
        port,
        host,
        retryStrategy: (options) => {
          console.log(['Redis Session', `Retry Strategy on host ${host}`], { options });
          if (options.error && options.error.code === 'ECONNREFUSED') {
            // If redis refuses the connection or is not able to connect
            return new Error('The server refused the connection');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnection after the specified time limit
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
          }
          // reconnect after
          return Math.min(options.attempt * 100, 4000);
        }
      });

      return client;
    }
  } else {
    client.on('connect', (err) => {
      console.log(['Redis', 'Connected', 'INFO'], { info: `${err}` });
    });
  }

  client.on('error', (err) => {
    console.log(['Redis', 'Client On Error', 'ERROR'], { info: `${err}` });
    client.disconnect();
    return Promise.reject(err);
  });

  return client;
};

/*
 *  PUBLIC FUNCTION
 */
const hgetAllDataRedis = async (key) =>
  new Promise((resolve, reject) => {
    __redis().hgetall(key, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });

const hgetDataRedis = async (dataObject) => {
  const { msisdn, transactionid, key, value, isErrorOptional } = dataObject;
  return new Promise((resolve, reject) => {
    __redis().hget(key, value, (err, result) => {
      if (err) {
        if (isErrorOptional) {
          return resolve(null);
        }

        return reject(err);
      }

      return resolve(result);
    });
  });
};

const getDataRedis = async (dataObject) => {
  const { msisdn, transactionid, key, isErrorOptional } = dataObject;
  return new Promise((resolve, reject) => {
    __redis().get(key, (err, result) => {
      if (err) {
        if (isErrorOptional) {
          return resolve(null);
        }

        return reject(err);
      }

      return resolve(result);
    });
  });
};

const hmsetDataRedis = async (dataObject) => {
  const { msisdn, transactionid, key, value, isSetExpired, second, isErrorOptional } = dataObject;
  return new Promise((resolve, reject) => {
    // Pattern "value" should be ['field1', 'value1', 'field2', 'value2', ....]
    __redis().hmset(key, value, (err, result) => {
      if (err) {
        if (isErrorOptional) {
          return resolve(null);
        }

        return reject(err);
      }

      if (isSetExpired) {
        let expiredSecond = 86400; // Default expiry one day
        if (!_.isEmpty(second) && !Number.isNaN(Number(second))) {
          expiredSecond = Number(second);
        }
        __redis().expire(key, expiredSecond, (error) => {
          if (error) {
            console.log(['Redis', 'Set Expired Data', 'ERROR'], {
              msisdn,
              transactionid,
              key,
              info: `${err}`
            });
          }
        });
      }

      return resolve(result);
    });
  });
};

const hsetDataRedis = async (key, value) =>
  new Promise((resolve, reject) => {
    __redis().hset(key, value, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result);
    });
  });

const hdelDataRedis = async (dataObject) => {
  const { msisdn, transactionid, key, value, isErrorOptional } = dataObject;
  return new Promise((resolve, reject) => {
    __redis().hdel(key, value, (err, result) => {
      if (err) {
        if (isErrorOptional) {
          return resolve(null);
        }

        return reject(err);
      }

      return resolve(result);
    });
  });
};

const delDataRedis = async (dataObject) => {
  const { msisdn, transactionid, key, isErrorOptional } = dataObject;
  return new Promise((resolve, reject) => {
    __redis().del(key, (err, result) => {
      if (err) {
        if (isErrorOptional) {
          return resolve(null);
        }

        return reject(err);
      }

      return resolve(result);
    });
  });
};

module.exports = {
  hgetAllDataRedis,
  hgetDataRedis,
  getDataRedis,
  hmsetDataRedis,
  hsetDataRedis,
  hdelDataRedis,
  delDataRedis
};

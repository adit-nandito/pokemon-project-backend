const MySQL = require('mysql2');
const _ = require('lodash');

const ConnectionPool = MySQL.createPool({
  host: process.env.MYSQL_CONFIG_HOST || 'localhost',
  user: process.env.MYSQL_CONFIG_USER || 'root',
  password: process.env.MYSQL_CONFIG_PASSWORD || 'pokemon',
  database: process.env.MYSQL_CONFIG_DATABASE || 'PokemonDB',
  port: process.env.MYSQL_CONFIG_PORT || '3306'
})
  .promise()
  .getConnection();

/*
 * PRIVATE FUNCTION
 */
const __constructQueryResult = (response, isUpdateData) => {
  const result = [];
  if (!_.isEmpty(response[0]) && !isUpdateData) {
    response[0].forEach((item) => {
      const key = Object.keys(item);

      // Reconstruct query result
      const object = {};
      key.forEach((data) => {
        object[data] = item[data];
      });

      result.push(object);
    });
  }

  return result;
};

/*
 * PUBLIC FUNCTION
 */
const executeQueryDatabase = async (dataObject) => {
  let poolConnection;
  const { query, data, isUpdateData } = dataObject;
  if (process.env.NODE_ENV === 'test') poolConnection = undefined;
  try {
    let values = [];
    if (Array.isArray(values)) values = data;

    poolConnection = await ConnectionPool;
    const response = await poolConnection.query(query, values);
    const result = __constructQueryResult(response, isUpdateData);

    poolConnection.release();

    return Promise.resolve(result);
  } catch (err) {
    if (poolConnection) {
      await poolConnection.rollback();
      poolConnection.release();
    }

    return Promise.reject(err);
  }
};

module.exports = {
  executeQueryDatabase
};

const _ = require('lodash');
const Moment = require('moment');
const DatabaseService = require('../database/pokemonDatabase');
const APIService = require('../services/APIServices');

/*
 *  PRIVATE FUNCTION
 */
const __getRandomInt = (min, max) => {
  const minVal = Math.ceil(min);
  const maxVal = Math.floor(max);
  return Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
};

/*
 *  PUBLIC FUNCTION
 */
const getListPokemon = async () => {
  try {
    const query = 'SELECT * FROM pokemon;';
    const result = await DatabaseService.executeQueryDatabase({ query });
    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

const catchPokemon = async (id) => {
  try {
    let isCatchSuccess = false;
    const result = await APIService.getSpeciesPokemon(id);
    const randomInt = __getRandomInt(1, 255);
    if (result && result.capture_rate > 0 && randomInt <= result.capture_rate) {
      const idPokemon = `${id}_${Moment().format('YYMMDDHHmmss')}`;
      const query = 'INSERT INTO pokemon (id_pokemon, name_pokemon, nickname_pokemon) VALUES (?, ?, ?);';
      const data = [idPokemon, _.capitalize(result.name), _.capitalize(result.name)];
      await DatabaseService.executeQueryDatabase({ query, data, isUpdateData: true });
      isCatchSuccess = true;
    }

    return Promise.resolve({ isCatchSuccess });
  } catch (err) {
    return Promise.reject(err);
  }
};

const updateDataPokemon = async (id, nickname) => {
  try {
    const query = 'UPDATE pokemon SET nickname_pokemon = ? WHERE id_pokemon = ?;';
    const data = [nickname, id];
    await DatabaseService.executeQueryDatabase({ query, data, isUpdateData: true });

    return Promise.resolve('Success');
  } catch (err) {
    return Promise.reject(err);
  }
};

const deleteDataPokemon = async (id) => {
  try {
    const query = 'DELETE FROM pokemon WHERE id_pokemon = ?;';
    const data = [id];
    await DatabaseService.executeQueryDatabase({ query, data, isUpdateData: true });

    return Promise.resolve('Success');
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports = {
  getListPokemon,
  catchPokemon,
  updateDataPokemon,
  deleteDataPokemon
};

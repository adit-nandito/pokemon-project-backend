const Axios = require('axios');

const URL_POKEMON = process.env.URL_POKEMON || 'http://localhost:5000';
const LIMIT_ALL_POKEMON = process.env.LIMIT_ALL_POKEMON || 1;

const getListPokemon = async () => {
  try {
    const response = await Axios.get(`${URL_POKEMON}/pokemon?limit=${LIMIT_ALL_POKEMON}`);
    return Promise.resolve(response.data);
  } catch (err) {
    return Promise.resolve(null);
  }
};

const getDetailPokemon = async (index) => {
  try {
    const response = await Axios.get(`${URL_POKEMON}/pokemon/${index}`);
    return Promise.resolve(response.data);
  } catch (err) {
    return Promise.reject(err);
  }
};

const getSpecificDetailPokemon = async (index) => {
  try {
    let response = null;
    if (Number(index) < 10000) {
      const result = await Axios.get(`${URL_POKEMON}/pokemon-species/${index}`);
      response = result.data;
    }

    return Promise.resolve(response);
  } catch (err) {
    return Promise.resolve(null);
  }
};

const getSpeciesPokemon = async (id) => {
  try {
    const response = await Axios.get(`${URL_POKEMON}/pokemon-species/${id}`);
    return Promise.resolve(response.data);
  } catch (err) {
    return Promise.resolve(null);
  }
};

const getWeaknessPokemon = async (name) => {
  try {
    const response = await Axios.get(`${URL_POKEMON}/type/${name}`);
    return Promise.resolve(response.data);
  } catch (err) {
    return Promise.resolve(null);
  }
};

const getAbilitiesPokemon = async (name) => {
  try {
    const response = await Axios.get(`${URL_POKEMON}/ability/${name}`);
    return Promise.resolve(response.data);
  } catch (err) {
    return Promise.resolve(null);
  }
};

module.exports = {
  getListPokemon,
  getDetailPokemon,
  getSpecificDetailPokemon,
  getSpeciesPokemon,
  getWeaknessPokemon,
  getAbilitiesPokemon
};

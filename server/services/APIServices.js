const Axios = require('axios');

const getSpeciesPokemon = async (id) => {
  let result = null;
  try {
    const response = await Axios.get(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
    if (response.status === 200) result = response.data;

    return Promise.resolve(result);
  } catch (err) {
    return Promise.resolve(result);
  }
};

module.exports = {
  getSpeciesPokemon
};

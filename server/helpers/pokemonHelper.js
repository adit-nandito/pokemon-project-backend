const _ = require('lodash');
const Moment = require('moment');
const DatabaseService = require('../database/pokemonDatabase');
const APIService = require('../services/APIServices');

const LIMIT_CATCHABLE_POKEMON = process.env.LIMIT_CATCHABLE_POKEMON || 1;
const IMAGE_URL = process.env.IMAGE_URL || 'http://localhost';
const OFFSET_POKEMON = process.env.OFFSET_POKEMON || 20;

/*
 *  PRIVATE FUNCTION
 */
const __getRandomInt = () => {
  const minVal = 1;
  const maxVal = 255;
  return Math.floor(Math.random() * maxVal) + minVal;
};

const __generateListPokemon = (listData) => {
  const listPokemon = listData.map((item) => {
    const index = item.url.split('/')[6];
    const name = item.name.replace('-', ' ');
    const pokemonObject = {
      index,
      id: item.name,
      name: _.startCase(name),
      image: `${IMAGE_URL}/other/official-artwork/${index}.png`
    };
    return pokemonObject;
  });

  return listPokemon;
};

const __converterHeight = (meter) => {
  let value = Number((meter / 10).toFixed(1)).toPrecision();
  let height = `${value} m`;
  if (Number(value) < 1) {
    value *= 100;
    height = `${value} cm`;
  }

  return height;
};

const __converterWeight = (kilo) => {
  let value = Number((kilo / 10).toFixed(1)).toPrecision();
  let weight = `${value} kg`;
  if (Number(value) < 1) {
    value *= 1000;
    weight = `${value} g`;
  }

  return weight;
};

const __constructResponseTypesPokemon = async (pokemonTypes) => {
  let listWeakness = [];
  let listResistance = [];
  const types = await Promise.all(
    pokemonTypes.map(async (item) => {
      const result = await APIService.getWeaknessPokemon(item.type.name);
      if (result) {
        const listDoubleDamage = result.damage_relations.double_damage_from.map((param) => param.name);
        const listHalfDamage = result.damage_relations.half_damage_from.map((param) => param.name);
        const listNoDamage = result.damage_relations.no_damage_from.map((param) => param.name);
        listResistance = listResistance.concat(listHalfDamage.concat(listNoDamage));
        listWeakness = listWeakness.concat(listDoubleDamage);
      }

      return item.type.name;
    })
  );

  const uniqListWeakness = _.uniq(listWeakness);
  const filteredListWeakness = uniqListWeakness.filter((item) => {
    const isResistance = listResistance.some((value) => item === value);
    return !isResistance;
  });

  return Promise.resolve({ listWeakness: filteredListWeakness, types });
};

const __constructResponseSpeciesPokemon = (speciesPokemon) => {
  let desc;
  let habitat;
  let catchRate;
  if (speciesPokemon) {
    desc = speciesPokemon.flavor_text_entries.find((item) => item.language?.name === 'en');
    habitat =
      speciesPokemon.habitat &&
      speciesPokemon.habitat.name &&
      _.startCase(speciesPokemon.habitat.name).replace('-', ' ');
    catchRate = Math.round((speciesPokemon.capture_rate / 255) * 100);
  }

  return {
    desc: desc?.flavor_text || 'Unknown',
    habitat: habitat || 'Unknown',
    catchRate
  };
};

const __constructResponseAbilitesPokemon = async (abilities) => {
  const response = await Promise.all(
    abilities.map(async (item) => {
      const result = await APIService.getAbilitiesPokemon(item.ability.name);
      let data = null;
      if (result) {
        const desc = result.flavor_text_entries.find((param) => param.language?.name === 'en');
        data = {
          name: result.name,
          desc: desc.flavor_text
        };
      }

      return data;
    })
  );

  return Promise.resolve(response);
};

/*
 *  PUBLIC FUNCTION
 */
const getListPokemon = async () => {
  try {
    const response = await APIService.getListPokemon();
    const listPokemon = response.results.splice(0, LIMIT_CATCHABLE_POKEMON);
    const listCatchablePokemon = __generateListPokemon(listPokemon);
    const listSecretPokemon = __generateListPokemon(response.results);

    const result = {
      offset: Number(OFFSET_POKEMON),
      catchablePokemon: {
        limit: listCatchablePokemon.length,
        list: listCatchablePokemon
      },
      secretPokemon: {
        limit: listSecretPokemon.length,
        list: listSecretPokemon
      }
    };

    return Promise.resolve(result);
  } catch (err) {
    return Promise.reject(err);
  }
};

const getDetailPokemon = async (name) => {
  try {
    const detailPokemon = await APIService.getDetailPokemon(name);
    const idPokemon = detailPokemon.id;
    const isCatchablePokemon = idPokemon < 10000;
    const [speciesPokemon, listType, abilities] = await Promise.all([
      APIService.getSpecificDetailPokemon(detailPokemon.id),
      __constructResponseTypesPokemon(detailPokemon.types),
      __constructResponseAbilitesPokemon(detailPokemon.abilities)
    ]);
    const height = __converterHeight(detailPokemon.height);
    const weight = __converterWeight(detailPokemon.weight);
    const species = __constructResponseSpeciesPokemon(speciesPokemon);
    const stats = detailPokemon.stats.map((item) => ({
      param: item.stat.name,
      value: item.base_stat
    }));

    const { sprites } = detailPokemon;
    const otherSprites = sprites.other;

    const pokemonObject = {
      index: idPokemon,
      isCatchablePokemon,
      name: _.startCase(detailPokemon.name).replace('-', ' '),
      image: otherSprites['official-artwork'].front_default,
      icon: otherSprites.showdown.front_default ? otherSprites.showdown.front_default : sprites.front_default,
      weight,
      height,
      types: listType.types,
      listWeakness: listType.listWeakness,
      stats,
      desc: species.desc,
      habitat: species.habitat,
      catchRate: species.catchRate,
      abilities: abilities || []
    };

    return Promise.resolve(pokemonObject);
  } catch (err) {
    return Promise.reject(err);
  }
};

const getListMyPokemon = async () => {
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
    const randomInt = __getRandomInt();
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
  getListMyPokemon,
  getDetailPokemon,
  catchPokemon,
  updateDataPokemon,
  deleteDataPokemon
};

const Fs = require('fs');
const Path = require('path');
const _ = require('lodash');
const Moment = require('moment');
const DatabaseService = require('../database/pokemonDatabase');
const APIService = require('../services/APIServices');
const RedisService = require('../services/RedisServices');

const LIST_POKEBALL = Path.join(__dirname, '../assets/listPokeBall.json');
const LIMIT_CATCHABLE_POKEMON = process.env.LIMIT_CATCHABLE_POKEMON || 1;
const IMAGE_URL = process.env.IMAGE_URL || 'http://localhost';
const OFFSET_POKEMON = process.env.OFFSET_POKEMON || 20;

/*
 *  PRIVATE FUNCTION
 */
const __readFromFile = (file) =>
  new Promise((resolve, reject) => {
    Fs.readFile(file, (err, content) => {
      if (err) {
        return reject(err);
      }

      return resolve(JSON.parse(content));
    });
  });

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

const getPokeball = async () => {
  try {
    const randomChance = Math.floor(Math.random() * 100) + 1;
    // x1
    let id = 'pokeball';
    let name = 'Poké Ball';
    let desc = "A BALL thrown to catch a wild Pokémon. It doesn't affect to wild secret Pokémon";
    if (randomChance > 30 && randomChance <= 60) {
      // x2
      id = 'greatball';
    } else if (randomChance > 20 && randomChance <= 30) {
      // x3
      id = 'ultraball';
      const randomNumber = Math.floor(Math.random() * 7) + 1;
      if (randomNumber === 2) {
        id = 'darkball';
      } else if (randomNumber === 3) {
        id = 'illusionball';
      } else if (randomNumber === 4) {
        id = 'netball';
      } else if (randomNumber === 5) {
        id = 'bumiball';
      } else if (randomNumber === 6) {
        id = 'crystalball';
      } else if (randomNumber === 7) {
        id = 'steelball';
      }
    } else if (randomChance > 10 && randomChance <= 20) {
      // x4
      id = 'pokeballsecret';
      const randomNumber = Math.floor(Math.random() * 10) + 1;
      if (randomNumber === 2) {
        id = 'greatballsecret';
      } else if (randomNumber === 3) {
        id = 'ultraballsecret';
      } else if (randomNumber === 4) {
        id = 'diveball';
      } else if (randomNumber === 5) {
        id = 'duskball';
      } else if (randomNumber === 6) {
        id = 'lureball';
      } else if (randomNumber === 7) {
        id = 'fastball';
      } else if (randomNumber === 8) {
        id = 'heavyball';
      } else if (randomNumber === 9) {
        id = 'mysteryball';
      } else if (randomNumber === 10) {
        id = 'pikachuball';
      }
    } else if (randomChance > 1 && randomChance <= 10) {
      // x5 =85%
      // Galar, Hisui, Max, Alola, Mega
      id = 'heavyballsecret';
      const randomNumber = Math.floor(Math.random() * 7) + 1;
      if (randomNumber === 2) {
        id = 'megaball';
      } else if (randomNumber === 3) {
        id = 'galarball';
      } else if (randomNumber === 4) {
        id = 'alolaball';
      } else if (randomNumber === 5) {
        id = 'hisuiball';
      } else if (randomNumber === 6) {
        id = 'beastball';
      } else if (randomNumber === 7) {
        id = 'gmaxball';
      }
    } else if (randomChance <= 1) {
      // 100%
      id = 'masterball';
    }
    const listBall = await __readFromFile(LIST_POKEBALL);
    const selectedBall = listBall.ball.find((item) => item.id === id);
    if (selectedBall) {
      name = selectedBall.name;
      desc = selectedBall.desc;
    }
    const data = await RedisService.hgetAllDataRedis('listBall');
    const value = data[id] ? Number(data[id]) + 1 : 1;
    await RedisService.hsetDataRedis('listBall', [id, value]);
    return Promise.resolve({ id, name, desc });
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
    const minVal = 1;
    const maxVal = 255;
    const randomInt = Math.floor(Math.random() * maxVal) + minVal;
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
  getPokeball,
  catchPokemon,
  updateDataPokemon,
  deleteDataPokemon
};

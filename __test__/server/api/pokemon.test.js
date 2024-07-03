const _ = require('lodash');
const Request = require('supertest');
const MySQL = require('mysql2');
const Axios = require('axios');
const QS = require('qs');
const PokemonPlugin = require('../../../server/api/pokemon');
const TestServer = require('../index');

const MockListPokemon = require('../../../__fixtures__/api/listPokemon.json');
const MockDetailPokemon = require('../../../__fixtures__/api/detailPokemon.json');
const MockDetailSpeciesPokemon = require('../../../__fixtures__/api/detailSpeciesPokemon.json');
const MockTypePokemon = require('../../../__fixtures__/api/typePokemon.json');
const MockListMyPokemon = require('../../../__fixtures__/database/listMyPokemon.json');
const MockAbilityPokemon = require('../../../__fixtures__/api/abilityPokemon.json');

let server;
let payload;
let query;

describe('Pokemon', () => {
  beforeAll(() => {
    server = TestServer.createTestServer('/api/pokemon', PokemonPlugin);
  });

  afterAll(async () => {
    await server.close();
  });

  /*
   * EXPERIMENT
   */
  describe('Get List Pokemon', () => {
    test('it should return status response 200: Get all list pokemon', async () => {
      Axios.get.mockImplementation(
        (url) =>
          new Promise((resolve) => {
            if (url === `http://localhost:5000/pokemon?limit=1`) {
              resolve({ data: MockListPokemon });
            }
          })
      );

      await Request(server)
        .get('/api/pokemon/list-all')
        .expect(200)
        .then((res) => {
          expect(res.body.catchablePokemon.limit).toBeGreaterThan(0);
          expect(res.body.secretPokemon.limit).toBeGreaterThan(0);
        });
    });

    test('it should return status response 500: Something went wrong with backend', async () => {
      Axios.get.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      await Request(server).get('/api/pokemon/list-all').expect(500);
    });
  });

  /*
   * EXPERIMENT
   */
  describe('Get Detail Pokemon', () => {
    beforeEach(() => {
      query = {
        name: 'venusaur'
      };
    });

    test('it should return status response 200: Get detail pokemon', async () => {
      Axios.get.mockImplementation(
        (url) =>
          new Promise((resolve) => {
            if (url === `http://localhost:5000/pokemon/${query.name}`) {
              resolve({ data: MockDetailPokemon });
            } else if (url === `http://localhost:5000/pokemon-species/${MockDetailPokemon.id}`) {
              resolve({ data: MockDetailSpeciesPokemon });
            } else if (url === 'http://localhost:5000/type/grass') {
              resolve({ data: MockTypePokemon });
            } else if (url === 'http://localhost:5000/ability/overgrow') {
              resolve({ data: MockAbilityPokemon });
            }
          })
      );

      await Request(server)
        .get(`/api/pokemon/detail?${QS.stringify(query)}`)
        .expect(200);
    });

    test('it should return status response 200: Get detail pokemon with something went wrong get sub data pokemon', async () => {
      Axios.get.mockImplementation(
        (url) =>
          new Promise((resolve, reject) => {
            if (url === `http://localhost:5000/pokemon/${query.name}`) {
              resolve({ data: MockDetailPokemon });
            } else if (
              url === `http://localhost:5000/pokemon-species/${MockDetailPokemon.id}` ||
              url === 'http://localhost:5000/type/grass' ||
              url === 'http://localhost:5000/ability/overgrow'
            ) {
              reject(new Error('Something went wrong'));
            }
          })
      );

      await Request(server)
        .get(`/api/pokemon/detail?${QS.stringify(query)}`)
        .expect(200)
        .then((res) => {
          expect(_.isEmpty(res.body.listWeakness)).toBeTruthy();
          expect(res.body.desc).toEqual('Unknown');
        });
    });

    test('it should return status response 400: Missing payload', async () => {
      await Request(server).get('/api/pokemon/detail').expect(400);
    });

    test('it should return status response 500: Something went wrong with backend', async () => {
      Axios.get.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      await Request(server)
        .get(`/api/pokemon/detail?${QS.stringify(query)}`)
        .expect(500);
    });
  });

  /*
   * EXPERIMENT
   */
  describe('Get List My Pokemon', () => {
    test('it should return status response 200: Get all list my pokemon', async () => {
      MySQL.executeMock.mockImplementation(
        (opt) =>
          new Promise((resolve) => {
            if (opt === 'SELECT * FROM pokemon;') {
              resolve([MockListMyPokemon]);
            }
          })
      );

      await Request(server)
        .get('/api/pokemon/list-my-pokemon')
        .expect(200)
        .then((res) => {
          expect(!_.isEmpty(res.body)).toBeTruthy();
        });
    });

    test('it should return status response 500: Something went wrong with database', async () => {
      MySQL.executeMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      await Request(server).get('/api/pokemon/list-my-pokemon').expect(500);
    });
  });

  /*
   * EXPERIMENT
   */
  describe('Add Pokemon', () => {
    beforeEach(() => {
      payload = {
        id: '1'
      };
    });

    test('it should return status response 200: Successfully add pokemon', async () => {
      Axios.get.mockImplementation(
        (url) =>
          new Promise((resolve) => {
            if (url === `http://localhost:5000/pokemon-species/${payload.id}`) {
              resolve({ status: 200, data: { capture_rate: 255 } });
            }
          })
      );

      MySQL.executeMock.mockImplementation(
        (opt) =>
          new Promise((resolve) => {
            if (opt === 'INSERT INTO pokemon (id_pokemon, name_pokemon, nickname_pokemon) VALUES (?, ?, ?);') {
              resolve('Success');
            }
          })
      );

      await Request(server)
        .post('/api/pokemon/catch')
        .send(payload)
        .expect(200)
        .then((res) => {
          expect(res.body.isCatchSuccess).toBeTruthy();
        });
    });

    test('it should return status response 200: Something went wrong with API Service', async () => {
      Axios.get.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      MySQL.executeMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      await Request(server)
        .post('/api/pokemon/catch')
        .send(payload)
        .expect(200)
        .then((res) => {
          expect(res.body.isCatchSuccess).toBeFalsy();
        });
    });

    test('it should return status response 400: Missing Payload', async () => {
      await Request(server).post('/api/pokemon/catch').expect(400);
    });

    test('it should return status response 500: Something went wrong with database', async () => {
      Axios.get.mockImplementation(
        (url) =>
          new Promise((resolve) => {
            if (url === `http://localhost:5000/pokemon-species/${payload.id}`) {
              resolve({ status: 200, data: { capture_rate: 255 } });
            }
          })
      );

      MySQL.executeMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      await Request(server).post('/api/pokemon/catch').send(payload).expect(500);
    });
  });

  /*
   * EXPERIMENT
   */
  describe('Update Pokemon', () => {
    beforeEach(() => {
      payload = {
        id: 'ABC123',
        nickname: 'Tester'
      };
    });

    test('it should return status response 200: Successfully update data pokemon', async () => {
      MySQL.executeMock.mockImplementation(
        (opt) =>
          new Promise((resolve) => {
            if (opt === 'UPDATE pokemon SET nickname_pokemon = ? WHERE id_pokemon = ?;') {
              resolve('Success');
            }
          })
      );

      await Request(server)
        .put('/api/pokemon/rename')
        .send(payload)
        .expect(200)
        .then((res) => {
          expect(res.text).toEqual('Success');
        });
    });

    test('it should return status response 400: Missing Payload', async () => {
      await Request(server).put('/api/pokemon/rename').expect(400);
    });

    test('it should return status response 500: Something went wrong with database', async () => {
      MySQL.executeMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      await Request(server).put('/api/pokemon/rename').send(payload).expect(500);
    });
  });

  /*
   * EXPERIMENT
   */
  describe('Delete Pokemon', () => {
    beforeEach(() => {
      payload = {
        id: 'ABC123'
      };
    });

    test('it should return status response 200: Successfully delete data pokemon', async () => {
      MySQL.executeMock.mockImplementation(
        (opt) =>
          new Promise((resolve) => {
            if (opt === 'DELETE FROM pokemon WHERE id_pokemon = ?;') {
              resolve('Success');
            }
          })
      );

      await Request(server)
        .delete('/api/pokemon/release')
        .send(payload)
        .expect(200)
        .then((res) => {
          expect(res.text).toEqual('Success');
        });
    });

    test('it should return status response 400: Missing payload', async () => {
      await Request(server).delete('/api/pokemon/release').expect(400);
    });

    test('it should return status response 500: Something went wrong with database', async () => {
      MySQL.executeMock.mockImplementation(
        () =>
          new Promise((resolve, reject) => {
            reject(new Error('Something went wrong'));
          })
      );

      await Request(server).delete('/api/pokemon/release').send(payload).expect(500);
    });
  });
});

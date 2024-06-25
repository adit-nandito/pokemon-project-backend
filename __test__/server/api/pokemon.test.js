const _ = require('lodash');
const Request = require('supertest');
const MySQL = require('mysql2');
const Axios = require('axios');
const PokemonPlugin = require('../../../server/api/pokemon');
const TestServer = require('../index');

const Mockpokemons = require('../../../__fixtures__/database/pokemon.json');

let server;
let payload;

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
      MySQL.executeMock.mockImplementation(
        (query) =>
          new Promise((resolve) => {
            if (query === 'SELECT * FROM pokemon;') {
              resolve([Mockpokemons]);
            }
          })
      );

      await Request(server)
        .get('/api/pokemon/list-all')
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

      await Request(server).get('/api/pokemon/list-all').expect(500);
    });
  });

  describe('Add Pokemon', () => {
    beforeEach(() => {
      payload = {
        id: '1'
      };
    });

    test('it should return status response 200: Successfully update data pokemon', async () => {
      Axios.get.mockImplementation(
        (url) =>
          new Promise((resolve) => {
            if (url === `https://pokeapi.co/api/v2/pokemon-species/${payload.id}`) {
              resolve({ status: 200, data: { capture_rate: 255 } });
            }
          })
      );

      MySQL.executeMock.mockImplementation(
        (query) =>
          new Promise((resolve) => {
            if (query === 'INSERT INTO pokemon (id_pokemon, name_pokemon, nickname_pokemon) VALUES (?, ?, ?);') {
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
            if (url === `https://pokeapi.co/api/v2/pokemon-species/${payload.id}`) {
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

  describe('Update Pokemon', () => {
    beforeEach(() => {
      payload = {
        id: 'ABC123',
        nickname: 'Tester'
      };
    });

    test('it should return status response 200: Successfully update data pokemon', async () => {
      MySQL.executeMock.mockImplementation(
        (query) =>
          new Promise((resolve) => {
            if (query === 'UPDATE pokemon SET nickname_pokemon = ? WHERE id_pokemon = ?;') {
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

  describe('Delete Pokemon', () => {
    beforeEach(() => {
      payload = {
        id: 'ABC123'
      };
    });

    test('it should return status response 200: Successfully delete data pokemon', async () => {
      MySQL.executeMock.mockImplementation(
        (query) =>
          new Promise((resolve) => {
            if (query === 'DELETE FROM pokemon WHERE id_pokemon = ?;') {
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

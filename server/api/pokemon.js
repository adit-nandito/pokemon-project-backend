const Router = require('express').Router();
const ValidationHelper = require('../helpers/validationHelper');
const PokemonHelper = require('../helpers/pokemonHelper');
const ResponseHandler = require('../handler/errorResponse');

const listPokemon = async (request, reply) => {
  try {
    const response = await PokemonHelper.getListPokemon();
    return reply.send(response);
  } catch (err) {
    return reply.send(ResponseHandler.errorResponse(err));
  }
};
const renamePokemon = async (request, reply) => {
  try {
    ValidationHelper.updatePokemonValidation(request.body);

    const { id, nickname } = request.body;
    const response = await PokemonHelper.updateDataPokemon(id, nickname);

    return reply.send(response);
  } catch (err) {
    return reply.send(ResponseHandler.errorResponse(err));
  }
};

const catchPokemon = async (request, reply) => {
  try {
    ValidationHelper.catchPokemonValidation(request.body);

    const { id } = request.body;
    const response = await PokemonHelper.catchPokemon(id);
    return reply.send(response);
  } catch (err) {
    return reply.send(ResponseHandler.errorResponse(err));
  }
};

const deletePokemon = async (request, reply) => {
  try {
    ValidationHelper.deletePokemon(request.body);

    const { id } = request.body;
    const response = await PokemonHelper.deleteDataPokemon(id);
    return reply.send(response);
  } catch (err) {
    return reply.send(ResponseHandler.errorResponse(err));
  }
};

Router.get('/list-all', listPokemon);
Router.post('/catch', catchPokemon);
Router.put('/rename', renamePokemon);
Router.delete('/release', deletePokemon);

module.exports = Router;

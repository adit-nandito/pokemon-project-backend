const Joi = require('joi');
const Boom = require('@hapi/boom');

const detailPokemonValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required()
  });

  if (schema.validate(data).error) {
    throw Boom.badRequest(schema.validate(data).error);
  }
};

const catchPokemonValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required()
  });

  if (schema.validate(data).error) {
    throw Boom.badRequest(schema.validate(data).error);
  }
};

const updatePokemonValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required(),
    nickname: Joi.string().required()
  });

  if (schema.validate(data).error) {
    throw Boom.badRequest(schema.validate(data).error);
  }
};

const deletePokemon = (data) => {
  const schema = Joi.object({
    id: Joi.string().required()
  });

  if (schema.validate(data).error) {
    throw Boom.badRequest(schema.validate(data).error);
  }
};

module.exports = {
  detailPokemonValidation,
  catchPokemonValidation,
  updatePokemonValidation,
  deletePokemon
};

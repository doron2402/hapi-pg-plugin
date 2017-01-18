'use strict';

const Hoek = require('hoek');
const Joi = require('joi');
let Pg = require('pg');

const HAPI_SERVER_EVENTS = [
  'onRequest',
  'onPreAuth',
  'onPostAuth',
  'onPreHandler',
  'onPostHandler',
  'onPreResponse',
  'tail'
];

const internals = {
  defaults: {
    connectionString: undefined,
    native: false,
    attach: 'onPreHandler',
    detach: 'tail'
  },
  options: Joi.object({
    connectionString: Joi.string().required(),
    native: Joi.boolean().default(false),
    attach: Joi.string().valid(HAPI_SERVER_EVENTS).default('onPreHandler'),
    detach: Joi.string().valid(HAPI_SERVER_EVENTS).default('tail')
  })
};

internals.attachFunc = (config) => {
  return (server, _next) => {
    Pg.connect(config.connectionString, (err, client, done) => {
      if (err) {
        server.log(['pg-plugin'], `Unable to connect to postgres ${JSON.stringify(err)}`);
        return _next(err);
      }
      server.log(['pg-plugin'], 'Connect to Posgres successfully!');
      // server.expose('pgClient',client);
      // server.expose('pgdone', done);
      // server.expose('pgKill', false);
      return _next();
    });
  };
};

exports.register = function (server, options, next) {
  const validateOptions = internals.options.validate(options);
  if (validateOptions.error) {
    return next(validateOptions.error);
  }
  const config = Hoek.clone(internals.defaults);
  Hoek.merge(config, validateOptions.value);

  if (config.native) {
    Pg = require('pg').native;
  }

  server.ext({
    type: config.attach, 
    method: internals.attachFunc(config)
  });

  server.on(config.detach, (request, err) => {
    if (request.server.plugins && request.server.plugins['hapi-pg-plugin'] && request.server.plugins['hapi-pg-plugin'].pgKill) {
      request.server.plugins['hapi-pg-plugin'].pgDone(request.server.plugins['hapi-pg-plugin'].pgKill);
    }
  });

  next();
};


exports.register.attributes = {
  pkg: require('../package.json')
};

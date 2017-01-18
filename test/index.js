'use strict';

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const Proxyquire = require('proxyquire');

const lab = exports.lab = Lab.script();
let server;
const { beforeEach, it, experiment } = lab;
const { expect } = Code;

beforeEach((done) => {
  server = new Hapi.Server();
  server.connection({ port: 0 });
  server.route({
    method: 'GET',
    path: '/',
    handler: (req, reply) => {
      console.log('here');
      console.log(request.server.plugins);
      if (request.server.plugins.pg.query.kill) {
        request.server.plugins.pg.kill = true;
      }
      reply('Test1');
    }
  });
  done();
});


experiment('Hapi Plugin - Postgres', () => {
  experiment('When register the module without connectionString', () => {
    it('Should throw an error', (done) => {
      const Plugin = Proxyquire('../lib', {
        pg: {}
      });
      server.register({
        register: Plugin,
        options: {}
      }, (err) => {
        expect(err).to.match(/ValidationError: child "connectionString" fails/);
        done();
      });
    });
  });
  experiment('When register the module with valid connectionString', () => {
    it('Should not throw an error', (done) => {
      const Plugin = Proxyquire('../lib', {
        pg: {}
      });
      server.register({
        register: Plugin,
        options: {
          connectionString: 'postgres://user:pass@localhost:5432/database'
        }
      }, (err) => {
        expect(err).to.not.exist();
        done();
      });
    });
  });

  experiment('When Postgres connection failed', () => {
    it('Should not throw an error', (done) => {
      const Plugin = Proxyquire('../lib', {
        pg: {
          connect: (options, cb) => {
            cb(Error('connect failed'));
          }
        }
      });
      server.register({
        register: Plugin,
        options: {
          connectionString: 'postgres://user:pass@localhost:5432/database'
        }
      }, (err) => {
        expect(err).to.not.exist();
        server.inject({ method: 'GET', url: '/' }, (response) => {
          expect(response.statusCode).to.equal(500);
          done();
        });
      });
    });
  });

  experiment('When register the module with valid connectionString', () => {
    it('Should not throw an error', (done) => {
      const Plugin = Proxyquire('../lib', {
        pg: {
          connect: (options, cb) => {
            cb(null, {
              query: () => {}
            }, {});
          }
        }
      });
      server.register({
        register: Plugin,
        options: {
          connectionString: 'postgres://user:pass@localhost:5432/database'
        }
      }, (err) => {
        expect(err).to.not.exist();
        server.inject({ method: 'GET', url: '/' }, (response) => {
          expect(response.statusCode).to.equal(500);
          done();
        });
      });
    });
  });
});
  // experiment('When `connectionString` is missing', () => {
  //   it('Should throw an error', (done) => {
  //     const realConnect = stub.pg.connect;

  //     stub.pg.connect = function (connection, callback) {
  //       callback(Error('connect failed'));
  //     };
  //     server.register({
  //       register: Plugin,
  //       options: {}
  //     }, (err) => {
  //       expect(err).to.not.exist();
  //       server.inject(request, (response) => {
  //         expect(response.statusCode).to.equal(500);
  //         stub.pg.connect = realConnect;
  //         done();
  //       });
  //     });
  //   });
  // });
  // experiment('When `connectionString` is valid', () => {
  //   it('Should throw an error', (done) => {
  //     stub.pg.connect = (url) => {
  //       expect(url).to.be.equal('postgres://user:pass@localhost:5432/database');
  //       done();
  //     };
  //     server.register({
  //       register: Plugin,
  //       options: {
  //         connectionString: 'postgres://user:pass@localhost:5432/database'
  //       }
  //     });
  //   });
  // });
  // experiment('When connection fails', () => {
  //   it('Should return an error', (done) => {
  //     stub.pg.connect = (connection, callback) => {
  //       callback('Failed');
  //     };
  //     server.register({
  //       register: Plugin,
  //       options: {
  //         connectionString: 'postgres://user:pass@localhost:5432/database'
  //       }
  //     }, (err) => {
  //       expect(err).to.equal('Failed');
  //       done();
  //     });
  //   });
  // });
// });

// experiment('Postgres Plugin', () => {

//     test('it registers the plugin', (done) => {

//         server.register(Plugin, (err) => {

//             Code.expect(err).to.not.exist();
//             done();
//         });
//     });


//     test('it returns an error when the connection fails in the extension point', (done) => {

//         const realConnect = stub.pg.connect;
//         stub.pg.connect = function (connection, callback) {

//             callback(Error('connect failed'));
//         };

//         server.register(Plugin, (err) => {

//             Code.expect(err).to.not.exist();

//             server.inject(request, (response) => {

//                 Code.expect(response.statusCode).to.equal(500);
//                 stub.pg.connect = realConnect;

//                 done();
//             });
//         });
//     });


//     lab.test('it successfully returns when the connection succeeds in extension point', (done) => {

//         const realConnect = stub.pg.connect;
//         stub.pg.connect = function (connection, callback) {

//             const returnClient = () => {};

//             callback(null, {}, returnClient);
//         };

//         server.register(Plugin, (err) => {

//             Code.expect(err).to.not.exist();

//             server.inject(request, (response) => {

//                 Code.expect(response.statusCode).to.equal(200);
//                 stub.pg.connect = realConnect;

//                 done();
//             });
//         });
//     });


//     lab.test('it successfully cleans up during the server tail event', (done) => {

//         const realConnect = stub.pg.connect;
//         stub.pg.connect = function (connection, callback) {

//             const returnClient = function (killSwitch) {

//                 Code.expect(killSwitch).to.equal(true);
//                 stub.pg.connect = realConnect;

//                 done();
//             };

//             callback(null, {}, returnClient);
//         };

//         server.register(Plugin, (err) => {

//             Code.expect(err).to.not.exist();

//             request.url = '/?kill=true';

//             server.inject(request, (response) => {

//                 Code.expect(response.statusCode).to.equal(200);
//                 stub.pg.connect = realConnect;
//             });
//         });
//     });


//     lab.test('it successfully uses native bindings without error', (done) => {

//         const pluginWithConfig = {
//             register: Plugin,
//             options: {
//                 connectionString: 'postgres://postgres:mysecretpassword@localhost/hapi_node_postgres',
//                 native: true
//             }
//         };

//         server.register(pluginWithConfig, (err) => {

//             Code.expect(err).to.not.exist();

//             server.inject(request, (response) => {

//                 Code.expect(response.statusCode).to.equal(200);
//                 done();
//             });
//         });
//     });
// });

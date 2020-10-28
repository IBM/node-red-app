const chai = require('chai');
const request = require('supertest');

const expect = chai.expect;

const server = require('../../red');

// example functional tests of routes
describe('GET /', () => {
  it('responds with homepage', () => {
    return request(server)
      .get('/')
      .expect('Content-Type', 'text/html; charset=UTF-8')
      .expect(200)
      .then(response => {
        expect(response.text).to.include(
          'Welcome to Node-RED',
        );
      });
  });
});

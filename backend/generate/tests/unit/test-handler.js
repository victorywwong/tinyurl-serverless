'use strict';

const rewire = require('rewire');
const handlerFx = rewire('../../handler.js');
const generateUUID = handlerFx.__get__('generateUUID');
const validateURL = handlerFx.__get__('validateURL');
const saveItemInDB = handlerFx.__get__('saveItemInDB');

const chai = require('chai');
const expect = chai.expect;
const faker = require('faker');
const AWS = require('aws-sdk');
const MOCK = require('aws-sdk-mock');
const sinon = require('sinon');
var event, context;

const deps = {
  // Use sinon.stub(..) to prevent any calls to DynamoDB
  dbClient: sinon.stub(new AWS.DynamoDB.DocumentClient()),
};
const handler = require('../../handler')(deps);

describe('Generate Service', function () {
  describe('Checking URL', function () {
    it('Scenario - validate url with valid url. Expectation - return true', async () => {
      // arrange
      const validURL = faker.internet.url();
      // act
      const result = validateURL(validURL);
      // assert
      expect(result).to.be.true;
    });
    it('Scenario - validate url with false url. Expectation - return false', async () => {
      // arrange
      const invalidURL = faker.lorem.sentence;
      // act
      const result = validateURL(invalidURL);
      // assert
      expect(result).to.be.false;
    });
  });

  describe('Generating uuid', function () {
    it('Scenario - request uuid. Expectation - return uuid', async () => {
      // arrange
      // act
      const result = generateUUID();
      // assert
      expect(result).to.be.an('string');
      expect(result.length).to.not.be.above(22);
    });
  });

  describe('Saving request to DynamoDB and respond', function () {
    afterEach(sinon.reset);
    it('Scenario - valid url request. Expectation - returns null without err', async () => {
      // arrange
      const tableName = 'tinyurl';
      const tinyId = generateUUID();
      const testUrl = faker.internet.url();
      const comment = faker.lorem.text();
      deps.dbClient.put.returns({ promise: sinon.fake.resolves({}) });

      // act
      const response = await saveItemInDB(deps, tableName, tinyId, testUrl);

      // assert
      sinon.assert.calledWith(deps.dbClient.put, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.put,
        sinon.match.has('Item', sinon.match.has('url', testUrl))
      );
      expect(response).to.be.an('object');
    });
    it('Scenario - failed DynamoDB request. Expectation - return err details', async () => {
      // arrange
      const tableName = 'tinyurl';
      const tinyId = generateUUID();
      const testUrl = faker.internet.url();
      const comment = faker.lorem.text();
      deps.dbClient.put.returns({
        promise: sinon.stub().rejects({
          statusCode: 400,
          name: `ResourceNotFoundException`,
          message: `Cannot do operations on a non-existent table`,
        }),
      });

      // act
      const response = await saveItemInDB(deps, tableName, tinyId, testUrl);

      // assert
      sinon.assert.calledWith(deps.dbClient.put, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.put,
        sinon.match.has('Item', sinon.match.has('url', testUrl))
      );
      expect(response).to.be.an('object');
      expect(response.statusCode).to.equal(400);
    });
  });

  describe('Full request with response', function () {
    afterEach(sinon.reset);
    it('Scenario - valid url request. Expectation - returns 200', async () => {
      // arrange
      const testUrl = faker.internet.url();
      const comment = faker.lorem.text();
      const event = {
        body: JSON.stringify({
          url: testUrl,
          comment: comment,
        }),
      };
      deps.dbClient.put.returns({ promise: sinon.fake.resolves('') });

      // act
      const result = await handler(event);
      let response = JSON.parse(result.body);

      // assert
      sinon.assert.calledWith(deps.dbClient.put, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.put,
        sinon.match.has('Item', sinon.match.has('url', testUrl))
      );
      expect(result).to.be.an('object');
      expect(result.headers['Content-Type']).to.equal('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).to.equal('*');
      expect(result.headers['Access-Control-Allow-Credentials']).to.be.true;
      expect(result.statusCode).to.equal(200);
      expect(result.body).to.be.an('string');

      expect(response).to.be.an('object');
      expect(response.tinyId).to.be.an('string');
    });
    it('Scenario - invalid url request. Expectation - returns 422', async () => {
      // arrange
      const testUrl = faker.internet.email;
      const comment = faker.lorem.text();
      const event = {
        body: JSON.stringify({
          url: testUrl,
          comment: comment,
        }),
      };

      // act
      const result = await handler(event);
      let response = JSON.parse(result.body);

      // assert
      expect(result).to.be.an('object');
      expect(result.headers['Content-Type']).to.equal('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).to.equal('*');
      expect(result.headers['Access-Control-Allow-Credentials']).to.be.true;
      expect(result.statusCode).to.equal(422);
      expect(result.body).to.be.an('string');

      expect(response).to.be.an('object');
      expect(response.message).to.be.an('string');
      expect(response.message).to.be.equal('Invalid Url');
    });
    it('Scenario - empty request. Expectation - returns 422', async () => {
      // arrange
      const testUrl = faker.internet.email;
      const comment = faker.lorem.text();
      const event = {
        body: null,
      };

      // act
      const result = await handler(event);
      let response = JSON.parse(result.body);

      // assert
      expect(result).to.be.an('object');
      expect(result.headers['Content-Type']).to.equal('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).to.equal('*');
      expect(result.headers['Access-Control-Allow-Credentials']).to.be.true;
      expect(result.statusCode).to.equal(422);
      expect(result.body).to.be.an('string');

      expect(response).to.be.an('object');
      expect(response.message).to.be.an('string');
      expect(response.message).to.be.equal('Invalid Url');
    });
    it('Scenario - failed DynamoDB request. Expectation - returns 500', async () => {
      // arrange
      const testUrl = faker.internet.url();
      const comment = faker.lorem.text();
      const event = {
        body: JSON.stringify({
          url: testUrl,
          comment: comment,
        }),
      };
      deps.dbClient.put.returns({
        promise: sinon.stub().rejects({
          statusCode: 400,
          name: `ResourceNotFoundException`,
          message: `Cannot do operations on a non-existent table`,
        }),
      });

      // act
      const result = await handler(event);
      let response = JSON.parse(result.body);

      // assert
      sinon.assert.calledWith(deps.dbClient.put, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.put,
        sinon.match.has('Item', sinon.match.has('url', testUrl))
      );
      expect(result).to.be.an('object');
      expect(result.headers['Content-Type']).to.equal('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).to.equal('*');
      expect(result.headers['Access-Control-Allow-Credentials']).to.be.true;
      expect(result.statusCode).to.equal(500);
      expect(result.body).to.be.an('string');

      expect(response).to.be.an('object');
      expect(response.message).to.be.an('string');
    });
    it('Scenario - Internal server error. Expectation - returns 500', async () => {
      // arrange
      const testUrl = faker.internet.url();
      const comment = faker.lorem.text();
      const event = {
        body: JSON.stringify({
          url: testUrl,
          comment: comment,
        }),
      };
      deps.dbClient.put.returns({
        promise: sinon.stub().rejects({
          statusCode: 503,
          name: `ServiceUnavailable`,
          message: `ServiceUnavailable`,
        }),
      });

      // act
      const result = await handler(event);
      let response = JSON.parse(result.body);

      // assert
      sinon.assert.calledWith(deps.dbClient.put, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.put,
        sinon.match.has('Item', sinon.match.has('url', testUrl))
      );
      expect(result).to.be.an('object');
      expect(result.headers['Content-Type']).to.equal('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).to.equal('*');
      expect(result.headers['Access-Control-Allow-Credentials']).to.be.true;
      expect(result.statusCode).to.equal(500);
      expect(result.body).to.be.an('string');

      expect(response).to.be.an('object');
      expect(response.message).to.be.an('string');
    });
  });
});

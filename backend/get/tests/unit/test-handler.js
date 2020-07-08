'use strict';

const rewire = require('rewire');
const handlerFx = rewire('../../handler.js');
const validateTinyId = handlerFx.__get__('validateTinyId');
const generatorFx = rewire('../../../generate/handler.js');
const generateUUID = generatorFx.__get__('generateUUID');
const getItemFromDB = handlerFx.__get__('getItemFromDB');

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

describe('Redirect Service ', function () {
  describe('Checking tinyId', function () {
    it('Scenario - validate valid tinyId. Expectation - return true', async () => {
      // arrange
      const validTinyId = generateUUID();
      console.log('validTinyId', validTinyId);
      // act
      const result = validateTinyId(validTinyId);
      // assert
      expect(result).to.be.true;
    });
    it('Scenario - validate false tinyId. Expectation - return false', async () => {
      // arrange
      const invalidTinyId = faker.lorem.sentence;
      // act
      const result = validateTinyId(invalidTinyId);
      // assert
      expect(result).to.be.false;
    });
  });

  describe('Retrieve item from DynamoDB and respond', function () {
    afterEach(sinon.reset);
    it('Scenario - valid tinyUrl request. Expectation - returns item', async () => {
      // arrange
      const tableName = 'tinyurl';
      const tinyId = generateUUID();
      const resultUrl = faker.internet.url();
      deps.dbClient.get.returns({
        promise: sinon.fake.resolves({ Item: { id: tinyId, url: resultUrl } }),
      });

      // act
      const response = await getItemFromDB(deps, tableName, tinyId);

      // assert
      sinon.assert.calledWith(deps.dbClient.get, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.get,
        sinon.match.has('Key', sinon.match.has('id', tinyId))
      );
      expect(response).to.be.an('object');
      expect(response.url).to.equal(resultUrl);
    });
    it('Scenario - invalid tinyUrl request. Expectation - returns nothing', async () => {
      // arrange
      const tableName = 'tinyurl';
      const tinyId = generateUUID();
      deps.dbClient.get.returns({
        promise: sinon.fake.resolves({ Item: undefined }),
      });

      // act
      const response = await getItemFromDB(deps, tableName, tinyId);

      // assert
      sinon.assert.calledWith(deps.dbClient.get, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.get,
        sinon.match.has('Key', sinon.match.has('id', tinyId))
      );
      expect(response).to.equal(undefined);
    });
    it('Scenario - failed DynamoDB request. Expectation - return err', async () => {
      // arrange
      const tableName = 'tinyurl';
      const tinyId = generateUUID();
      deps.dbClient.get.returns({
        promise: sinon.stub().rejects({
          statusCode: 400,
          name: `ResourceNotFoundException`,
          message: `Cannot do operations on a non-existent table`,
        }),
      });

      // act
      const response = await getItemFromDB(deps, tableName, tinyId);
      console.log('response', response);
      // assert
      sinon.assert.calledWith(deps.dbClient.get, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.get,
        sinon.match.has('Key', sinon.match.has('id', tinyId))
      );
      expect(response).to.be.an('object');
      expect(response.statusCode).to.equal(400);
    });
  });

  describe('Redirect to link on DynamoDB', function () {
    afterEach(sinon.reset);
    it('Scenario - Retrieve url from valid tinyId. Expectation - redirect to url', async () => {
      // arrange
      const tinyId = generateUUID();
      const event = {
        pathParameters: {
          tinyId: tinyId,
        },
      };
      const resultUrl = faker.internet.url();
      deps.dbClient.get.returns({
        promise: sinon.fake.resolves({ Item: { id: tinyId, url: resultUrl } }),
      });

      // act
      const result = await handler(event);
      console.log('result', result);
      // assert
      sinon.assert.calledWith(deps.dbClient.get, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.get,
        sinon.match.has('Key', sinon.match.has('id', tinyId))
      );
      expect(result).to.be.an('object');
      expect(result.headers['Location']).to.be.an('string');
      expect(result.headers['Location']).to.equal(resultUrl);
      expect(result.headers['Access-Control-Allow-Origin']).to.equal('*');
      expect(result.headers['Access-Control-Allow-Credentials']).to.be.true;
      expect(result.statusCode).to.equal(301);
    });
    it('Scenario - Retrieve url from valid syntex but invalid tinyId. Expectation - returns 422', async () => {
      // arrange
      const tinyId = generateUUID();
      const event = {
        pathParameters: {
          tinyId: tinyId,
        },
      };
      deps.dbClient.get.returns({ promise: sinon.fake.resolves({ Item: undefined }) });

      // act
      const result = await handler(event);
      let response = JSON.parse(result.body);
      console.log('result', result);

      // assert
      sinon.assert.calledWith(deps.dbClient.get, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.get,
        sinon.match.has('Key', sinon.match.has('id', tinyId))
      );
      expect(result).to.be.an('object');
      expect(result.headers['Content-Type']).to.equal('application/json');
      expect(result.headers['Access-Control-Allow-Origin']).to.equal('*');
      expect(result.headers['Access-Control-Allow-Credentials']).to.be.true;
      expect(result.statusCode).to.equal(422);
      expect(result.body).to.be.an('string');

      expect(response).to.be.an('object');
      expect(response.message).to.be.an('string');
      expect(response.message).to.be.equal('Invalid tinyId');
    });
    it('Scenario - Retrieve url without tinyId. Expectation - returns 422', async () => {
      // arrange
      const tinyId = faker.random.uuid();
      const event = {
        pathParameters: {},
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
      expect(response.message).to.be.equal('Invalid tinyId');
    });
    it('Scenario - failed DynamoDB request. Expectation - returns 500', async () => {
      // arrange
      const tinyId = generateUUID();
      const event = {
        pathParameters: {
          tinyId: tinyId,
        },
      };
      deps.dbClient.get.returns({
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
      sinon.assert.calledWith(deps.dbClient.get, sinon.match.has('TableName', 'tinyurl'));
      sinon.assert.calledWith(
        deps.dbClient.get,
        sinon.match.has('Key', sinon.match.has('id', tinyId))
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
    it('Scenario - internal server error. Expectation - returns 500', async () => {
      // arrange
      const tinyId = generateUUID();
      const event = {
        pathParameters: {
          tinyId: tinyId,
        },
      };
      deps.dbClient.get.returns({
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

// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
const AWS = require('aws-sdk');
const options = {};
if (process.env.AWS_SAM_LOCAL) {
  (options.region = 'local'), (options.endpoint = 'http://docker.for.mac.localhost:8000');
}

/**
 * Export handler.
 * @param {} dbClient - The dbClient used, either real aws-sdk or mock for testing.
 */
exports.lambdaHandler = require('./handler')({
  dbClient: new AWS.DynamoDB.DocumentClient(options),
});

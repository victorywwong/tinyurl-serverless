const crypto = require('crypto');
const base62 = require('base62/lib/ascii');

/**
 * Validate if URL meets syntax.
 * @param {string} str - The URL to be verified.
 * @returns {boolean} - Validity of str as URL
 */
const validateURL = (str) => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator
  return !!pattern.test(str);
};

/**
 * Generate base62 character uuid.
 * @returns {string} - UUID string
 */
const generateUUID = () => base62.encode(parseInt(crypto.randomBytes(16).toString('hex'), 16));

/**
 * Save item in database.
 * @param {} deps - The dyanmodb client settings.
 * @param {} tableName - The table name.
 * @param {} tinyId - The id used for inserting in the database.
 * @param {} url - The url value to be saved.
 * @returns {} - Response
 * @throws {} - Exception errors
 */
const saveItemInDB = (deps, tableName, tinyId, url) => {
  const params = {
    TableName: tableName, // The name of the DynamoDB table
    Item: {
      // Creating an Item with a unique id and with the passed url information
      id: tinyId,
      url: url,
    },
  };
  return deps.dbClient
    .put(params)
    .promise()
    .then((res) => res)
    .catch((err) => err);
};

/**
 * Define json response.
 * @param {number} statusCode - The statusCode to return.
 * @param {} body - The body to respond users with.
 * @returns {} - Response
 */
const response = (statusCode, body) => ({
  statusCode: statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
  },
  body: JSON.stringify(body, null, 2),
});

/**
 * Validates request, put tinyUrl in database and return results or error.
 * @async
 * @param {} deps - The dbClient used.
 * @param {} event - The event of the accepted json request.
 * @returns {} - Response
 */
module.exports = (deps) => async (event) => {
  const request = event;
  const body = JSON.parse(request.body) || {};
  // Generating uuid
  const tinyId = generateUUID();
  const tableName = process.env.DYNAMO_TABLE || 'tinyurl';
  // Saving request to DynamoDB and respond
  if (request && body && body.url && validateURL(body.url)) {
    try {
      let record = await saveItemInDB(deps, tableName, tinyId, body.url);
      if (record && record.statusCode) {
        const errorMsg = 'DyanmoDB: ' + record.name + ': ' + record.message;
        if (record.statusCode >= 500) throw { message: errorMsg };
        const log = { event: event, response: response(500, { message: errorMsg }) };
        console.warn('WARN: ' + JSON.stringify(log, null, 2));
        return response(500, { message: errorMsg });
      }
      const log = { event: event, response: response(200, { tinyId: tinyId }) };
      console.log('EVENT: ' + JSON.stringify(log, null, 2));
      return response(200, { tinyId: tinyId });
    } catch (err) {
      const log = { event: event, response: response(500, { message: err.message }) };
      console.warn('WARN: ' + JSON.stringify(log, null, 2));
      return response(500, { message: err.message });
    }
  } else {
    const log = { event: event, response: response(422, { message: `Invalid Url` }) };
    console.log('EVENT: ' + JSON.stringify(log, null, 2));
    return response(422, { message: `Invalid Url` });
  }
};

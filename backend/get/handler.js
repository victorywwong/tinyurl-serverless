/**
 * Validate if tinyId meets syntax specified.
 * @param {string} str - The tinyID to be verified.
 * @returns {boolean} - Validity of str as TinyId
 */
const validateTinyId = (str) => {
  const pattern = new RegExp('^[a-zA-Z0-9]{0,22}$', 'i'); // uuidv4 base62
  return !!pattern.test(str);
};

/**
 * Get item in database.
 * @param {} deps - The dyanmodb client settings.
 * @param {} tableName - The table name.
 * @param {} id - The id used to look up item in the database.
 * @returns {} - Response of Item from the database
 * @throws {} - Exception errors
 */
const getItemFromDB = (deps, tableName, id) => {
  const params = {
    TableName: tableName,
    Key: {
      id: id,
    },
  };
  return deps.dbClient
    .get(params)
    .promise()
    .then((res) => res.Item)
    .catch((err) => err);
};

/**
 * Define redirect response.
 * @param {number} statusCode - The statusCode to return.
 * @param {string} url - The url to redirect users to.
 * @returns {} - Redirect
 */
const redirect = (statusCode, url) => ({
  statusCode: statusCode,
  headers: {
    Location: url,
    'Access-Control-Allow-Origin': '*', // Required for CORS support to work
    'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
  },
});

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
 * Accept request, lookup tinyUrl in database and return results or error.
 * @param {} deps - The dbClient used.
 * @param {} event - The event of the accepted json request.
 * @returns {} - Redirect or response
 */
module.exports = (deps) => async (event) => {
  const request = event;

  // Saving request to DynamoDB and respond
  if (
    request &&
    request.pathParameters &&
    request.pathParameters.tinyId &&
    validateTinyId(request.pathParameters.tinyId)
  ) {
    const tinyId = request.pathParameters.tinyId;
    const tableName = process.env.DYNAMO_TABLE || 'tinyurl';

    try {
      let record = await getItemFromDB(deps, tableName, tinyId);
      if (record && record.url) {
        const item = record;
        const log = { event: event, response: redirect(301, item.url) };
        console.log('EVENT: ' + JSON.stringify(log, null, 2));
        return redirect(301, item.url);
      } else {
        if (record && record.statusCode) {
          const errorMsg = 'DyanmoDB: ' + record.name + ': ' + record.message;
          if (record.statusCode >= 500) throw { message: errorMsg };
          const log = { event: event, response: response(500, { message: errorMsg }) };
          console.warn('WARN: ' + JSON.stringify(log, null, 2));
          return response(500, { message: errorMsg });
        }
        const log = { event: event, response: response(422, { message: `Invalid tinyId` }) };
        console.log('EVENT: ' + JSON.stringify(log, null, 2));
        return response(422, { message: `Invalid tinyId` });
      }
    } catch (err) {
      const log = { event: event, response: response(500, { message: err.message }) };
      console.log('WARN: ' + JSON.stringify(log, null, 2));
      return response(500, { message: err.message });
    }
  } else {
    const log = { event: event, response: response(422, { message: `Invalid tinyId` }) };
    console.log('EVENT: ' + JSON.stringify(log, null, 2));
    return response(422, { message: `Invalid tinyId` });
  }
};

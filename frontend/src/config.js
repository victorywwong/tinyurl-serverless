// The deployment system does string substitution on variables within ${} prior to
// uploading the website to S3.
export const API_ROOT = '${BACKEND_ENDPOINT}'.includes('${')
  ? 'https://a.tinyurl.tech'
  : 'https://' + '${BACKEND_ENDPOINT}' + '/Prod';

// The deployment system does string substitution on variables within ${} prior to
// uploading the website to S3.
export const API_ROOT = '${BACKEND_ENDPOINT}'.includes('execute-api')
  ? '${BACKEND_ENDPOINT}'
  : 'https://s.tinyurl.tech';

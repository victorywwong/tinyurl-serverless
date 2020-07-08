import axios from 'axios';
import { API_ROOT } from '../config';

export default {
  generate: async (request) => {
    const url = request.url;
    const comment = request.comment || '';
    const requestUrl = `${API_ROOT}` + '/generate';
    return await axios.post(requestUrl, {
      url: url,
      comment: comment,
    });
  },
};

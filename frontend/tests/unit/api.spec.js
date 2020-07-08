import api from '@/api/api.js';
import axios from 'axios';
import faker from 'faker';

jest.mock('axios');

describe('apiCall', () => {
  it('post successfully data to GenerateTinyUrlApi', async () => {
    const request = {
      url: faker.internet.url(),
      comment: faker.lorem.text(),
    };
    const response = {
      tinyId: '37cf554da0c54f3340498bbac20d9cae',
    };
    axios.post.mockImplementationOnce(() => Promise.resolve(response));

    await expect(api.generate(request)).resolves.toEqual(response);
  });
  it('failed posting to GenerateTinyUrlApi', async () => {
    const request = {
      url: faker.internet.url(),
      comment: faker.lorem.text(),
    };
    const response = {
      tinyId: '37cf554da0c54f3340498bbac20d9cae',
    };
    const errorMessage = 'Network Error';
    axios.post.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));

    await expect(api.generate(request)).rejects.toThrow(errorMessage);
  });
  it('post successfully data without comment to GenerateTinyUrlApi', async () => {
    const request = {
      url: faker.internet.url(),
    };
    const response = {
      tinyId: '37cf554da0c54f3340498bbac20d9cae',
    };
    axios.post.mockImplementationOnce(() => Promise.resolve(response));

    await expect(api.generate(request)).resolves.toEqual(response);
  });
});

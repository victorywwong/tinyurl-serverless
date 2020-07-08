import { createLocalVue, mount } from '@vue/test-utils';
import faker from 'faker';
import sinon from 'sinon';
import Shortener from '@/components/Shortener.vue';
import axios from 'axios';

jest.mock('axios');

describe('Shortener.vue', () => {
  describe('validateURL', () => {
    it('Scenario - input valid url. Expectation - Button enabled', () => {
      const url = faker.internet.url();
      const localThis = { url: url };

      expect(Shortener.computed.validateURL.call(localThis)).toBe(true);
    });
    it('Scenario - input invalid url. Expectation - Button enabled', () => {
      const url = faker.internet.email();
      const localThis = { url: url };

      expect(Shortener.computed.validateURL.call(localThis)).toBe(false);
    });
  });
  describe('resetMessage', () => {
    it('Scenario - reset message. Expectation - Message reset', () => {
      const localVue = createLocalVue();
      const wrapper = mount(Shortener, { localVue });
      wrapper.setData({ message: 'Something else' });
      expect(wrapper.vm.message).toBe('Something else');
      wrapper.vm.resetMessage();
      expect(wrapper.vm.message).toBe('Enter link to shorten here...');
    });
  });
  describe('reset', () => {
    it('Scenario - reset url. Expectation - reset url', () => {
      const testUrl = faker.internet.url();
      const testShortened = faker.internet.url();
      const localVue = createLocalVue();
      const wrapper = mount(Shortener, { localVue });
      wrapper.setData({ url: testUrl, shortened: testShortened });
      expect(wrapper.vm.url).toBe(testUrl);
      expect(wrapper.vm.shortened).toBe(testShortened);
      wrapper.vm.reset();
      expect(wrapper.vm.url).toBe('');
      expect(wrapper.vm.shortened).toBe('');
    });
  });
  describe('handleInput', () => {
    it('Scenario - url entered. Expectation - Value updated', () => {
      const testUrl = faker.internet.url();
      const afterUrl = faker.internet.url();
      const event = { target: { value: afterUrl } };
      const localVue = createLocalVue();
      const wrapper = mount(Shortener, { localVue });
      wrapper.setData({ url: testUrl });
      expect(wrapper.vm.url).toBe(testUrl);
      wrapper.vm.handleInput(event);
      expect(wrapper.vm.url).toBe(afterUrl);
    });
  });
  describe('handleOnCopy', () => {
    it('Scenario - on copying shortened url. Expectation - reset', async () => {
      const localVue = createLocalVue();
      const wrapper = mount(Shortener, { localVue });
      const resetStub = sinon.stub();
      const resetMessageStub = sinon.stub();

      wrapper.setMethods({ reset: resetStub });
      wrapper.setMethods({ resetMessage: resetMessageStub });
      await wrapper.vm.handleOnCopy();
      expect(resetStub.called).toBe(true);
      expect(resetMessageStub.called).toBe(true);
    });
  });
  describe('showShortened', () => {
    it('Scenario - short provided. Expectation - Value of shortened updated', () => {
      const testUrl = faker.internet.url();
      const afterUrl = faker.internet.url();
      const localVue = createLocalVue();
      const wrapper = mount(Shortener, { localVue });
      wrapper.setData({ shortened: testUrl });
      expect(wrapper.vm.shortened).toBe(testUrl);
      wrapper.vm.showShortened(afterUrl);
      expect(wrapper.vm.shortened).toBe(afterUrl);
    });
  });
  describe('generateLink', () => {
    it('Scenario - generate link API request success. Expectation - update shortened value', async () => {
      const localVue = createLocalVue();
      const wrapper = mount(Shortener, { localVue });
      const showShortenedStub = sinon.stub();
      const testUrl = faker.internet.url();
      const localThis = { url: testUrl };
      axios.post.mockResolvedValue({ data: { tinyId: '37cf554da0c54f3340498bbac20d9cae' } });

      wrapper.setMethods({ showShortened: showShortenedStub });
      await wrapper.vm.generateLink.call(localThis);
      expect(showShortenedStub.called).toBe(true);
    });
    it('Scenario - generate link API request failure. Expectation - reset shortened value', async () => {
      const localVue = createLocalVue();
      const wrapper = mount(Shortener, { localVue });
      const resetStub = sinon.stub();
      const testUrl = faker.internet.url();
      const tinyId = '37cf554da0c54f3340498bbac20d9cae';
      const localThis = { url: testUrl };
      axios.post.mockRejectedValue({
        message: 'Request failed with status code 422',
        name: 'Error',
      });

      wrapper.setMethods({ reset: resetStub });
      await wrapper.vm.generateLink.call(localThis);
      expect(resetStub.called).toBe(true);
    });
  });
});

import { createLocalVue, mount } from '@vue/test-utils';
import faker from 'faker';
import sinon from 'sinon';
import Copier from '@/components/Copier.vue';

document.execCommand = jest.fn();

describe('Copier.vue', () => {
  describe('copy', () => {
    it('Scenario - copy content. Expectation - call browser document', async () => {
      const what = faker.internet.url();
      const oncopy = sinon.stub();
      const localVue = createLocalVue();
      const wrapper = mount(Copier, { propsData: { what, oncopy }, localVue });
      wrapper.vm.copy();

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(wrapper.find('textarea').exists()).toBe(false);
      expect(oncopy.called).toBe(true);
    });
    it('Scenario - copy content without oncopy. Expectation - call browser document', async () => {
      const what = faker.internet.url();
      const oncopy = null;
      const localVue = createLocalVue();
      const wrapper = mount(Copier, { propsData: { what, oncopy }, localVue });
      const localThis = { oncopy: null };
      wrapper.vm.copy.call(localThis);

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(wrapper.find('textarea').exists()).toBe(false);
      expect(!wrapper.props().oncopy).toBe(true);
    });
  });
});

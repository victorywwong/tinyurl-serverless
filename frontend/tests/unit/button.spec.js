import { mount } from '@vue/test-utils';
import sinon from 'sinon';
import Button from '@/components/Button.vue';

describe('Button.vue', () => {
  it('disabled buttons are disabled', () => {
    const disabled = true;
    const onclick = sinon.stub();
    const wrapper = mount(Button, {
      propsData: { onclick, disabled },
    });

    expect(wrapper.find('button').element.disabled).toBe(true);
  });
  it('Active button click triggers onclick function', async () => {
    const disabled = false;
    const onclick = sinon.stub();
    const wrapper = mount(Button, {
      propsData: { onclick, disabled },
    });

    const button = wrapper.find('button');
    await button.trigger('click');

    expect(wrapper.find('button').element.disabled).toBe(false);
    expect(onclick.called).toBe(true);
  });
});

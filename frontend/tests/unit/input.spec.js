import { mount } from '@vue/test-utils';
import sinon from 'sinon';
import faker from 'faker';
import Input from '@/components/Input.vue';

describe('Input.vue', () => {
  it('have props', () => {
    const val = faker.internet.email();
    const onchange = sinon.stub();
    const autofocused = true;
    const valid = false;
    const kind = 'text';
    const wrapper = mount(Input, {
      propsData: { val, onchange, autofocused, valid, kind },
    });

    expect(wrapper.props().val).toBe(val);
    expect(wrapper.props().autofocused).toBe(autofocused);
    expect(wrapper.props().valid).toBe(valid);
    expect(wrapper.props().kind).toBe(kind);
  });
  it('input bare class input--invalid if valid is false', () => {
    const val = faker.internet.email();
    const onchange = sinon.stub();
    const autofocused = true;
    const valid = false;
    const kind = 'text';
    const wrapper = mount(Input, {
      propsData: { val, onchange, autofocused, valid, kind },
    });
    const input = wrapper.find('input');

    expect(input.classes('input--invalid')).toBe(true);
  });
  it('Typing input triggers onchange function', async () => {
    const val = faker.internet.url();
    const onchange = sinon.stub();
    const autofocused = true;
    const valid = true;
    const kind = 'text';
    const wrapper = mount(Input, {
      propsData: { val, onchange, autofocused, valid, kind },
    });

    const input = wrapper.find('input');
    input.element.value = faker.internet.url();
    input.trigger('input');

    expect(onchange.called).toBe(true);
  });
});

<template>
  <div @click="copy">
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    what: {
      type: String,
      required: true,
    },
    oncopy: {
      type: Function,
      required: false,
    },
  },
  methods: {
    copy: function () {
      var el;
      el = document.createElement('textarea');
      el.value = this.what;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      if (this.oncopy) {
        return this.oncopy();
      }
    },
  },
};
</script>

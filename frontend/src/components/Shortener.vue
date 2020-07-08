<template>
  <div class="shortener">
    <div class="shortened" v-if="shortened">
      <Copier :what="shortened" :oncopy="handleOnCopy"
        >Click to copy! Tiny URL: {{ shortened }}</Copier
      >
    </div>
    <div class="shortened" v-else>{{ message }}</div>
    <div class="input-wrapper">
      <Input
        :val="url"
        :autofocus="true"
        :onchange="handleInput"
        kind="text"
        :valid="validateURL"
      />
    </div>
    <div class="button-wrapper">
      <Button :onclick="generateLink" :disabled="!validateURL">Generate</Button>
    </div>
  </div>
</template>

<script>
import api from '../api/api';
import Input from './Input';
import Button from './Button';
import Copier from './Copier';
import { API_ROOT } from '../config';

let fallback = {
  message: 'Enter link to shorten here...',
  url: '',
  shortened: '',
};
export default {
  data: function () {
    return Object.assign({}, fallback);
  },
  components: {
    Input: Input,
    Button: Button,
    Copier: Copier,
  },
  computed: {
    validateURL: function () {
      const pattern = new RegExp(
        '^(https?:\\/\\/)?' + // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
          '(\\#[-a-z\\d_]*)?$',
        'i'
      ); // fragment locator
      return !!pattern.test(this.url);
    },
  },
  methods: {
    resetMessage: function () {
      return (this.message = fallback.message);
    },
    reset: function () {
      this.shortened = fallback.shortened;
      return (this.url = fallback.url);
    },
    handleInput: function (e) {
      return (this.url = e.target.value);
    },
    handleOnCopy: function () {
      var vm = this;
      vm.reset();
      return new Promise((resolve) => {
        vm.message = 'Link is copied';
        setTimeout(() => resolve(), 2000);
      }).then(vm.resetMessage());
    },
    showShortened: function (short) {
      return (this.shortened = short);
    },
    generateLink: function () {
      var vm = this;
      return api
        .generate({
          url: this.url,
        })
        .then(function (response) {
          // handle success
          return vm.showShortened(API_ROOT + '/' + response.data.tinyId);
        })
        .catch(function (error) {
          error = JSON.stringify(error);
          // handle error
          console.log(error);
          return vm.reset();
        });
    },
  },
};
</script>

<style lang="stylus" scoped>
.shortened {
  margin-bottom: 20px;
  width: 100%;
}
.input-wrapper {
  margin-bottom: 20px;
  width: 100%;
}
.button-wrapper {
  margin-bottom: 20px;
  width: 100%;
}
</style>

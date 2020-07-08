<template>
  <div id="app">
    <Shortener />
  </div>
</template>

<script>
import Shortener from './components/Shortener.vue';
export default {
  name: 'App',
  components: {
    Shortener,
  },
};
</script>

<style>
#app {
  font-family: 'Open-Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  min-height: 100vh;
  justify-content: center;
  display: flex;
  align-items: center;
}
body {
  margin: 0;
  padding: 0;
  font-family: 'Open-Sans', sans-serif;
}
</style>

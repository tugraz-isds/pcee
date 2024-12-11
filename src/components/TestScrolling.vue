<template>
  <div>
    <input type="file" @change="uploadFile" />
    <button @click="drawChart">Draw Chart</button>
  </div>

  <div id="app">
    <div class="main">
      <div class="main__graphic">{{ currStep }}</div>
      <VueScrollama
        :debug="true"
        :offset="0.55"
        @step-enter="({ element }) => (currStep = element.dataset.stepNo)"
        class="main__scrollama"
      >
        <div class="step" data-step-no="1">Step 1</div>
        <div class="step" data-step-no="2">Step 2</div>
        <div class="step" data-step-no="3">Step 3</div>
      </VueScrollama>
    </div>
  </div>
</template>

<script setup>
import VueScrollama from 'vue3-scrollama'
import { ref } from 'vue'
import * as spcd3 from '../spcd3'

let currStep = ref(null)

// Test Upload File and Read File
const file = ref(null)

const uploadFile = (event) => {
  file.value = event.target.files[0]
}

const drawChart = async () => {
  const reader = new FileReader()
  reader.readAsText(file.value)
  reader.onload = async () => {
    const fileString = reader.result
    const data = {
      file: fileString
    }
    let newData = spcd3.loadCSV(data.file)
    spcd3.drawChart(newData)
  }
}
</script>

<style>
.intro,
.outro {
  padding: 8rem;
}

.main__graphic {
  position: sticky;
  top: 0;
  height: 20rem;
  width: 20rem;
  border: 1px solid #ccc;
  background-color: #eee;
  font-size: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step {
  padding: 15vh 0;
  width: 50%;
  margin: 0 auto 30vh;
  background-color: beige;
  border: 1px solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

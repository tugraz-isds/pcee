<template>
  <div>
    <div id="parallelcoords" class="mainChart"></div>
    <VueScrollama
      :debug="true"
      :offset="0.55"
      @step-enter="handleStepEnter"
      class="main__scrollama"
    >
      <div class="step" data-step-no="1">Toggle Selection</div>
      <div class="step" data-step-no="2">Move Dimensions</div>
      <div class="step" data-step-no="3">None</div>
      <div class="step" data-step-no="4">None</div>
    </VueScrollama>
  </div>
</template>

<script setup>
import VueScrollama from 'vue3-scrollama'
import * as spcd3 from '../spcd3'
import { onMounted } from 'vue'

const exampleData =
  'Name,Maths,English,PE,Art,History,IT,Biology,German\nAdrian,95,24,82,49,58,85,21,24\nAmelia,92,98,60,45,82,85,78,92\nBrooke,27,35,84,45,23,50,15,22\nChloe,78,9,83,66,80,63,29,12\nDylan,92,47,91,56,47,81,60,51\nEmily,67,3,98,77,25,100,50,34\nEvan,53,60,97,74,21,78,72,75\nFinn,42,73,65,52,43,61,82,85\nGia,50,81,85,80,43,46,73,91\nGrace,24,95,98,94,89,25,91,69\nHarper,69,9,97,77,56,94,38,2\nHayden,2,72,74,53,40,40,66,64\nIsabella,8,99,84,69,86,20,86,85\nJesse,63,39,93,84,30,71,86,19\nJordan,11,80,87,68,88,20,96,81\nKai,27,65,62,92,81,28,94,84\nKaitlyn,7,70,51,77,79,29,96,73\nLydia,75,49,98,55,68,67,91,87\nMark,51,70,87,40,97,94,60,95\nMonica,62,89,98,90,85,66,84,99\nNicole,70,8,84,64,26,70,12,8\nOswin,96,14,62,35,56,98,5,12\nPeter,98,10,71,41,55,66,38,29\nRenette,96,39,82,43,26,92,20,2\nRobert,78,32,98,55,56,81,46,29\nSasha,87,1,84,70,56,88,49,2\nSylvia,86,12,97,4,19,80,36,8\nThomas,76,47,99,34,48,92,30,38\nVictor,5,60,70,65,97,19,63,83\nZack,19,84,83,42,93,15,98,95'

//const introExampleData = 'A,B,C\n10,20,15\n10,30,30\n20,15,10\n30,10,20\n'

const initialize = () => {
  let newData = spcd3.loadCSV(exampleData)
  spcd3.drawChart(newData)
}

onMounted(() => initialize())

const handleStepEnter = (element) => {
  if (element.index == 0) {
    spcd3.toggleSelection('Kai')
  } else if (element.index == 1 && element.direction == 'down') {
    spcd3.moveByOne('Maths', 'right')
  } else if (element.index == 1 && element.direction == 'up') {
    spcd3.moveByOne('Maths', 'left')
  }
}
</script>

<style>
.mainChart {
  position: sticky;
  top: 0;
  margin-top: 10rem;
  height: 20rem;
  width: 40rem;
  background-color: #fff;
  font-size: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step {
  padding: 10rem 0;
  width: 20rem;
  margin: 0 auto 5rem;
  background-color: beige;
  border: 0.1rem solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

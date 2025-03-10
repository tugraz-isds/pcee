<template>
    <div class="explorable-explainer">
      <div class="content">
        <div id="parallelcoords" class="mainChart"></div>
        <div class="textContent">
          <VueScrollama
            :debug="true"
            @step-enter="handleStepEnter"
            class="main__scrollama"
          >
            <div class="intro">
              <h1>Parallel Coordinates</h1>
              <h1>An Explorable Explainer</h1>
              <h3>By Romana Gruber</h3>
            </div>
            <div class="mainText">
              <h2>1. Introduction</h2>
              <div v-html="fullIntro"></div>
            </div>
            <div class="mainText">
              <h2>2. Multidimensional Data</h2>
              <div v-html="fullData"></div>
              <table border="1">
              <thead>
                <tr>
                  <th v-for="(column, index) in columns" :key="index">{{ 
                    column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in tableData" :key="rowIndex">
                  <td v-for="(column, colIndex) in columns" :key="colIndex">
                    <input v-model="row[column]" type="text" />
                  </td>
                </tr>
              </tbody>
              </table>
              <button @click="addRow" id="addButton">Add Row</button>
              <button @click="addColumn">Add Column</button>
              <button @click="redrawChart">Redraw Chart</button>
            </div>
            <div class="mainText">
              <h2>3. Interactive Data Exploration</h2>
              <div v-html="fullInteractivity"></div>
            </div>
          </VueScrollama>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import * as spcd3 from '../spcd3'
  import VueScrollama from 'vue3-scrollama';

  const introText = ref([]);
  const dataText = ref([]);
  const interactivityText = ref([]);

  const fullIntro = computed(() => introText.value.join(' '));
  const fullData = computed(() => dataText.value.join(' '));
  const fullInteractivity = computed(() => interactivityText.value.join(' '));

  const addRow = () => {
    const newRow = {};
    columns.value.forEach((column) => {
      newRow[column] = '';
    });
    tableData.value.push(newRow);
  };

  const addColumn = () => {
    const newColumnName = prompt('Enter new column name:');
    if (newColumnName) {
      columns.value.push(newColumnName);
      tableData.value.forEach((row) => {
        row[newColumnName] = '';
      });
    }
  };

  const redrawChart = () => {
    const headers = columns.value.join(','); 

    const rows = tableData.value.map(row => {
      return columns.value.map(column => row[column]).join(',');
    }).join('\n');

    const csvData = `${headers}\n${rows}`;
    let newData = spcd3.loadCSV(csvData);
    spcd3.drawChart(newData);
  };

  const columns = ref(['Car', 'Speed', 'FuelEfficiency', 'Weight', 'Price']);

  const tableData = ref([
    { Car: 'Car A', Speed: 180, FuelEfficiency: 8, Weight: 1500, Price: 25 },
    { Car: 'Car B', Speed: 200, FuelEfficiency: 7.5, Weight: 1400, Price: 28 },
    { Car: 'Car C', Speed: 160, FuelEfficiency: 9, Weight: 1600, Price: 22 },
    { Car: 'Car D', Speed: 190, FuelEfficiency: 8.5, Weight: 1450, Price: 27 },
    { Car: 'Car E', Speed: 170, FuelEfficiency: 10, Weight: 1550, Price: 20 },
    { Car: 'Car F', Speed: 210, FuelEfficiency: 7, Weight: 1300, Price: 30 }
  ]);

  const loadContent = async (textArray, filePath) => {
    try {
      const response = await fetch(filePath);
      const data = await response.text();
      textArray.value = data.split('\n');
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const drawChart = async () => {
    try {
      const response = await fetch('/data/cars.csv');
      const csv = await response.text();
      let newData = spcd3.loadCSV(csv);
      spcd3.drawChart(newData);
    } catch (error) {
        console.error('Error drawing data:', error);
    }
  };

  const handleStepEnter = (element) => {
    if (element.index == 1 && element.direction == 'down') {
      spcd3.setInversionStatus('Speed', 'descending');
    } else if (element.index == 2 && element.direction == 'down') {
      spcd3.swap('Speed', 'Fuel Efficiency');
    } else if (element.index == 3 && element.direction == 'down') {
      spcd3.hide('Price');
    } else if (element.index == 4 && element.direction == 'down') {
      spcd3.setDimensionRange('Fuel Efficiency', 0, 15);
    } else if (element.index == 5 && element.direction == 'down') {
      spcd3.setFilter('Fuel Efficiency', 5, 10);
    } else if (element.index == 6 && element.direction == 'down') {
      spcd3.setSelected('Car C');
    } /*else if (element.index == 5 && element.direction == 'up') {
      spcd3.toggleSelection('Delta')
    }*/
  };

  onMounted(() => {
    loadContent(introText, '/content/introduction.txt');
    loadContent(dataText, 'content/data.txt')
    loadContent(interactivityText, 'content/interactivity.txt')
    drawChart();
  });
</script>
  
<style>
.explorable-explainer {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
  font-family: Verdana, Geneva, Tahoma, sans-serif;
  font-size: medium;
  line-height: 2;
}
  
.content {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  /*background-color: rgba(255, 255, 0, 0.3);*/
}
  
.mainChart {
  width: 45rem;
  height: 50rem;
  background-color: white;
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 3rem;
}

.textContent {
  width: 45rem;
  padding: 2rem;
}
  
.mainText {
  text-align: justify;
  padding-top: 3rem;
  padding-right: 3rem;
}

h2 {
  color: rgba(0, 129, 175, 0.5);
}

h4 {
  padding-left: 2rem;
}

p {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
  padding-left: 1rem;
}

p:hover {
  border-color: rgba(0, 129, 175, 0.5);
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-left: 2rem;
}

th, td {
  padding: 0.2rem;
  text-align: left;
}

th {
  background-color: rgba(0, 129, 175, 0.3);
}

td {
  background-color: rgba(255, 255, 0, 0.3);
}

ul {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
  padding-left: 1rem;
}

ul:hover {
  border-color: rgba(0, 129, 175, 0.5);
}

button {
  padding: 0.5rem;
  margin-top: 0.5rem;
  margin-right: 0.5rem;
}

#addButton {
  margin-left: 2rem;
}

input {
  width: 100%;
  padding: 0.313rem;
  box-sizing: border-box;
}
  
@media (max-width: 40rem) {
  .content {
    flex-direction: column;
  }
  .mainChart {
    width: 100%;
    height: 16rem;
  }
  .textContent {
    width: 100%;
  }
}
</style>
  
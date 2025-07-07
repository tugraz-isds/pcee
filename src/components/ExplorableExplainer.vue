<template>
  <div class="sticky-header">
    <div>
      Parallel Coordinates:<br>
      An Explorable Explainer</div> 
  </div>

  <div class="header-spacer"></div>

  <div class="explorable-explainer">
    <div class="chart-container" ref="textArea">
      <div id="parallelcoords" class="main-chart"></div>
    </div>     
    <div class="text-container">
      <div v-html="introText"></div>
      <div v-html="dataText"></div>
      <div v-html="healthDatasetText"></div>
      
      <div class="table-container">
        <p>
          <!--<button @click="toggleTable">
            {{ showTable ? 'Hide Heart Health Data' : 'Show Heart Health Data' }}
          </button>-->
        </p>
        <div v-if="showTable">
        <table border="1">
        <thead>
        <tr>
        <th v-for="column in columns" :key="column.key">{{ column.label }}
        </th>
        <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
        <td v-for="column in columns" :key="column.key">
        <input v-model="row[column.key]" type="text"/>
        </td>
        <td>
        <button class="delete-button" @click="deleteRow(rowIndex)">Delete</button>
        </td>
        </tr>
        </tbody>
        <tfoot>
        <tr>
        <td v-for="column in columns" :key="column.key">
        <button class="delete-button" @click="deleteColumn(column.key)">Delete {{ column.label }}
        </button>
        </td>
        <td></td>
        </tr>
        </tfoot>
        </table>
        <button @click="addRow">Add Row</button>
        <button @click="openModal">Add Column</button>
        <button @click="redrawChart" :disabled="!isFormValid">Redraw Chart
        </button>
        <button @click="resetTable">Reset Table</button>
        <div v-if="isModalOpen" class="modal">
        <div class="modal-content">
        <div>Add new column name:</div>
        <input v-model="newColumn" type="text"
        placeholder="Enter column name..." />
        <button class="add-button" @click="addColumn">Add</button>
        <button class="add-button" @click="closeModal">Cancel</button>
        </div>
        </div>
      </div>
      </div>
      
      <div class="trigger" v-html="interactivityText" ref="trigger"></div>
      <div class="trigger" v-html="usageText" ref="trigger"></div>
      <div class="trigger" v-html="caseStudy1Text" ref="trigger"></div>
      <!--<div class="table-container">
        <p>
          <button @click="toggleStudentDataTable">
            {{ showStudentData ? 'Hide Student Marks Data' : 'Show Student Marks Data' }}
          </button>
        </p>
        <div v-if="showStudentData">
        <table border="1">
        <thead>
        <tr>
        <th v-for="column in columnsStudent" :key="column.key">{{ column.label }}
        </th>
        <th></th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(row, rowIndex) in rowsStudent" :key="rowIndex">
        <td v-for="column in columnsStudent" :key="column.key">
        <input v-model="row[column.key]" type="text"/>
        </td>
        <td>
        <button class="delete-button" @click="deleteRow(rowIndex)">Delete</button>
        </td>
        </tr>
        </tbody>
        <tfoot>
        <tr>
        <td v-for="column in columnsStudent" :key="column.key">
        <button class="delete-button" @click="deleteColumn(column.key)">Delete {{ column.label }}
        </button>
        </td>
        <td></td>
        </tr>
        </tfoot>
        </table>
        <button @click="addRow">Add Row</button>
        <button @click="openModal">Add Column</button>
        <button @click="redrawChart" :disabled="!isFormValid">Redraw Chart
        </button>
        <div v-if="isModalOpen" class="modal">
        <div class="modal-content">
        <div>Add new column name:</div>
        <input v-model="newColumn" type="text"
        placeholder="Enter column name..." />
        <button class="add-button" @click="addColumn">Add</button>
        <button class="add-button" @click="closeModal">Cancel</button>
        </div>
        </div>     
      </div>
      </div>-->
      <div class="trigger" v-html="caseStudy2Text" ref="trigger"></div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, nextTick, watch } from 'vue';
  import * as spcd3 from '../spcd3.js';
  import scrollama from 'scrollama';
  import { originalColumns, originalRows, columnsStudent, rowsStudent } from '../data.js';

  const introText = ref('');
  const dataText = ref('');
  const interactivityText = ref('');
  const usageText = ref('');
  const caseStudy1Text = ref('');
  const caseStudy2Text = ref('');
  const healthDatasetText = ref('');
  const studentDatasetText = ref('');
  const textArea = ref(null);
  const trigger = ref(null);
  const healthDataset = ref('');
  const studentDataset = ref('');
  const isModalOpen = ref(false);
  const newColumn = ref('');
  const showTable = ref(true);
  const showStudentData = ref(false);
  const columns = ref(structuredClone(originalColumns));
  const rows = ref(structuredClone(originalRows));
  const scroller = scrollama();
  let lastStep = -1;

  function toggleTable() {
    showTable.value = !showTable.value
  }

  function toggleStudentDataTable() {
    showStudentData.value = !showStudentData.value;
  }

  const addClickEvent = () => {
    const outlierButton = document.getElementById('outlier-button');
    if (outlierButton) {
      outlierButton.addEventListener('click', selectOutlier);
    }
    const correlationButton = document.getElementById('correlation-button');
    if (correlationButton) {
      correlationButton.addEventListener('click', showPositiveCorrelation);
    }
    const negCorrelationButton = document.getElementById('correlation-neg-button');
    if (negCorrelationButton) {
      negCorrelationButton.addEventListener('click', showNegativeCorrelation);
    }
    const rangeButton = document.getElementById('range-button');
    if (rangeButton) {
      rangeButton.addEventListener('click', setRange);
    }
    const selectButton = document.getElementById('select-button');
    if (selectButton) {
      selectButton.addEventListener('click', selectRecord);
    }
    const filterButton = document.getElementById('filter-button');
    if (filterButton) {
      filterButton.addEventListener('click', filterRecords);
    }
    const moveButton = document.getElementById('move-button');
    if (moveButton) {
      moveButton.addEventListener('click', moveDimension);
    }
    const invertButton = document.getElementById('invert-button');
    if (invertButton) {
      invertButton.addEventListener('click', invertDimension);
    }
  }

  const selectOutlier = () => {
    if (spcd3.isSelected('Patient F')) {
      spcd3.setUnselected('Patient F')
      document.getElementById('outlier-button').textContent = 'Show outlier';
    }
    else {
      spcd3.setSelected('Patient F');
      document.getElementById('outlier-button').textContent = 'Hide outlier';
    }
  };

  const showPositiveCorrelation = () => {
    if (spcd3.getInversionStatus('Age') == 'descending')
    {
      spcd3.setInversionStatus('Age', 'ascending');
      spcd3.hideMarker('Age');
    }
    else
    {
      spcd3.setInversionStatus('Age', 'descending');
      spcd3.showMarker('Age');
    }
  }

  const showNegativeCorrelation = () => {
    const posFitness = spcd3.getDimensionPosition('Fitness Score');
    const posAge = spcd3.getDimensionPosition('Age');
    const diff = posAge - posFitness;
    if (diff == 1) {
      document.getElementById('correlation-neg-button').textContent = 'Move Fitness Score next to Age';
    }
    else {
      document.getElementById('correlation-neg-button').textContent = 'Fitness Score: Reset position';    
    }
    spcd3.swap('Fitness Score', 'Blood Pressure');
  }

  const setRange = () => {
    const currentRange = spcd3.getDimensionRange('PE');
    if (currentRange[0] == 51) {
      const dimensions = spcd3.getAllDimensionNames();
      dimensions.forEach(function(dimension) {
        if (!isNaN(spcd3.getMinValue(dimension))) {
          spcd3.setDimensionRange(dimension, 0, 100);
        }
      });
      document.getElementById('range-button').textContent = 'Set dimension ranges from data';
    }
    else {
      const dimensions = spcd3.getAllDimensionNames();
      dimensions.forEach(function(dimension) {
        if (!isNaN(spcd3.getMinValue(dimension))) {
            let min = spcd3.getMinValue(dimension);
            let max = spcd3.getMaxValue(dimension);
            spcd3.setDimensionRange(dimension, min, max);
        }
      });
      document.getElementById('range-button').textContent = 'Set dimension ranges 0 - 100';
    }
  }

  const selectRecord = () => {
    if (spcd3.isSelected('Sylvia')) {
      spcd3.setUnselected('Sylvia');
      document.getElementById('select-button').textContent = 'Select record: Sylvia';
    }
    else {
      spcd3.setSelected('Sylvia');
      document.getElementById('select-button').textContent = 'Unselect record: Sylvia';
    }
  }

  const filterRecords = () => {
    let isInverted = spcd3.getInversionStatus('English');
    if (isInverted == 'ascending') {
    if (spcd3.getFilter('English')[1] == 1) {
      spcd3.setFilter('English', 99, 50);
      document.getElementById('filter-button').textContent = 'English: Reset filter';
    }
    else if (spcd3.getFilter('English')[1] == 0) {
      spcd3.setFilter('English', 100, 50);
      document.getElementById('filter-button').textContent = 'English: Reset filter';
    }
    else if (spcd3.getFilter('English')[1] == 50 && spcd3.getFilter('English')[0] ==  100) {
      spcd3.setFilter('English', 100, 0);
      document.getElementById('filter-button').textContent = 'English: Filter 50 - 100';
    }
    else {
      spcd3.setFilter('English', 100, 0);
      document.getElementById('filter-button').textContent = 'English: Filter 50 - 100';
    }
  }
  else {
    if (spcd3.getFilter('English')[0] == 1) {
      spcd3.setFilter('English', 50, 99);
      document.getElementById('filter-button').textContent = 'English: Reset filter';
    }
    else if (spcd3.getFilter('English')[0] == 0) {
      spcd3.setFilter('English', 50, 100);
      document.getElementById('filter-button').textContent = 'English: Reset filter';
    }
    else if (spcd3.getFilter('English')[0] == 50 && spcd3.getFilter('English')[1] ==  100) {
      spcd3.setFilter('English', 0, 100);
      document.getElementById('filter-button').textContent = 'English: Filter 50 - 100';
    }
    else {
      spcd3.setFilter('English', 0, 100);
      document.getElementById('filter-button').textContent = 'English: Filter 50 - 100';
    }
  }
  }

  const moveDimension = () => {
    const posGerman = spcd3.getDimensionPosition('German');
    const posEnglish = spcd3.getDimensionPosition('English');
    const diff = posEnglish - posGerman;
    if (diff == 1) {
      document.getElementById('move-button').textContent = 'Move German next to English';
    }
    else {
      document.getElementById('move-button').textContent = 'German: Reset position';
    }
    spcd3.swap('PE', 'German');
  }

  const invertDimension = () => {
    if (spcd3.getInversionStatus('English') == 'descending')
    {
      spcd3.setInversionStatus('English', 'ascending');
      filterRecordsForInvert()
    }
    else
    {
      spcd3.setInversionStatus('English', 'descending');
      filterRecordsForInvert();
    }
  }

  const filterRecordsForInvert = () => {
    console.log(spcd3.getFilter('English'));
    spcd3.setFilter('English', spcd3.getFilter('English')[0], spcd3.getFilter('English')[1]);
  }

  const addRow = () => {
    const newRow = {};
    columns.value.forEach((column) => {
      newRow[column.key] = '';
    });
    rows.value.push(newRow);
  };

  const deleteRow = (index) => {
    if (index >= 0 && index < rows.value.length) {
      rows.value.splice(index, 1);
    }
    redrawChart();
  };

  const openModal = () => {
    isModalOpen.value = true;
  };

  const closeModal = () => {
    isModalOpen.value = false;
    newColumn.value = '';
  };

  const addColumn = () => {
    const trimmed = newColumn.value.trim();
    let newCol = '';
    if (trimmed) {
      newCol = { key: trimmed, label: trimmed };
    }
    
    columns.value.push(newCol);
    rows.value.forEach(row => {
      row[newCol.key] = '';
    });
    closeModal();
  };

  const deleteColumn = (key) => {
    const array = JSON.parse(JSON.stringify(columns.value));
    const index = array.findIndex(column => column.key === key);
    columns.value.splice(index, 1);
    rows.value.forEach(row => {
      if (row && row[key]) {
        delete row[key];
      }
    });
    redrawChart();
  };

  const redrawChart = () => {
    const headers = columns.value.map(column => column.label).join(',');
    const newRows = rows.value.map(row => {
      return columns.value.map(column => row[column.key]).join(',');
    }).join('\n');

    const csvData = `${headers}\n${newRows}`;
    let newData = spcd3.loadCSV(csvData);
    spcd3.drawChart(newData);
  };

  const resetTable = () => {
    columns.value = structuredClone(originalColumns);
    rows.value = structuredClone(originalRows);
    redrawChart();
  }

  const isFormValid = computed(() => {
    return rows.value.every(row =>
      columns.value.every(column => {
        const value = row[column.key];
        return value && String(value).trim() !== '';
      })
    );
  });

  // draw parallel coordinates with spcd3
  const drawChart = async (dataset) => {
    try {
      let newData = spcd3.loadCSV(dataset);
      if (newData.length !== 0) {
        spcd3.drawChart(newData);
      }
    } catch (error) {
      console.error('Error drawing data:', error);
    }
  };

  // Load files from public/content/
  const loadContent = async (content, filePath) => {
    try {
      const response = await fetch(filePath);
      const data = await response.text();
      content.value = data;

      await nextTick(() => {
        addClickEvent();
      });
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Load files from public/data
  const loadDataset = async (filePath) => {
    try {
      const response = await fetch(filePath);
      const csv = await response.text();
      return csv;
    } catch (error) {
      console.error('Error loading dataset:', error);
      return null;
    }
  };

  let lastScrollY = window.scrollY;
  let scrollDirection = null;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY) {
      scrollDirection = 'down';
    } else if (currentScrollY < lastScrollY) {
      scrollDirection = 'up';
    } else {
      scrollDirection = null;
    }
    lastScrollY = currentScrollY;
  });

  const handleStepEnter = (element) => {
  if (element == 1) {
    document.getElementById('outlier-button').disabled = true;
    document.getElementById('correlation-button').disabled = true;
    document.getElementById('correlation-neg-button').disabled = true;
    document.getElementById('range-button').disabled = false;
    document.getElementById('select-button').disabled = false;
    document.getElementById('filter-button').disabled = false;
    document.getElementById('move-button').disabled = false;
    document.getElementById('invert-button').disabled = false;
    drawChart(studentDataset.value);
  } else if (element == 0) {
    redrawChart();
    if (document.getElementById('outlier-button').textContent === 'Unselect Outlier') {
      spcd3.setSelected('Patient F');
    }
    if (document.getElementById('correlation-button').textContent === 'Show positive correlation')
    {
      spcd3.setInversionStatus('Age', 'descending');
    }
    document.getElementById('outlier-button').disabled = false;
    document.getElementById('correlation-button').disabled = false;
    document.getElementById('correlation-neg-button').disabled = false;
    document.getElementById('range-button').disabled = true;
    document.getElementById('select-button').disabled = true;
    document.getElementById('filter-button').disabled = true;
    document.getElementById('move-button').disabled = true;
    document.getElementById('invert-button').disabled = true;
  } /*else if (element == 2 && scrollDirection == 'down') {
    setRange();
  } else if (element == 3 && scrollDirection == 'down') {
    selectRecord();
  } else if (element == 4 && scrollDirection == 'down') {
    filterRecords();
  } else if (element == 5 && scrollDirection == 'down') {
    spcd3.swap('PE', 'German');
  } else if (element == 6 && scrollDirection == 'down') {
    invertDimension();
  }*/
}

const getCurrentStepIndex = () => {
  const steps = document.querySelectorAll('.step');
  let currentIndex = 0;
  let maxVisibleTop = null;

  steps.forEach((step, i) => {
    const rect = step.getBoundingClientRect();
    if ((rect.top <= window.innerHeight * 0.5) && (maxVisibleTop === null || rect.top > maxVisibleTop)) {
      maxVisibleTop = rect.top;
      currentIndex = i;
    }
  });
  return currentIndex;
}

const getDatasetForStep = (step) => {
  if (step == 0) return healthDataset.value;
  if (step == 1) return studentDataset.value;
}

window.addEventListener('scroll', () => {
  const currentStep = getCurrentStepIndex();

  if(currentStep !== lastStep) {
    lastStep = currentStep;
    const dataset = getDatasetForStep(currentStep);
    drawChart(dataset);
  }
});

  onMounted(async () => {
    healthDataset.value = await loadDataset('data/healthdata.csv');
    await drawChart(healthDataset.value);
    studentDataset.value = await loadDataset('data/student-marks.csv');
    await loadContent(introText, 'content/introduction.html');
    await loadContent(dataText, 'content/data.html');
    await loadContent(interactivityText, 'content/interactivity.html');
    await loadContent(usageText, 'content/usage.html');
    await loadContent(caseStudy1Text, 'content/casestudy1.html');
    await loadContent(caseStudy2Text, 'content/casestudy2.html');
    await loadContent(healthDatasetText, 'content/healthdata.html');
    await loadContent(studentDatasetText, 'content/studentmarksdata.html');

    await nextTick();

    scroller.setup({
      step: ".step",
      offset: 0.5,
    }).onStepEnter(response => {
      handleStepEnter(response.index);
    })
  });

</script>
  
<style>

* {
  box-sizing: border-box;
}

.sticky-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  color: black;
  background: linear-gradient(to bottom, rgba(0, 129, 175, 0.5), rgba(255, 255, 0, 0.3));
  backdrop-filter: blur(2.5rem);
  pointer-events: none;
  
  z-index: 1000;

  will-change: transform, height, font-size;
  contain: layout style;

  animation: sticky-header-move-and-size linear forwards;
  animation-timeline: scroll();
  animation-range: 0vh 90vh;
}

@keyframes sticky-header-move-and-size {
	from {
		background-position: 50% 0;
		height: 100vh;
    width: 100%;
		font-size: calc(3vw + 1rem);
	}
	to {
		background-position: 50% 100%;
		background-color: rgba(0, 129, 175, 0.5);
		height: 10vh;
    width: 100%;
		font-size: 2rem;
	}
}

.header-spacer {
  height: 100vh;
}

.explorable-explainer {
  display: flex;
  gap: 1rem;
}

.chart-container {
  flex: 1 1 30rem;
  min-width: 20rem;
  position: relative;
}

.main-chart {
  position: sticky;
  top: calc(10vh + 2rem);
  height: 80vh;
  width: 100%;
  padding-top: 2.5rem;
}

.text-container {
  flex: 1 1 23rem;
  min-width: 23rem;
  flex-direction: column;
  width: calc(100% - 2rem);
  max-width: 100%;
}

section {
  text-align: justify;
  width: calc(100% - 2rem);
  max-width: 100%;
  background: rgba(255, 255, 0, 0.3);
  border-radius: 1rem;
  margin-top: 2rem;
  opacity: 0;
  transform: translateY(100px);
  padding-right: 1.5rem;
  padding-bottom: 0.5rem;
  
  animation: slide-in-from-bottom 1s ease-out forwards;
  animation-timeline: scroll();
  animation-range: 0vh 100vh;
  animation-duration: 1s;
}

@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
}

h2 {
  color: rgba(62, 61, 55, 0.5);
  padding-top: 1rem;
  padding-left: 1rem;
}

h3 {
  padding-left: 1.5rem;
  margin-bottom: 0;
}

h4 {
  padding-left: 1.5rem;
  margin-bottom: 0;
}

p {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
  padding-left: 0.5rem;
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
}


.table-container {
  flex: 1 1 20rem;
  max-height: 30rem;
  overflow-y: auto;
  padding-right: 2rem;
  padding-top: 2rem;
}

table {
  text-align: justify;
  border-collapse: collapse;
}

td {
  background-color: rgba(255, 255, 0, 0.3);
  padding: 0.2rem;
  text-align: left;
}

th {
  background-color: rgba(0, 129, 175, 0.3);
  text-align: left;
  padding: 0.3rem;
}

tfoot button {
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

input[type="text"] {
  width: 100%;
  padding: 0.313rem;
  box-sizing: border-box;
}

.modal-content {
  padding-left: 1.5rem;
}

ul {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
  padding-left: 1.5rem;
  margin-top: 0;
}

ul ul {
  padding-left: 0.5rem;
  border-left: 0;
}

ol {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
}

button {
  padding: 0.5rem;
  margin-top: 0.5rem;
  margin-right: 0.5rem;
}

.usage-button {
  margin-top: 0;
  margin-left: 1.5rem;
}

.delete-button {
  padding: 0.3rem;
  margin-top: 0;
  margin-right: 0;
}

.add-button {
  padding: 0.3rem;
  margin-top: 0.3rem;
  margin-right: 0.3rem;
}

.figure-row {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  padding: 1rem 1.5rem;
  max-width: 100%;
  box-sizing: border-box;
}

figure {
  flex: 1 1 8rem;
  text-align: center;
  margin: 0;
}

img {
  width: 100%;
  max-width: 8rem;
  height: auto;
}

figcaption {
  margin-top: 0.5rem;
}

@media (max-width: 40rem) {
  .chart-container {
    flex-direction: column;
  }
  .main-chart {
    width: 100%;
    height: 16rem;
  }
  .text-container {
    width: 100%;
  }
}
</style>
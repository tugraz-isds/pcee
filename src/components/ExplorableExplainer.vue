<template>
  <div class="sticky-header">
    <div>Parallel Coordinates - An Explorable Explainer</div> 
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
      
      <div class="trigger" v-html="interactivityText" ref="trigger"></div>
      <div class="trigger" v-html="usageText" ref="trigger"></div>
      <div class="trigger" v-html="caseStudy1Text" ref="trigger"></div>
      <div class="table-container">
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
      <div class="trigger" v-html="caseStudy2Text" ref="trigger"></div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, nextTick, watch } from 'vue';
  import * as spcd3 from '../../public/lib/spcd3';
  import { columns, rows, columnsStudent, rowsStudent } from '../data.js';

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

  // Click events button in usage section
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
      document.getElementById('outlier-button').textContent = 'Show Outlier';
    }
    else {
      spcd3.setSelected('Patient F');
      document.getElementById('outlier-button').textContent = 'Hide Outlier';
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
    spcd3.swap('Fitness Score', 'Blood Pressure');
  }

  const setRange = () => {
    const currentRange = spcd3.getDimensionRange('PE');
    if (currentRange[0] == 51) {
      spcd3.setDimensionRange('PE', 0, 100);
      document.getElementById('range-button').textContent = 'Set Range for PE';
    }
    else {
      spcd3.setDimensionRange('PE', 51, 100);
      document.getElementById('range-button').textContent = 'Reset Range of PE';
    }
  }

  const selectRecord = () => {
    if (spcd3.isSelected('Sylvia')) {
      spcd3.setUnselected('Sylvia');
      document.getElementById('select-button').textContent = 'Select Record: Sylvia';
    }
    else {
      spcd3.setSelected('Sylvia');
      document.getElementById('select-button').textContent = 'Unselect Record: Sylvia';
    }
  }

  const filterRecords = () => {
    if (spcd3.getFilter('English')[0] == 99) {
      spcd3.setFilter('English', 99, 50);
      document.getElementById('filter-button').textContent = 'Reset Filter';
    }
    else {
      spcd3.setFilter('English', 99, 1);
      document.getElementById('filter-button').textContent = 'Filter';
    }
  }

  const moveDimension = () => {
    spcd3.swap('PE', 'German');
  }

  const invertDimension = () => {
    if (spcd3.getInversionStatus('English') == 'descending')
    {
      spcd3.setInversionStatus('English', 'ascending');
      spcd3.hideMarker('English');
    }
    else
    {
      spcd3.setInversionStatus('English', 'descending');
      spcd3.showMarker('English');
    }
  }

// Functions related to table
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

  const isFormValid = computed(() => {
    return rows.value.every(row =>
      columns.value.every(column => {
        const value = row[column.key];
        return value && String(value).trim() !== '';
      })
    );
  });

  
  // Functions regarding scrollable storytelling
  const setupIntersectionObserver = () => {
    const paragraphs = document.querySelectorAll('.trigger p');
    const observer = new IntersectionObserver((entries, observer) => {
      handleIntersection(entries);
    }, {
      root: null,
      threshold: 0.5
    });
    paragraphs.forEach(paragraph => {
      observer.observe(paragraph);
    });
  };

  const updateChart = (index) => {
    switch (parseInt(index)) {
      case 1:
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
        break;
      case 2:
        document.getElementById('outlier-button').disabled = true;
        document.getElementById('correlation-button').disabled = true;
        document.getElementById('correlation-neg-button').disabled = true;
        document.getElementById('range-button').disabled = false;
        document.getElementById('select-button').disabled = false;
        document.getElementById('filter-button').disabled = false;
        document.getElementById('move-button').disabled = false;
        document.getElementById('invert-button').disabled = false;
        drawChart(studentDataset.value);
        break;
    }
  };

  const handleIntersection = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = entry.target.id.split('-')[1];
        updateChart(index);
      }
    });
  };

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

      nextTick(() => {
        setupIntersectionObserver();
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

  onMounted(async () => {
    healthDataset.value = await loadDataset('/data/healthdata.csv');
    drawChart(healthDataset.value);
    studentDataset.value = await loadDataset('/data/student-marks.csv');
    loadContent(introText, '/content/introduction.html');
    loadContent(dataText, 'content/data.html');
    loadContent(interactivityText, 'content/interactivity.html');
    loadContent(usageText, 'content/usage.html');
    loadContent(caseStudy1Text, 'content/casestudy1.html');
    loadContent(caseStudy2Text, 'content/casestudy2.html');
    loadContent(healthDatasetText, 'content/healthdata.html');
    loadContent(studentDatasetText, 'content/studentmarksdata.html');
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
  flex: 1;
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
  flex: 1;
  display: flex;
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

p:hover {
  border-color: rgba(0, 129, 175, 0.5);
}

.table-container {
  max-height: 30rem;
  overflow-y: auto;
  padding-right: 2rem;
  padding-top: 2rem;
}

table {
  width: 100%;
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

ol:hover {
  border-color: rgba(0, 129, 175, 0.5);
}

ul:hover {
  border-color: rgba(0, 129, 175, 0.5);
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
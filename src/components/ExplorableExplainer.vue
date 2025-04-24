<template>
  <div id="sticky-parallax-header">
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
        <button class="delete" @click="deleteRow(rowIndex)">Delete</button>
        </td>
        </tr>
        </tbody>
        <tfoot>
        <tr>
        <td v-for="column in columns" :key="column.key">
        <button class="delete" @click="deleteColumn(column.key)">Delete {{ column.label }}
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
        <button class="add" @click="addColumn">Add</button>
        <button class="add" @click="closeModal">Cancel</button>
        </div>
        </div>      
      </div>
      
      <div class="trigger" v-html="interactivityText" ref="trigger"></div>
      <div class="trigger" v-html="usageText" ref="trigger"></div>
      <div class="trigger" v-html="caseStudyText" ref="trigger"></div>
    </div>
  </div>
</template>

<script setup>
  import { ref, onMounted, computed, nextTick, watch } from 'vue';
  import * as spcd3 from '../../public/lib/spcd3';

  const introText = ref('');
  const dataText = ref('');
  const interactivityText = ref('');
  const usageText = ref('');
  const caseStudyText = ref('');
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
    const button = document.getElementById('showOutlier');
    if (button) {
      button.addEventListener('click', selectOutlier);
    }
    const buttonNegCorr = document.getElementById('showNegativeCorrelation');
    if (buttonNegCorr) {
      buttonNegCorr.addEventListener('click', showNegativeCorrelation);
    }
    const buttonPosCorr = document.getElementById('showPositiveCorrelation');
    if (buttonPosCorr) {
      buttonPosCorr.addEventListener('click', showPositiveCorrelation);
    }
  }

  const selectOutlier = () => {
    if (spcd3.isSelected('Patient_F')) {
      spcd3.setUnselected('Patient_F')
      document.getElementById('showOutlier').textContent = 'Unselect Outlier';
    }
    else {
      spcd3.setSelected('Patient_F');
      document.getElementById('showOutlier').textContent = 'Show Outlier';
    }
  };

  const showNegativeCorrelation = () => {
    const pos = spcd3.getDimensionPosition('Age');
    if (pos === 4) {
      spcd3.move('Age', false, 'HeartRate');
      spcd3.setInversionStatus('Age', 'descending');
      document.getElementById('showNegativeCorrelation').textContent = 'Redo';
    }
    else if (pos === 3) {
      spcd3.move('Age', false, 'BloodPressure');
      spcd3.setInversionStatus('Age', 'ascending');
      document.getElementById('showNegativeCorrelation').textContent = 'Show negative correlation';
    }
    else {
      // should not happen
    }
  }

  const showPositiveCorrelation = () => {
    const pos = spcd3.getDimensionPosition('Age');
    if (pos === 4) {
      spcd3.move('Age', false, 'BMI');
      document.getElementById('showPositiveCorrelation').textContent = 'Redo';
    }
    else if (pos === 2) {
      spcd3.move('Age', false, 'BloodPressure');
      document.getElementById('showPositiveCorrelation').textContent = 'Show positive correlation';
    }
    else {
      // should not happen
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
      newCol = { key: trimmed,label: trimmed };
    }
    
    columns.value.push(newCol);
    rows.value.forEach(row => {
      row[newCol.key] = '';
    });
    closeModal();
  };

  // TODO: Bug!
  const deleteColumn = (index) => {
    const columnKey = columns.value[index].key;
    columns.value.splice(index, 1);
    rows.value.forEach(row => {
      if (row && row[columnKey]) {
        delete row[columnKey];
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

  const columns = ref([
    {key: 'Patient', label: 'Patient'},
    {key: 'Age', label: 'Age'}, 
    {key: 'BloodPressure', label: 'Blood Pressure'},
    {key: 'HeartRate', label: 'Heart Rate'},
    {key: 'BMI', label: 'BMI'},
    {key: 'Cholesterol', label: 'Cholesterol'}
  ]);

  const rows = ref([
  { Patient: 'Patient A', Age: 45, BloodPressure: 120, HeartRate: 72, BMI: 25, Cholesterol: 200 },
  { Patient: 'Patient B', Age: 48, BloodPressure: 125, HeartRate: 75, BMI: 26, Cholesterol: 210 },
  { Patient: 'Patient C', Age: 51, BloodPressure: 130, HeartRate: 78, BMI: 27, Cholesterol: 220 },
  { Patient: 'Patient D', Age: 54, BloodPressure: 135, HeartRate: 81, BMI: 28, Cholesterol: 230 },
  { Patient: 'Patient E', Age: 57, BloodPressure: 140, HeartRate: 84, BMI: 29, Cholesterol: 240 },
  { Patient: 'Patient F', Age: 70, BloodPressure: 180, HeartRate: 60, BMI: 35, Cholesterol: 800 }
  ]);

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
      case 0:
        drawChart(healthDataset.value);
        document.getElementById('showOutlier').disabled = false;
        document.getElementById('showNegativeCorrelation').disabled = false;
        document.getElementById('showPositiveCorrelation').disabled = false;
        break;
      case 1:
        document.getElementById('showOutlier').disabled = true;
        document.getElementById('showNegativeCorrelation').disabled = true;
        document.getElementById('showPositiveCorrelation').disabled = true;
        drawChart(studentDataset.value);
        break;
      case 2:
        const dimensions1 = spcd3.getAllDimensionNames();
        dimensions1.forEach(function(dimension) {
          if (!isNaN(spcd3.getMinValue(dimension))) {
            let min = 0;
            let max = spcd3.getMaxValue(dimension);
            spcd3.setDimensionRangeRounded(dimension, min, max);
          }
        });
        break;
      case 3:
        spcd3.setSelected('Sylvia');
        break;
      case 4:
        break;
      case 5:
        drawChart(studentDataset.value);
        spcd3.move('German', true, 'English');
        break;
      case 6:
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
  const loadContent = async (htmlContent, filePath) => {
    try {
      const response = await fetch(filePath);
      const data = await response.text();
      htmlContent.value = data;

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
    loadContent(caseStudyText, 'content/casestudy.html');
    loadContent(healthDatasetText, 'content/healthdata.html');
    loadContent(studentDatasetText, 'content/studentmarksdata.html');
  });

</script>
  
<style>

* {
  box-sizing: border-box;
}

#sticky-parallax-header {
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
  backdrop-filter: blur(4px);
  pointer-events: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;

  will-change: transform, height, font-size;
  contain: layout style;

  animation: sticky-parallax-header-move-and-size linear forwards;
  animation-timeline: scroll();
  animation-range: 0vh 90vh;
}

@keyframes sticky-parallax-header-move-and-size {
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

.main-text {
  text-align: justify;
  width: calc(100% - 2rem);
  max-width: 100%;
  background: rgba(237, 237, 231, 0.972);
  border-radius: 1rem;
  margin-top: 3rem;
  opacity: 0;
  transform: translateY(100px);
  padding-right: 1rem;
  
  animation: slide-in-from-bottom 1s ease-out forwards;
  animation-timeline: scroll();
  animation-range: 0vh 100vh;
  animation-duration: 1s;
}

@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(100px) rotate(50deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
}

.table-container {
  padding-right: 2rem;
  padding-top: 2rem;
}

table {
  width: 100%;
  text-align: justify;
  border-collapse: collapse;
}

h2 {
  color: rgba(0, 129, 175, 0.5);
  padding-left: 0.5rem;
}

h3 {
  padding-left: 2rem;
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

ul {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
  padding-left: 2rem;
}

ul ul {
  padding-left: 0.5rem;
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

#test {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
}

#test:hover {
  border-color: rgba(237, 237, 231, 0.972);
}

button {
  padding: 0.5rem;
  margin-top: 0.5rem;
  margin-right: 0.5rem;
}

.delete {
  padding: 0.3rem;
  margin-top: 0;
  margin-right: 0;
}

.add {
  padding: 0.3rem;
  margin-top: 0.3rem;
  margin-right: 0.3rem;
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
  padding-left: 2rem;
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
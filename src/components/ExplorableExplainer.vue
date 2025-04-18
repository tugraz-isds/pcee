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
      <div class="main-text">
        <h2>1. Introduction</h2>
        <div v-html="introText"></div>
      </div>
      <div class="main-text">
        <h2>2. Multidimensional Data</h2>
        <div v-html="dataText"></div>
        <h4>Example Datasets Cars:</h4>
        <div v-if="selectedDataset === 'cars'">
          <div v-html="carsDatasetText"></div>
        </div>
        <div v-if="selectedDataset === 'students'">
          <div v-html="studentDatasetText"></div>
        </div>
      </div>
        <div class="table-container" v-if="selectedDataset">
          <table border="1">
            <thead>
              <tr>
                <th v-for="(column, index) in columns" :key="index">{{ column }}
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in selectedData" :key="rowIndex">
              <td v-for="(column, colIndex) in columns" :key="colIndex">
                <input v-model="row[column]" type="text"/>
              </td>
              <td>
                <button class="delete" @click="deleteRow(rowIndex)">Delete</button>
              </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
              <td v-for="(column, index) in columns" :key="index">
                <button class="delete" @click="deleteColumn(index)">Delete {{ column }}</button>
              </td>
              <td></td>
              </tr>
            </tfoot>
          </table>
          <button @click="addRow">Add Row</button>
          <button @click="openModal">Add Column</button>
          <button @click="redrawChart" :disabled="!isFormValid">Redraw Chart</button>
          <div v-if="isModalOpen" class="modal">
            <div class="modal-content">
              <div>Add new column name:</div>
              <input v-model="newColumn" type="text" placeholder="Enter column name..." />
              <button class="add" @click="addColumn">Add</button>
              <button class="add" @click="closeModal">Cancel</button>
            </div>
          </div>      
        </div>
      
      <div class="main-text">
        <h2>3. Interactive Data Exploration</h2>
        <div class="trigger" v-html="interactivityText" ref="trigger"></div>
      </div>
      <div class="main-text">
        <h2>4. Usage</h2>
        <div v-html="usageText"></div>
      </div>
      <div class="main-text">
        <h2>5. Case Study</h2>
        <div class="trigger" v-html="caseStudyText" ref="trigger"></div>
      </div>
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
  const carsDatasetText = ref('');
  const studentDatasetText = ref('');
  const textArea = ref(null);
  const trigger = ref(null);
  const carsDataset = ref('');
  const studentDataset = ref('');
  const selectedDataset = ref('cars');
  const isModalOpen = ref(false);
  const newColumn = ref('');


  const addRow = () => {
    const newRow = {};
    columns.value.forEach((column) => {
      newRow[column] = '';
    });
    rows.value.push(newRow);
  };

  const addClickEvent = () => {
      const button = document.getElementById('addOutlier');
      if (button) {
        button.addEventListener('click', addOutlier);
      }
    }

  const addOutlier = () => {
    rows.value.push( { Car: 'Car G', Speed: 140, FuelEfficiency: 6, Weight: 1000, Price: 15 });
    redrawChart();
    document.getElementById('addOutlier').disabled = true;
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
    if (newColumn.value.trim()) {
      columns.value.push(newColumn.value.trim());
      rows.value.forEach(row => {
        row[newColumn.value.trim()] = '';
      });
      closeModal();
    }
  };

  const deleteColumn = (index) => {
      columns.value.splice(index, 1);
      rows.value.forEach(row => {
        const columnName = columns.value[index];
        delete row[columnName];
      });
      redrawChart();
    };

  const redrawChart = () => {
    const headers = columns.value.join(','); 

    const newRows = rows.value.map(row => {
      return columns.value.map(column => row[column]).join(',');
    }).join('\n');

    const csvData = `${headers}\n${newRows}`;
    let newData = spcd3.loadCSV(csvData);
    spcd3.drawChart(newData);
  };

  const isFormValid = computed(() => {
    return rows.value.every(row =>
      columns.value.every(column => {
        const value = row[column];
        return value && String(value).trim() !== '';
      })
    );
  });

  /*watch(selectedData, async (newVal) => {
    if (newVal) {
      await nextTick();
      drawChart(carsDataset.value);
    }
  });*/

  const columns = ref(['Car', 'Speed', 'FuelEfficiency', 'Weight', 'Price']);

  const rows = ref([
    { Car: 'Car A', Speed: 180, FuelEfficiency: 8, Weight: 1500, Price: 25 },
    { Car: 'Car B', Speed: 200, FuelEfficiency: 7.5, Weight: 1400, Price: 28 },
    { Car: 'Car C', Speed: 160, FuelEfficiency: 9, Weight: 1600, Price: 22 },
    { Car: 'Car D', Speed: 190, FuelEfficiency: 8.5, Weight: 1450, Price: 27 },
    { Car: 'Car E', Speed: 170, FuelEfficiency: 10, Weight: 1550, Price: 20 },
    { Car: 'Car F', Speed: 210, FuelEfficiency: 7, Weight: 1300, Price: 30 }
  ]);

  const selectedData = computed(() => {
    if (selectedDataset.value === 'cars') {
      columns.value = ['Car', 'Speed', 'FuelEfficiency', 'Weight', 'Price'];
      rows.value = [
    { Car: 'Car A', Speed: 180, FuelEfficiency: 8, Weight: 1500, Price: 25 },
    { Car: 'Car B', Speed: 200, FuelEfficiency: 7.5, Weight: 1400, Price: 28 },
    { Car: 'Car C', Speed: 160, FuelEfficiency: 9, Weight: 1600, Price: 22 },
    { Car: 'Car D', Speed: 190, FuelEfficiency: 8.5, Weight: 1450, Price: 27 },
    { Car: 'Car E', Speed: 170, FuelEfficiency: 10, Weight: 1550, Price: 20 },
    { Car: 'Car F', Speed: 210, FuelEfficiency: 7, Weight: 1300, Price: 30 }
    ];
    drawChart(carsDataset.value);
    } else if (selectedDataset.value === 'students') {
      columns.value = ['Name', 'Maths', 'English', 'PE', 'Art', 'History', 'IT', 'Biology', 'German'];
      rows.value = [
      { Name: 'Adrian', Maths: 95, English: 24, PE: 82, Art: 49, History: 58, IT: 85, Biology: 21, German: 24 },
      { Name: 'Amelia', Maths: 92, English: 98, PE: 60, Art: 45, History: 82, IT: 85, Biology: 78, German: 92 },
      { Name: 'Brooke', Maths: 27, English: 35, PE: 84, Art: 45, History: 23, IT: 50, Biology: 15, German: 22 },
      { Name: 'Chloe', Maths: 78, English: 9, PE: 83, Art: 66, History: 80, IT: 63, Biology: 29, German: 12 },
      { Name: 'Dylan', Maths: 92, English: 47, PE: 91, Art: 56, History: 47, IT: 81, Biology: 60, German: 51 },
      { Name: 'Emily', Maths: 67, English: 3, PE: 98, Art: 77, History: 25, IT: 100, Biology: 50, German: 34 },
      { Name: 'Evan', Maths: 53, English: 60, PE: 97, Art: 74, History: 21, IT: 78, Biology: 72, German: 75 },
      { Name: 'Finn', Maths: 42, English: 73, PE: 65, Art: 52, History: 43, IT: 61, Biology: 82, German: 85 },
      { Name: 'Gia', Maths: 50, English: 81, PE: 85, Art: 80, History: 43, IT: 46, Biology: 73, German: 91 },
      { Name: 'Grace', Maths: 24, English: 95, PE: 98, Art: 94, History: 89, IT: 25, Biology: 91, German: 69 },
      { Name: 'Harper', Maths: 69, English: 9, PE: 97, Art: 77, History: 56, IT: 94, Biology: 38, German: 2 },
      { Name: 'Hayden', Maths: 2, English: 72, PE: 74, Art: 53, History: 40, IT: 40, Biology: 66, German: 64 },
      { Name: 'Isabella', Maths: 8,English: 99, PE: 84, Art: 69, History: 86, IT: 20, Biology: 86, German: 85 },
      { Name: 'Jesse', Maths: 63, English: 39, PE: 93, Art: 84, History: 30, IT: 71, Biology: 86, German: 19 },
      { Name: 'Jordan', Maths: 11,English: 80, PE: 87, Art: 68, History: 88, IT: 20, Biology: 96, German: 81 },
      { Name: 'Kai', Maths: 27, English: 65, PE: 62, Art: 92, History: 81, IT: 28, Biology: 94, German: 84 },
      { Name: 'Kaitlyn', Maths: 7, English: 70, PE: 51, Art: 77, History: 79, IT: 29, Biology: 96, German: 73 },
      { Name: 'Lydia', Maths: 75, English: 49, PE: 98, Art: 55, History: 68, IT: 67, Biology: 91, German: 87 },
      { Name: 'Mark', Maths: 51, English: 70, PE: 87, Art: 40, History: 97, IT: 94, Biology: 60, German: 95 },
      { Name: 'Monica', Maths: 62, English: 89, PE: 98, Art: 90, History: 85, IT: 66, Biology: 84, German: 99 },
      { Name: 'Nicole', Maths: 70, English: 8, PE: 84, Art: 64, History: 26, IT: 70, Biology: 12, German: 8 },
      { Name: 'Oswin', Maths: 96, English: 14, PE: 62, Art: 35, History: 56, IT: 98, Biology: 5, German: 12 },
      { Name: 'Peter', Maths: 98, English: 10, PE: 71, Art: 41, History: 55, IT: 66, Biology: 38, German: 29 },
      { Name: 'Renette', Maths: 96,English: 39, PE: 82, Art: 43, History: 26, IT: 92, Biology: 20, German: 2 },
      { Name: 'Robert', Maths: 78, English: 32, PE: 98, Art: 55, History: 56, IT: 81, Biology: 46, German: 29 },
      { Name: 'Sasha', Maths: 87, English: 1, PE: 84, Art: 70, History: 56, IT: 88, Biology: 49, German: 2 },
      { Name: 'Sylvia', Maths: 86,English: 12, PE: 97, Art: 4, History: 19, IT: 80, Biology: 36, German: 8 },
      { Name: 'Thomas', Maths: 76, English: 47, PE: 99, Art: 34, History: 48, IT: 92, Biology: 30, German: 38 },
      { Name: 'Victor', Maths: 5, English: 60, PE: 70, Art: 65, History: 97, IT: 19, Biology: 63, German: 83 },
      { Name: 'Zack', Maths: 19, English: 84, PE: 83, Art: 42, History: 93, IT: 15, Biology: 98, German: 95 }
    ];
    drawChart(studentDataset.value);
    }
    return rows.value;
  });

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

  const updateChart = (index) => {
      switch (parseInt(index)) {
        case 1:
          spcd3.setInversionStatus('Speed', 'descending');
          break;
        case 2:
          spcd3.swap('Speed', 'Price');
          break;
        case 3:
          break;
        case 4:
          break;
        case 5:
          break;
        case 6:
          break;
        case 7:
          break;
        case 8:
          drawChart(studentDataset.value);
          break;
        case 9:
          const dimensions1 = spcd3.getAllDimensionNames();
          dimensions1.forEach(function(dimension) {
            if (!isNaN(spcd3.getMinValue(dimension))) {
              let min = 0;
              let max = spcd3.getMaxValue(dimension);
              spcd3.setDimensionRangeRounded(dimension, min, max);
            }
          });
          break;
        case 10:
          spcd3.setSelected('Sylvia');
          break;
        case 11:
          break;
        case 12:
          drawChart(studentDataset.value);
          spcd3.move('German', true, 'English');
          break;
        case 13:
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

  onMounted(async () => {
    carsDataset.value = await loadDataset('/data/cars.csv');
    studentDataset.value = await loadDataset('/data/student-marks.csv');
    loadContent(introText, '/content/introduction.html');
    loadContent(dataText, 'content/data.html');
    loadContent(interactivityText, 'content/interactivity.html');
    loadContent(usageText, 'content/usage.html');
    loadContent(caseStudyText, 'content/casestudy.html');
    loadContent(carsDatasetText, 'content/carsdata.html');
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
  margin-top: 2rem;
  opacity: 0;
  transform: translateY(100px);
  padding-right: 1rem;
  
  animation: slide-in-from-bottom 1s ease-out forwards;
  animation-timeline: scroll();
  animation-range: 0vh 100vh; 
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

ul:hover {
  border-color: rgba(0, 129, 175, 0.5);
}

#test {
  border-left: 1rem solid transparent;
  transition: border-color 0.3s ease;
}

#test:hover {
  border-color: white;
}

ol:hover {
  border-color: rgba(0, 129, 175, 0.5);
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

.radio-group {
  display: flex;
  gap: 5rem;
  padding-left: 2rem;
  padding-bottom: 3rem;
}

input[type="radio"] {
  padding-left: 2rem;
}

.modal-content {
  padding-left: 2rem;
}

.header {
  font-size: large;
  color: rgba(0, 128, 175, 0.786);
  padding-bottom: 2rem;
  margin-bottom: 2rem;
}

.option-header {
  font-weight: bold;
}

.options-header {
  font-weight: bold;
  padding-left: 2rem;
}

.options-header:hover {
  border-color: white;
}

.italic {
  font-style: italic;
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
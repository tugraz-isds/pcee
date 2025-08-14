<!-- eslint-disable vue/no-v-html -->
<template>
  <div>
    <div
      ref="header"
      :class="['sticky-header', { 'use-native': supportsScrollDrivenAnimations }]"
    >
      <div
        ref="multiLine"
        class="multi-line"
      >
        Parallel Coordinates:<br>
        An Explorable Explainer
      </div>
      <div
        ref="singleLine"
        class="single-line"
      >
        Parallel Coordinates: An Explorable Explainer
      </div>
    </div>
  </div>
  <div
    v-if="supportsScrollDrivenAnimations"
    class="header-spacer-native"
  />
  <div
    v-else
    class="header-spacer-polyfill"
  />

  <div class="explorable-explainer">
    <div
      ref="textArea"
      class="chart-container"
    >
      <div
        id="parallelcoords"
        class="main-chart"
      />
    </div>
    <div class="text-container">
      <div v-html="introText" />
      <div v-html="dataText" />
      <div v-html="healthDatasetText" />

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
                <th
                  v-for="column in columns"
                  :key="column.key"
                >
                  {{ column.label }}
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, rowIndex) in rows"
                :key="rowIndex"
              >
                <td
                  v-for="column in columns"
                  :key="column.key"
                >
                  <input
                    v-model="row[column.key]"
                    type="text"
                  >
                </td>
                <td>
                  <button
                    class="delete-button"
                    @click="deleteRow(rowIndex)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td
                  v-for="column in columns"
                  :key="column.key"
                >
                  <button
                    class="delete-button"
                    @click="deleteColumn(column.key)"
                  >
                    Delete {{ column.label }}
                  </button>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
          <button @click="addRow">
            Add Row
          </button>
          <button @click="openModal">
            Add Column
          </button>
          <button
            :disabled="!isFormValid"
            @click="redrawChart"
          >
            Redraw Chart
          </button>
          <button @click="resetTable">
            Reset Table
          </button>
          <div
            v-if="isModalOpen"
            class="modal"
          >
            <div class="modal-content">
              <div>Add New Column Name:</div>
              <input
                v-model="newColumn"
                type="text"
                placeholder="Enter column name..."
              >
              <button
                class="add-button"
                @click="addColumn"
              >
                Add
              </button>
              <button
                class="add-button"
                @click="closeModal"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-html="interactivityText" />
      <div v-html="usageText" />
      <div v-html="caseStudy1Text" />
      <div v-html="caseStudy2Text" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, type Ref } from 'vue';
import * as spcd3 from '../spcd3.js';
import scrollama from 'scrollama';
import { originalColumns, originalRows } from '../data.js';
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger);

interface Column {
  key: string
  label: string
}

type Row = Record<string, unknown>;

const introText = ref('');
const dataText = ref('');
const interactivityText = ref('');
const usageText = ref('');
const caseStudy1Text = ref('');
const caseStudy2Text = ref('');
const healthDatasetText = ref('');
const studentDatasetText = ref('');
const textArea = ref(null);
const healthDataset = ref('');
const studentDataset = ref('');
const isModalOpen = ref(false);
const newColumn = ref('');
const showTable = ref(true);
const columns = ref<Column[]>(structuredClone(originalColumns));
const rows = ref<Row[]>(structuredClone(originalRows));
const scroller = scrollama();
const header = ref<HTMLElement | null>(null);
const multiLine = ref<HTMLElement | null>(null);
const singleLine = ref<HTMLElement | null>(null);
const supportsScrollDrivenAnimations: boolean =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()');
let lastStep = -1;

const addClickEvent = (): void => {
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

const selectOutlier = (): void => {
  if (spcd3.isSelected('Patient F')) {
    spcd3.setUnselected('Patient F');
    (document.getElementById('outlier-button') as HTMLButtonElement).textContent = 'Show Outlier';
  }
  else {
    spcd3.setSelected('Patient F');
    (document.getElementById('outlier-button') as HTMLButtonElement).textContent = 'Hide Outlier';
  }
};

const showPositiveCorrelation = (): void => {
  if (spcd3.getInversionStatus('Age') == 'descending') {
    spcd3.setInversionStatus('Age', 'ascending');
    spcd3.hideMarker('Age');
  }
  else {
    spcd3.setInversionStatus('Age', 'descending');
    spcd3.showMarker('Age');
  }
}

const showNegativeCorrelation = (): void => {
  const posFitness = spcd3.getDimensionPosition('Fitness Score');
  const posAge = spcd3.getDimensionPosition('Age');
  const diff = posAge - posFitness;
  if (diff == 1) {
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).textContent = 'Move Fitness Score next to Age';
    spcd3.move('Fitness Score', true, 'Cholesterol');
  }
  else {
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).textContent = 'Fitness Score: Reset Position';
    spcd3.move('Fitness Score', true, 'Age');
  }
 
}

const setRange = (): void => {
  const currentRange = spcd3.getDimensionRange('PE');
  if (currentRange[0] == 51) {
    const dimensions = spcd3.getAllDimensionNames();
    dimensions.forEach(function (dimension: string) {
      if (!isNaN(spcd3.getMinValue(dimension))) {
        spcd3.setDimensionRange(dimension, 0, 100);
      }
    });
    (document.getElementById('range-button') as HTMLButtonElement).textContent = 'Set Dimension Ranges from Data';
  }
  else {
    const dimensions = spcd3.getAllDimensionNames();
    dimensions.forEach(function (dimension: string) {
      if (!isNaN(spcd3.getMinValue(dimension))) {
        const min = spcd3.getMinValue(dimension);
        const max = spcd3.getMaxValue(dimension);
        spcd3.setDimensionRange(dimension, min, max);
      }
    });
    (document.getElementById('range-button') as HTMLButtonElement).textContent = 'Set Dimension Ranges 0 - 100';
  }
}

const selectRecord = (): void => {
  if (spcd3.isSelected('Sylvia')) {
    spcd3.setUnselected('Sylvia');
    (document.getElementById('select-button') as HTMLButtonElement).textContent = 'Select Record: Sylvia';
  }
  else {
    spcd3.setSelected('Sylvia');
    (document.getElementById('select-button') as HTMLButtonElement).textContent = 'Unselect Record: Sylvia';
  }
}

const filterRecords = (): void => {
  console.log(spcd3.getFilter('English'));
  if (spcd3.getFilter('English')[0] == 1) {
    spcd3.setFilter('English', 99, 51);
    (document.getElementById('filter-button') as HTMLButtonElement).textContent = 'English: Reset Filter';
  }
  else if (spcd3.getFilter('English')[0] == 51) {
    spcd3.setFilter('English', 99, 1);
    (document.getElementById('filter-button') as HTMLButtonElement).textContent = 'English: Set Filter to 50';
  }
  else if (spcd3.getFilter('English')[0] == 0 && spcd3.getFilter('English')[1] == 100) {
    spcd3.setFilter('English', 100, 50);
    (document.getElementById('filter-button') as HTMLButtonElement).textContent = 'English: Reset Filter';
  }
  else {
    spcd3.setFilter('English', 100, 0);
    (document.getElementById('filter-button') as HTMLButtonElement).textContent = 'English: Set Filter to 50';
  }
}

const moveDimension = (): void => {
  const posGerman = spcd3.getDimensionPosition('German');
  const posEnglish = spcd3.getDimensionPosition('English');
  const diff = posEnglish - posGerman;
  if (diff == 1) {
    spcd3.move('German', true, 'Biology');
    (document.getElementById('move-button') as HTMLButtonElement).textContent = 'Move German next to English';
  }
  else {
    spcd3.move('German', true, 'English');
    (document.getElementById('move-button') as HTMLButtonElement).textContent = 'German: Reset Position';
  }
}

const invertDimension = (): void => {
  spcd3.invert('English');
}

const addRow = (): void => {
  const newRow: Row = {};
  columns.value.forEach((column) => {
    newRow[column.key] = '';
  });
  rows.value.push(newRow);
};

const deleteRow = (index: number): void => {
  if (index >= 0 && index < rows.value.length) {
    rows.value.splice(index, 1);
  }
  redrawChart();
};

const openModal = (): void => {
  isModalOpen.value = true;
};

const closeModal = (): void => {
  isModalOpen.value = false;
  newColumn.value = '';
};

const addColumn = (): void => {
  const trimmed = newColumn.value.trim();
  let newCol: Column = {key: '', label: ''};
  if (trimmed) {
    newCol = { key: trimmed, label: trimmed };
  }
  columns.value.push(newCol);
  rows.value.forEach(row => {
    row[newCol.key] = '';
  });
  closeModal();
};

const deleteColumn = (key: string): void => {
  const index = columns.value.findIndex(c => c.key === key)
  if (index === -1) return

  columns.value.splice(index, 1)

  for (const row of rows.value) {
    if (row && key in row) {
      delete row[key]
    }
  }

  redrawChart()
}

const redrawChart = (): void => {
  const headers = columns.value.map(column => column.label).join(',');
  const newRows = rows.value.map(row => {
    return columns.value.map(column => row[column.key]).join(',');
  }).join('\n');

  const csvData = `${headers}\n${newRows}`;
  let newData = spcd3.loadCSV(csvData);
  spcd3.drawChart(newData);
};

const resetTable = (): void => {
  columns.value = structuredClone(originalColumns);
  rows.value = structuredClone(originalRows);
  redrawChart();
}

const isFormValid = computed<boolean>(() => {
  return rows.value.every(row =>
    columns.value.every(column => {
      const value = row[column.key];
      return value && String(value).trim() !== '';
    })
  );
});

// draw parallel coordinates with spcd3
const drawChart = async (dataset: string | undefined): Promise<void> => {
  try {
    if (dataset !== undefined) {
    let newData = spcd3.loadCSV(dataset);
    if (newData.length !== 0) {
      spcd3.drawChart(newData);
    }
  }
  } catch (error) {
    console.error('Error drawing data:', error);
  }
};

// Load files from public/content/
const loadContent = async (content: Ref<string>, filePath: string): Promise<void> => {
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
const loadDataset = async (filePath: string): Promise<string> => {
  try {
    const response = await fetch(filePath);
    const csv = await response.text();
    return csv;
  } catch (error) {
    console.error('Error loading dataset:', error);
    return '';
  }
};

const handleStepEnter = (element: number): void => {
  if (element == 2) {
    // do nothing
  }
  else if (element == 1) {
    (document.getElementById('outlier-button') as HTMLButtonElement).disabled = true;
    (document.getElementById('correlation-button') as HTMLButtonElement).disabled = true;
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).disabled = true;
    (document.getElementById('range-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('select-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('filter-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('move-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('invert-button') as HTMLButtonElement).disabled = false;
    drawChart(studentDataset.value);
  } else if (element == 0) {
    redrawChart();
    if ((document.getElementById('outlier-button') as HTMLButtonElement).textContent === 'Unselect Outlier') {
      spcd3.setSelected('Patient F');
    }
    if ((document.getElementById('correlation-button') as HTMLButtonElement).textContent === 'Show Positive Correlation') {
      spcd3.setInversionStatus('Age', 'descending');
    }
    (document.getElementById('outlier-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('correlation-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).disabled = false;
    (document.getElementById('range-button') as HTMLButtonElement).disabled = true;
    (document.getElementById('select-button') as HTMLButtonElement).disabled = true;
    (document.getElementById('filter-button') as HTMLButtonElement).disabled = true;
    (document.getElementById('move-button') as HTMLButtonElement).disabled = true;
    (document.getElementById('invert-button') as HTMLButtonElement).disabled = true;
  }
}

const getCurrentStepIndex = (): number => {
  const steps = document.querySelectorAll<HTMLElement>('.step')
  let currentIndex = 0
  let maxVisibleTop: number | null = null

  steps.forEach((step, i) => {
    const rect = step.getBoundingClientRect()
    const isHalfInView = rect.top <= window.innerHeight * 0.5
    if (isHalfInView && (maxVisibleTop === null || rect.top > maxVisibleTop)) {
      maxVisibleTop = rect.top
      currentIndex = i
    }
  })
  return currentIndex
}


const getDatasetForStep = (step: number): string | undefined => {
  if (step == 0) return healthDataset.value;
  if (step == 1) return studentDataset.value;
}

window.addEventListener('scroll', (): void => {
  const currentStep = getCurrentStepIndex();

  if (currentStep !== lastStep) {
    lastStep = currentStep;
    const dataset = getDatasetForStep(currentStep);
    if (currentStep === 0) {
      (document.getElementById('outlier-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('correlation-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('correlation-neg-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('range-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('select-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('filter-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('move-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('invert-button') as HTMLButtonElement).disabled = true;
    } else {
      (document.getElementById('outlier-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('correlation-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('correlation-neg-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('range-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('select-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('filter-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('move-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('invert-button') as HTMLButtonElement).disabled = false;
    }
    drawChart(dataset);
  }
});

onMounted(async (): Promise<void> => {
  healthDataset.value = await loadDataset('data/healthdata.csv');
  drawChart(healthDataset.value);
  studentDataset.value = await loadDataset('data/student-marks.csv');
  loadContent(introText, 'content/introduction.html');
  loadContent(dataText, 'content/data.html');
  loadContent(interactivityText, 'content/interactivity.html');
  loadContent(usageText, 'content/usage.html');
  loadContent(caseStudy1Text, 'content/casestudy1.html');
  loadContent(caseStudy2Text, 'content/casestudy2.html');
  loadContent(healthDatasetText, 'content/healthdata.html');
  loadContent(studentDatasetText, 'content/studentmarksdata.html');

  await nextTick();

  if (!supportsScrollDrivenAnimations) {
    gsap.to(header.value, {
      height: '6.5vh',
      fontSize: '2rem',
      backgroundPosition: '50% 100%',
      paddingLeft: '1rem',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: '+=90vh',
        scrub: 0.2,
        invalidateOnRefresh: true,
      },
      ease: 'none',
    });

    gsap.to(multiLine.value, {
      opacity: 0,
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: '+=80vh',
        scrub: 0.2,
        onUpdate: (self) => {
          if (multiLine.value) {
            multiLine.value.style.visibility =
              self.progress < 1 ? 'visible' : 'hidden'
          }
        }
      },
      ease: 'none'
    });

    gsap.to(singleLine.value, {
      opacity: 1,
      scrollTrigger: {
        trigger: document.body,
        start: '+=80vh',
        end: '+=90vh',
        scrub: 0.2,
        onUpdate: self => {
          if (singleLine.value) {
            singleLine.value.style.visibility =
              self.progress > 0 ? 'visible' : 'hidden'
          }
        }
      },
      ease: 'none'
    });
  }

  scroller.setup({
    step: '.step',
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

  font-size: calc(3vw + 1rem);
  padding: 0 5vw;

  will-change: transform, height, font-size;
  contain: layout style;
}

.multi-line,
.single-line {
  position: absolute;
  text-align: center;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  width: 100%;
  max-width: 90vw;
  word-wrap: break-word;
}

.multi-line {
  opacity: 1;
  visibility: visible;
  transition: opacity 0.2s ease;
}

.single-line {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease;
}

.use-native {
  animation: sticky-header-move-and-size linear forwards;
  animation-timeline: scroll();
  animation-range: 0vh 90vh;
}

.use-native .multi-line {
  animation: multiTextOut linear forwards;
  animation-timeline: scroll();
  animation-range: 0vh 80vh;
}

.use-native .single-line {
  animation: singleTextIn linear forwards;
  animation-timeline: scroll();
  animation-range: 80vh 90vh;
}

@keyframes sticky-header-move-and-size {
  from {
    background-position: 50% 0%;
    height: 100vh;
    width: 100%;
    font-size: calc(3vw + 1rem);
  }

  to {
    background-position: 50% 100%;
    height: 6.5vh;
    width: 100%;
    font-size: 2rem;
    padding-left: 1rem;
  }
}

@keyframes multiTextOut {
  from {
    opacity: 1;
    visibility: visible;
  }

  to {
    opacity: 0;
    visibility: hidden;
  }
}

@keyframes singleTextIn {
  from {
    opacity: 0;
    visibility: hidden;
  }

  to {
    opacity: 1;
    visibility: visible;
  }
}

.header-spacer-native {
  height: 100vh;
}

.header-spacer-polyfill {
  height: 30vh;
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
  color: black;
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
  padding-top: 2rem;
  margin-right: 2rem;
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

@media (max-width: 960px) {
  .explorable-explainer {
    flex-direction: column;
  }
  
  .main-chart {
    position: fixed;
    top: 3rem;
    left: 0;
    width: 100%;
    background: white;
    z-index: 100;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  .chart-container {
    min-width: 100%;
    padding-left: 1.7rem;
    padding-bottom: 0;
  }

  .text-container {
    min-width: 100%;
    padding-left: 1.7rem;
  }

  @keyframes sticky-header-move-and-size {
    from {
      background-position: 50% 0%;
      height: 100vh;
      width: 100%;
      font-size: calc(2vw + 1rem);
    }

    to {
      background-position: 50% 100%;
      height: 7vh;
      width: 100%;
      font-size: 1rem;
      padding-left: 1rem;
    }
  }
}
</style>
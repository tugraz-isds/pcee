<!-- eslint-disable no-undef -->
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
      <div class="main-chart">
        <h3 id="chart-title">Personal Finances Dataset</h3>
        <div id="parallelcoords" />
      </div>
    </div>
    <div class="text-container">
      <div v-html="introText" />
      <div v-html="financeDatasetText" />
      <div class="table-container">
        <table border="1">
          <thead>
            <tr>
              <th
                v-for="column in columns"
                :key="column.key"
                class="header"
              >
                <div class="header-cell">
                  <input
                    v-model="column.label"
                    type="text"
                    placeholder="Column name"
                    class="header-input"
                  >
                  <button
                    class="header-button"
                    @click="deleteColumn(column.key)"
                  >
                    -
                  </button>
                </div>
              </th>
              <th class="narrow-column">
                <!-- Add Column Button -->
                <button
                  class="add-button"
                  @click="addColumn"
                >
                  +
                </button>
              </th>
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
                :class="{
                  'text-right': column.type === 'number',
                  'text-left': column.type === 'string'
                }"
              >
                <input
                  v-model="row[column.key]"
                  type="text"
                  :class="{
                    'text-right': column.type === 'number',
                    'text-left': column.type === 'string'
                  }"
                >
              </td>
              <td class="narrow-column">
                <!-- Delete Row Button -->
                <button
                  class="delete-button"
                  @click="deleteRow(rowIndex)"
                >
                  -
                </button>
              </td>
            </tr>
            <!-- Control Row -->
            <tr>
              <td :colspan="columns.length">
                <button
                  :disabled="!isFormValid"
                  @click="redrawChart"
                >
                  Redraw Chart
                </button>
                <button @click="resetTable">
                  Reset Table
                </button>
              </td>
              <td class="narrow-column">
                <!-- Add Row Button -->
                <button
                  class="add-button"
                  @click="addRow"
                >
                  +
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-html="interactiveOperationsText" />
      <div v-html="recordOperationsText" />
      <div v-html="dimensionOperationsText" />
      <div v-html="healthDatasetText" />
      <div
        ref="usageContainer" 
        class="cursor-zoom-in"
        v-html="usageText" 
      />
      <div v-html="caseStudy1Text" />
      <div v-html="caseStudy2Text" />
      <div v-html="multipleViewsText" />
      <!--<div v-html="referencesDatasetText" />-->
      <div
        v-if="zoomSrc"
        class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 z-[9999]"
        @click="zoomSrc = null"
      >
        <img
          :src="zoomSrc"
          class="max-h-[90%] max-w-[90%] object-contain w-auto h-auto cursor-zoom-out"
        >
      </div> 
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, type Ref } from 'vue';
import * as spcd3 from '../spcd3.js';
import { columnsFinance, rowsFinance } from '../data.js';
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger);

interface Column {
  key: string
  label: string
  type: string
}

type Row = Record<string, unknown>;

const introText = ref('');
const dataText = ref('');
const interactivityText = ref('');
const interactiveOperationsText = ref('');
const recordOperationsText = ref('');
const dimensionOperationsText = ref('');
const usageText = ref('');
const caseStudy1Text = ref('');
const caseStudy2Text = ref('');
const healthDatasetText = ref('');
const studentDatasetText = ref('');
const multipleViewsText = ref('');
const financeDatasetText = ref('');
const referencesDatasetText = ref('');
const textArea = ref(null);
const healthDataset = ref('');
const studentDataset = ref('');
const financeDataset = ref('');
const newColumn = ref('');
const columns = ref<Column[]>(structuredClone(columnsFinance));
const rows = ref<Row[]>(structuredClone(rowsFinance));
const header = ref<HTMLElement | null>(null);
const multiLine = ref<HTMLElement | null>(null);
const singleLine = ref<HTMLElement | null>(null);
const supportsScrollDrivenAnimations: boolean =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()');
let lastStep = -1;

// eslint-disable-next-line no-undef
const usageContainer = ref<HTMLDivElement | null>(null);
const zoomSrc = ref<string | null>(null);

// eslint-disable-next-line no-undef
const handleClick = (e: Event): void => {
  const target = e.target as HTMLElement;
    // eslint-disable-next-line no-undef
    const img = target.closest("img") as HTMLImageElement | null;
    if (img) {
      zoomSrc.value = img.src;
    }
}

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
  }
  else {
    spcd3.showMarker('Age');
    spcd3.setInversionStatus('Age', 'descending');
    // eslint-disable-next-line no-undef
    setTimeout(() => {
    spcd3.hideMarker('Age');
  }, 1000); 
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

const addColumn = (): void => {
  const trimmed = newColumn.value.trim();
  let newCol: Column = {key: '', label: '', type: ''};
  if (trimmed) {
    newCol = { key: trimmed, label: trimmed, type: 'number' };
  }
  columns.value.push(newCol);
  rows.value.forEach(row => {
    row[newCol.key] = '';
  });
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
  columns.value = structuredClone(columnsFinance);
  rows.value = structuredClone(rowsFinance);
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

const getCurrentStepIndex = (): number => {
  const steps = document.querySelectorAll<HTMLElement>('.step');
  let currentIndex = 0
  let maxVisibleTop: number | null = null

  steps.forEach((step) => {
    const rect = step.getBoundingClientRect()
    const isHalfInView = rect.top <= window.innerHeight * 0.5
    if (isHalfInView && (maxVisibleTop === null || rect.top > maxVisibleTop)) {
      maxVisibleTop = rect.top;
      currentIndex = parseInt(step.dataset.step ?? "0", 10);
    }
  })
  return currentIndex
}

const getDatasetForStep = (step: number): string | undefined => {
  if (step == 0) return financeDataset.value;
  if (step == 1) return healthDataset.value;
  if (step == 2) return studentDataset.value;
}

const writeTitleToDataset = (step: number): void => {
  // eslint-disable-next-line no-undef
  const titleElement = document.getElementById("chart-title") as HTMLHeadingElement | null;
  if (titleElement == null) return;
  if (step == 0) {
    titleElement.textContent = "Personal Finances Dataset";
  }
  else if (step == 1) {
    titleElement.textContent = "Heart Health Dataset";
  }
  else if (step == 2) {
    titleElement.textContent = "Student Marks Dataset";
  }
  else 
  {
    titleElement.textContent = "";
  }
}

window.addEventListener('scroll', (): void => {
  const currentStep = getCurrentStepIndex();
  if (currentStep !== lastStep) {
    lastStep = currentStep;
    const dataset = getDatasetForStep(currentStep);
     writeTitleToDataset(currentStep);
    if (currentStep === 1) {
      (document.getElementById('outlier-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('correlation-button') as HTMLButtonElement).disabled = false;
      (document.getElementById('correlation-neg-button') as HTMLButtonElement).disabled = false;
    } else {
      (document.getElementById('outlier-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('correlation-button') as HTMLButtonElement).disabled = true;
      (document.getElementById('correlation-neg-button') as HTMLButtonElement).disabled = true;
    }
    drawChart(dataset);
  }
});

onBeforeUnmount(() => {
  if (usageContainer.value) {
    usageContainer.value.removeEventListener("click", handleClick);
  }
})

onMounted(async (): Promise<void> => {
  healthDataset.value = await loadDataset('data/healthdata.csv');
  financeDataset.value = await loadDataset('data/finance.csv');
  studentDataset.value = await loadDataset('data/student-marks.csv');
  drawChart(financeDataset.value);
  loadContent(introText, 'content/introduction.html');
  loadContent(dataText, 'content/data.html');
  loadContent(interactivityText, 'content/interactivity.html');
  loadContent(interactiveOperationsText, 'content/interactiveoperations.html');
  loadContent(recordOperationsText, 'content/recordoperations.html');
  loadContent(dimensionOperationsText, 'content/dimensionoperations.html');
  loadContent(usageText, 'content/usage.html');
  loadContent(caseStudy1Text, 'content/casestudy1.html');
  loadContent(caseStudy2Text, 'content/casestudy2.html');
  loadContent(healthDatasetText, 'content/healthdata.html');
  loadContent(studentDatasetText, 'content/studentmarksdata.html');
  loadContent(multipleViewsText, 'content/multipleviews.html');
  loadContent(financeDatasetText, 'content/personalfinances.html');
  loadContent(referencesDatasetText, 'content/references.html');

  const container = usageContainer.value;
  if(container) {
    container.addEventListener('click', handleClick);
  }

  await nextTick();

  if (!supportsScrollDrivenAnimations) {
    gsap.to(header.value, {
      height: '6.8vh',
      backgroundPosition: '50% 100%',
      paddingLeft: '1rem',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: '+=90vh',
        scrub: 2,
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
        scrub: 2,
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
        scrub: 2,
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
});

</script>

<style>
/* Header native and polyfill */
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

  color: white;
  background: rgba(0, 129, 175, 1);
  pointer-events: none;
  font-size: xx-large;

  z-index: 1000;

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
}

.single-line {
  opacity: 0;
  visibility: hidden;
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

.use-native {
  animation: sticky-header-move-and-size-desktop linear forwards;
  animation-timeline: scroll();
  animation-range: 0vh 90vh;
}

@media (max-width: 960px) and (orientation: portrait){
  .use-native {
    animation: sticky-header-move-and-size-tablet linear forwards;
    animation-timeline: scroll();
    animation-range: 0vh 90vh;
  }

  .sticky-header {
    font-size: large;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .use-native {
    animation: sticky-header-move-and-size-mobile linear forwards;
    animation-timeline: scroll();
    animation-range: 0vh 90vh;
  }

  .sticky-header {
    font-size: medium;
  }
}

@keyframes sticky-header-move-and-size-desktop {
  from {
    background-position: 50% 0%;
    height: 100vh;
    width: 100%;
    font-size: 3rem;
  }

  to {
    background-position: 50% 100%;
    height: 6.5vh;
    width: 100%;
    font-size: 2rem;
    padding-left: 1rem;
  }
}

@media (max-width: 960px) and (orientation: portrait) {
  @keyframes sticky-header-move-and-size-tablet {
    from {
      background-position: 50% 0%;
      height: 100vh;
      width: 100%;
      font-size: 3rem;
    }

    to {
      background-position: 50% 100%;
      height: 6vh;
      width: 100%;
      font-size: 1.3rem;
      padding-left: 1rem;
    }
  }
}

@media (max-width: 600px) and (orientation: portrait) {
  @keyframes sticky-header-move-and-size-tablet {
    from {
      background-position: 50% 0%;
      height: 100vh;
      width: 100%;
      font-size: 2rem;
    }

    to {
      background-position: 50% 100%;
      height: 6vh;
      width: 100%;
      font-size: 1rem;
      padding-left: 1rem;
    }
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  @keyframes sticky-header-move-and-size-mobile {
    from {
      background-position: 50% 0%;
      height: 100vh;
      width: 100%;
      font-size: 2rem;
    }

    to {
      background-position: 50% 100%;
      height: 6.5vh;
      width: 100%;
      font-size: 1rem;
      padding-left: 1.25rem;
    }
  }
}

.header-spacer-native {
  height: 100vh;
}

.header-spacer-polyfill {
  height: 40vh;
}

/* Desktop (chart and text row) */
#pc_svg {
  height: 31rem;
  justify-content: 'center';
  text-align: 'center';
}

#toolbarRow {
 font-size: 0.8vw !important;
}

.explorable-explainer {
  display: flex;
  gap: 1rem;
}

.chart-container {
  flex: 1 1 30rem;
  position: relative;
  justify-content: center;
}

.main-chart {
  position: sticky;
  top: calc(10vh + 2rem);
  padding-top: 3rem;
  display: grid !important;
  justify-content: center !important;
  align-items: center !important;
  padding: 0;
}

.text-container {
  flex: 1 1 23rem;
  min-width: 23rem;
  flex-direction: column;
  width: 100%;
}

/* Tablet portrait (chart and text column) */
@media (max-width: 960px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column;
  }

  .main-chart {
    position: fixed;
    top: 4.5rem;
    left: 0;
    width: 100%;
    background: white;
    z-index: 100;
  }

  .chart-container {
    flex: 1 1 20rem;
    min-width: 100%;
    padding-left: 1.7rem;
    padding-bottom: 0;
  }

  .text-container {
    min-width: 100%;
    padding-left: 1.7rem;
  }

  #pc_svg {
    height: 20rem;
    justify-content: 'center';
    text-align: 'center';
  }
}

/* Mini tablet (chart and text column)*/
@media (max-width: 768px) and (orientation: portrait) {
  .main-chart {
    top: 3rem;
  }
}

/* Mobile portrait (chart and text column) */
@media (max-width: 600px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column;
  }

  .main-chart {
    position: fixed;
    top: 2rem;
    left: 0;
    width: 100%;
    background: white;
    z-index: 100;
  }

  .chart-container {
    flex: 1 1 20rem;
    min-width: 100%;
    padding-left: 1.7rem;
    padding-bottom: 0;
  }

  .text-container {
    min-width: 100%;
    padding-left: 1.7rem;
  }

  #pc_svg {
    height: 20rem;
    justify-content: 'center';
    text-align: 'center';
  }
}

/* Mobile landscape (chart and text row) */
@media (max-height: 500px) and (orientation: landscape) {
  .explorable-explainer {
    flex-direction: row;
  }

  .main-chart {
    position: sticky;
    top: 2rem;
    padding-top: 0;
    height: auto;
  }

  .chart-container {
    flex: 1 1 50%;
    min-width: 40%;
    padding: 0;
  }

  .text-container {
    flex: 1 1 50%;
    min-width: 40%;
    padding: 0 1rem;
  }

  #pc_svg {
    height: 16rem;
    justify-content: 'center';
    text-align: 'center';
  }
}

/* Sections in Textcontainer with animation */
section {
  text-align: justify;
  width: calc(100% - 2rem);
  max-width: 100%;
  background: rgb(229, 229, 220);
  border-radius: 0.3rem;
  margin-top: 1rem;
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

/* Misc Headers */

#chart-title {
  font-size: 1.4rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 1rem;
}

h2 {
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
}

h3 {
  padding-left: 1rem;
  margin-bottom: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
}

h4 {
  padding-left: 1rem;
  padding-top: 0.5rem;
  margin-bottom: 0;
}

p {
  border-left: 1rem solid transparent;
  margin-bottom: 0.5rem;
}

/* listings */

ul {
  border-left: 1rem solid transparent;
  padding-left: 1rem;
  margin-top: 0;
}

.liheading {
  font-weight: bold;
  margin-top: 1rem;
}

.litext {
  border-left: 0rem solid transparent;
}

.liuitext {
  border-left: 0rem solid transparent;
  font-style: italic;
  color: rgb(228, 90, 15);
}

/* Table */

.table-container {
  flex: 1 1 20rem;
  max-height: 30rem;
  overflow-y: auto;
  padding-top: 1rem;
  margin-right: 2rem;
  position: relative;
  isolation: isolate;
}

table {
  text-align: justify;
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

th, td {
  position: relative;
  overflow: hidden;
  padding: 0.5rem 0.75rem;
}

td {
  background-color: rgb(229, 229, 220);
  padding: 0.2rem;
  z-index: 0
}

th {
  background-color: rgba(30,61,89,0.8);
  color: white;
  padding: 0.3rem;
}

.header {
  overflow: scroll;
  white-space: normal;
}

.header-cell {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
}

.header-input {
  flex: 1 1 auto;
  min-width: 4rem;
  box-sizing: border-box;
  padding: 0.25rem 0.5rem;
}

.header-button {
  flex: 0 0 auto;
  padding: 0 0.5rem;
  background: white;
  color: black;
  border: none;
  border-radius: 75%;
  cursor: pointer;
  width: 1.2rem;
  height: 1.2rem;
  line-height: 1.2rem;
}

.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}

th .delete-button,
th .add-button,
td .delete-button,
td .add-button {
  border: none;
  background: white;
  border-radius: 75%;
  width: 1.2rem;
  height: 1.2rem;
  line-height: 1.2rem;
  text-align: center;
  cursor: pointer;
  font-size: 1rem;
  padding: 0;
  margin-top: 0.5rem;
  margin-right: 0.2rem;
  color: black;
  font-weight: bold;
  top: 0.2rem;
  right: 0.5rem;
  position: absolute;
}

.narrow-column {
  width: 2.5rem;
  text-align: center;
}

input[type="text"] {
  width: 100%;
  padding: 0.3rem;
  box-sizing: border-box;
}

th input[type="text"] {
  width: auto !important;
}

/* Buttons */

button {
  padding: 0.25rem;
  margin-right: 0.5rem;
}

.usage-button {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

/* Figures */

.figure-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding-left: 2rem;
  padding-top: 0.5rem;
  max-width: 100%;
  justify-content: center;
  align-items: center;
}

figure {
  flex: 1 1 8rem;
  text-align: center;
  margin: 0;
}

figcaption {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: smaller;
}
</style>
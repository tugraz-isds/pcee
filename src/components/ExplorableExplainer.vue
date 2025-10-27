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
      class="chart-container flex-1 basis-[30rem] relative justify-center"
    >
      <StatusDropdown :offset="60" />
      <div class="main-chart">
        <h3 id="chart-title">
          Personal Finances Dataset
        </h3>
        <div id="parallelcoords" />
      </div>
    </div>
    <div class="text-container flex-1 basis-[23rem] min-w-[23rem] flex flex-col w-full">
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
                    :title="column.label"
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
                  :type="column.type === 'number' ? 'number' : 'text'"
                  :class="{
                    'text-right': column.type === 'number',
                    'text-left': column.type === 'string'
                  }"
                  @blur="recomputeColumnType(column)"
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

      <div v-html="recordOperationsText" />
      <div v-html="dimensionOperationsText" />
      <div v-html="healthDatasetText" />
      <div
        ref="usageContainer" 
        v-html="usageText" 
      />
      <div 
        class="stepper"
        content-section
      >
        <div>
          <h2>7. Case Study: Student Marks</h2>
        </div>
        <p 
          class="step"
          data-step="2"
        >
          By using the interactions described above, interesting observations can be made within a dataset.
        </p>

        <ol>
          <li
            v-for="(step, index) in steps"
            :key="step.title"
            :class="{ active: index === currentStep }"
          >
            {{ step.title }}
          </li>
          <li> 
            <button
              id="activate-button"
            >
              Interact Directly
            </button>
          </li>
        </ol>

        <div class="buttons">
          <button
            id="reset-button"
            class="stepper-button"
            :disabled="currentStep === 0"
            @click="reset"
          >
            <img 
              src="/svg/reset-button.svg"
              width="16" 
              height="16"
            >
          </button>
          <button
            id="start-button"
            class="stepper-button"
            :disabled="currentStep === 0"
            @click="back"
          >
            <img 
              src="/svg/back-button.svg"
              width="16" 
              height="16"
            >
          </button>
          <button
            class="stepper-button"
            :disabled="currentStep === steps.length - 1"
            @click="next"
          >
            <img 
              src="/svg/next-button.svg"
              width="16" 
              height="16"
            >
          </button>
          <button
            class="stepper-button"
            :disabled="currentStep === steps.length - 1"
            @click="skip"
          >
            <img 
              src="/svg/skip-button.svg"
              width="16" 
              height="16"
            >
          </button>
        </div>

        <div class="step-indicator">
          <span
            v-for="(step, index) in steps"
            :key="index"
            :class="{ active: index === currentStep }"
          >
            {{ index + 1 }}
          </span>
        </div>

        <h3>{{ steps[currentStep].title }}</h3>

        <p>
          {{ steps[currentStep].content }}
        </p>
      </div>
      <div v-html="multipleViewsText" />
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
  <div id="border" />
  <div v-html="referencesDatasetText" />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, nextTick, type Ref, provide } from 'vue';
import * as spcd3 from '../spcd3.js';
import { columnsFinance, rowsFinance } from '../data.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import StatusDropdown from './StatusDropdown.vue';

gsap.registerPlugin(ScrollTrigger);

interface Column {
  key: string
  label: string
  type?: number | string
}

type Row = Record<string, unknown>;

const introText = ref('');
const recordOperationsText = ref('');
const dimensionOperationsText = ref('');
const usageText = ref('');
const healthDatasetText = ref('');
const studentDatasetText = ref('');
const multipleViewsText = ref('');
const financeDatasetText = ref('');
const referencesDatasetText = ref('');
const invertText = ref('');
const filterText = ref('');
const moveText = ref('');
const rangeText = ref('');
const selectText = ref('');
const summaryText = ref('');
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
// eslint-disable-next-line no-undef
const image = new Image();
image.src = 'images/mva.png';
provide('image', image);

const supportsScrollDrivenAnimations: boolean =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()');
let lastStep = -1;
let status = false;

const steps = [
  { title: 'Student Marks Dataset', content: studentDatasetText},
  { title: 'Adjust Dimension Range', content: rangeText },
  { title: 'Select Record', content: selectText },
  { title: 'Filter Record', content: filterText },
  { title: 'Move Dimension', content: moveText },
  { title: 'Invert Dimension', content: invertText },
  { title: 'Summary', content: summaryText}
];

const currentStep = ref(0);

const next = (): void => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
  triggerNext(currentStep.value);
}

const back = (): void => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
  triggerBack(currentStep.value);
}

const reset = (): void => {
  currentStep.value = 0;
  triggerReset();
}

const skip = (): void => {
  currentStep.value = 6;
  triggerSkip();
}

function wait(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

const triggerReset = async (): Promise<void> => {
  invertDimensionBack();
  currentStep.value = 5;
  await wait(800);
  moveDimensionBack();
  currentStep.value = 4;
  await wait(800);
  filterRecordsBack();
  currentStep.value = 3;
  await wait(800);
  selectRecordBack();
  currentStep.value = 2;
  await wait(800);
  setRangeBack();
  currentStep.value = 1;
  await wait(800);
  currentStep.value = 0;
}

const triggerSkip = async (): Promise<void> => {
  setRangeNext();
  currentStep.value = 1;
  await wait(800);
  selectRecordNext();
  currentStep.value = 2;  
  await wait(800);
  moveDimensionNext();
  currentStep.value = 3;
  await wait(800);
  filterRecordsNext();
  currentStep.value = 4;
  await wait(800);
  invertDimensionNext();
  currentStep.value = 5;
  await wait(800);
  currentStep.value = 6;
}

const triggerNext = async (currentStep: number): Promise<void> => {
  switch(currentStep) {
    case 0:
      break;
    case 1:
      setRangeNext();
      await wait(800);
      break;
    case 2:
      selectRecordNext();
      await wait(800);
      break;
    case 3:
      filterRecordsNext();
      await wait(800);
      break;
    case 4:
      moveDimensionNext();
      await wait(800);
      break;
    case 5:
      invertDimensionNext();
      await wait(800);
      break;
    default:
      break;
  }
}

const triggerBack = async (currentStep: number): Promise<void> => {
  switch(currentStep) {
    case 0:
      setRangeBack();
      await wait(800);
      break;
    case 1:
      selectRecordBack();
      await wait(800);
      break;
    case 2:
      filterRecordsBack();
      await wait(800);
      break;
    case 3:
      moveDimensionBack();
      await wait(800);
      break;
    case 4:
      invertDimensionBack();
      await wait(800);
      break;
    case 5:
      break;
    default:
      break;
  }
}

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
  const activateButton = document.getElementById('activate-button');
  if (activateButton) {
    activateButton.addEventListener('click', activateChart);
  }
}

const activateChart = async (): Promise<void> => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.stepper-button');
  const currentStepIndex = getCurrentStepIndex();
  if (currentStepIndex !== 2) return;
  if (!status) {
  // eslint-disable-next-line no-undef
    const chart = document.getElementById("parallelcoords") as HTMLDivElement | null;
    if (chart != null) {
        chart.style.pointerEvents = "auto";
    }
    // eslint-disable-next-line no-undef
    const toolbar = (document.getElementById('toolbarRow') as HTMLDivElement);
    if (toolbar !== null) {
      toolbar.style.setProperty("font-size", "0.8vw", "important");
    }
    // eslint-disable-next-line no-undef
    document.querySelectorAll<SVGPathElement>("path").forEach(p => {
      p.style.pointerEvents = "stroke";
    });
    buttons.forEach(btn => {
      btn.disabled = true;
    });
    status = true;
    (document.getElementById('activate-button') as HTMLButtonElement).textContent = "Step through";
    currentStep.value = 0;
  }
  else {
    const dataset = getDatasetForStep(currentStepIndex);
    writeTitleToDataset(currentStepIndex);
    drawChart(dataset);
    // eslint-disable-next-line no-undef
    const chart = document.getElementById("parallelcoords") as HTMLDivElement | null;
    if (chart != null) {
        chart.style.pointerEvents = "none";
    }
    // eslint-disable-next-line no-undef
    const toolbar = (document.getElementById('toolbarRow') as HTMLDivElement);
    if (toolbar !== null) {
      toolbar.style.setProperty("font-size", "0vw", "important");
    }
    // eslint-disable-next-line no-undef
    document.querySelectorAll<SVGPathElement>("path").forEach(p => {
      p.style.pointerEvents = "none";
    });
    buttons.forEach(btn => {
      if (btn.id === "start-button" || btn.id === "reset-button") {
        btn.disabled = true;
      }
      else {
        btn.disabled = false;
      }
    });

    status = false;
    (document.getElementById('activate-button') as HTMLButtonElement).textContent = "Interact Directly";
  }
}

const selectOutlier = (): void => {
// eslint-disable-next-line no-undef
  const showError = document.getElementById("show-error") as HTMLParagraphElement | null;

  const isOutlierInactive = spcd3.isRecordInactive("Patient F");

  if (isOutlierInactive) {
    if (showError) {
      showError.textContent = "Outlier (Patient F) is filtered out!";
      return;
    }
  }
  else {
    if (showError) {
      showError.textContent = "";
    }
  }

  // eslint-disable-next-line no-undef
  const path = document.getElementById("Patient-F") as SVGPathElement | null;
  if (path) {
    // eslint-disable-next-line no-undef
    const stroke = getComputedStyle(path).getPropertyValue("stroke");
    if (stroke === 'rgb(211, 211, 211)') {
      return;
    }
  }  

  if (spcd3.isSelected('Patient F') && (document.getElementById('outlier-button') as HTMLButtonElement).textContent === 'Show Outlier') {
    (document.getElementById('outlier-button') as HTMLButtonElement).textContent = 'Hide Outlier';
  }
  else if (!spcd3.isSelected('Patient F') && (document.getElementById('outlier-button') as HTMLButtonElement).textContent !== 'Show Outlier') {
    (document.getElementById('outlier-button') as HTMLButtonElement).textContent = 'Show Outlier';
  }
  else if (spcd3.isSelected('Patient F') && (document.getElementById('outlier-button') as HTMLButtonElement).textContent !== 'Show Outlier') {
    spcd3.setUnselected('Patient F');
    (document.getElementById('outlier-button') as HTMLButtonElement).textContent = 'Show Outlier';
  }
  else {
    spcd3.setSelected('Patient F');
    (document.getElementById('outlier-button') as HTMLButtonElement).textContent = 'Hide Outlier';
  }
};

const showPositiveCorrelation = (): void => {
  const hiddenDimensions = spcd3.getAllHiddenDimensionNames();
  const isHidden = hiddenDimensions.includes("Age");
  // eslint-disable-next-line no-undef
  const invertError = document.getElementById("invert-error") as HTMLParagraphElement | null;

  if (isHidden) {
    if (invertError) {
      invertError.textContent = "Age Dimension is hidden!";
      return;
    }
  }
  else {
    if (invertError) {
      invertError.textContent = "";
    }
  }

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
  const hiddenDimensions = spcd3.getAllHiddenDimensionNames();
  const isHiddenFitness = hiddenDimensions.includes("Fitness Score");
  const isHiddenAge = hiddenDimensions.includes("Age");
  // eslint-disable-next-line no-undef
  const moveError = document.getElementById("move-error") as HTMLParagraphElement | null;
  if (isHiddenFitness || isHiddenAge) {
    if (moveError) {
      moveError.textContent = "Fitness Score and/or Age is hidden!";
      return;
    }
  }
  else {
    if (moveError) {
      moveError.textContent = "";
    }
  }

  const posFitness = spcd3.getDimensionPosition('Fitness Score');
  const posAge = spcd3.getDimensionPosition('Age');
  const diff = posAge - posFitness;
  if (diff === 1) {
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).textContent = 'Move Fitness Score Dimension';
    spcd3.move('Fitness Score', true, 'Cholesterol');
  }
  else {
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).textContent = 'Move Fitness Score Dimension';
    spcd3.move('Fitness Score', true, 'Age');
  }
}

const setRangeNext = (): void => {
  const dimensions = spcd3.getAllDimensionNames();
  dimensions.forEach(function (dimension: string) {
    if (!isNaN(spcd3.getMinValue(dimension))) {
      spcd3.setDimensionRange(dimension, 0, 100);
    }
  });
}

const setRangeBack = (): void => {
  const dimensions = spcd3.getAllDimensionNames();
  dimensions.forEach(function (dimension: string) {
    if (!isNaN(spcd3.getMinValue(dimension))) {
      const min = spcd3.getMinValue(dimension);
      const max = spcd3.getMaxValue(dimension);
      spcd3.setDimensionRange(dimension, min, max);
    }
  });
}

const selectRecordNext = (): void => {
    spcd3.setSelected('Sylvia');
}

const selectRecordBack = (): void => {
    spcd3.setUnselected('Sylvia');
}

const filterRecordsNext = (): void => {
  if(spcd3.getInversionStatus('English') === 'descending') {
    spcd3.setFilter('English', 50, 100);
  }
  else {
     spcd3.setFilter('English', 100, 50);
  }
}

const filterRecordsBack = (): void => {
  const values = spcd3.getDimensionRange('English');
  if(spcd3.getInversionStatus('English') === 'ascending') {
    spcd3.setFilter('English', values[1], values[0]);
  }
  else {
    spcd3.setFilter('English', values[1], values[0]);
  }
  // eslint-disable-next-line no-undef
  document.querySelectorAll<SVGPathElement>("path").forEach(p => {
    p.style.pointerEvents = "none";
  });
}

const moveDimensionNext = (): void => {
  spcd3.move('German', true, 'English');
}

const moveDimensionBack = (): void => {
  spcd3.move('German', true, 'Biology');
}

const invertDimensionNext = (): void => {
  if(spcd3.getInversionStatus('English') === 'ascending') {
    spcd3.setInversionStatus('English', 'descending');
  }
}

const invertDimensionBack = (): void => {
  if(spcd3.getInversionStatus('English') === 'descending') {
    spcd3.setInversionStatus('English', 'ascending');
  }
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
};

const isNumericString = (value: unknown): boolean => {
  if (value == null) return false;
  const stringValue = String(value).trim();
  if (!stringValue) return false;
  const normalized = stringValue
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(/,(?=\d{3}\b)/g, '')
    .replace(',', '.');
  return !isNaN(Number(normalized));
};

const detectColumnTypeFromRows = (rows: Record<string, unknown>[], colKey: string): 'string' | 'number'  => {
  const values = rows.map(r => r[colKey]);
  const nonEmpty = values.filter(v => String(v ?? '').trim() !== '');
  if (nonEmpty.length === 0) return 'string';
  const numericCount = nonEmpty.filter(isNumericString).length;
  return numericCount >= Math.ceil((2 * nonEmpty.length) / 3) ? 'number' : 'string';
};

const recomputeColumnType = (col: Column) => {
  col.type = detectColumnTypeFromRows(rows.value, col.key);
};

let colCounter = 0;
const addColumn = (): void => {
  const trimmed = newColumn.value.trim();
  const label = trimmed;
  const newCol: Column = { key: `col_${colCounter++}`, label };
  columns.value.push(newCol);
  rows.value.forEach(row => {
    row[newCol.key] = '';
  });
  newColumn.value = '';
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
    if (newData !== undefined) {
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

const getOrientation = (): number => {
  if (window.innerWidth < 600) {
    return window.innerHeight * 0.95;
  } else if (window.innerWidth < 1200) {
    return window.innerHeight * 0.95;
  } else {
    return window.innerHeight * 0.5;
  }
}

const getCurrentStepIndex = (): number => {
  const steps = document.querySelectorAll<HTMLElement>('.step');
  let currentIndex = 0
  let maxVisibleTop: number | null = null

  steps.forEach((step) => {
    const rect = step.getBoundingClientRect()
    const steppoint = getOrientation();
    const isHalfInView = rect.top <= steppoint;
    if (isHalfInView && (maxVisibleTop === null || rect.top > maxVisibleTop)) {
      maxVisibleTop = rect.top;
      currentIndex = parseInt(step.dataset.step ?? "0", 10);
    }
  })
  return currentIndex
}

const getDatasetForStep = (step: number): string | undefined => {
  if (step === 0) return financeDataset.value;
  if (step === 1) return healthDataset.value;
  if (step === 2) return studentDataset.value;
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
    titleElement.textContent = "Case Study: Student Marks";
  }
  else if (step == 3) {
    titleElement.textContent = "Coordinated Multiple Views";
  }
  else {
    titleElement.textContent = "";
  }
}

window.addEventListener('scroll', () => {
  // eslint-disable-next-line no-undef
  const chart = document.getElementById('parallelcoords') as HTMLDivElement | null;
  if (!chart) return;

  const step = getCurrentStepIndex();
  if (step === lastStep) return;
  lastStep = step;

  const dataset = getDatasetForStep(step);
  writeTitleToDataset(step);
  chart.style.opacity = '0';

  window.setTimeout(() => {
    if (step === 4) {
      chart.style.visibility = 'hidden';
      chart.innerHTML = '';
    }
    else if (step === 3) {
      chart.style.visibility = 'visible';
      chart.style.pointerEvents = 'auto';
      chart.className = 'cursor-zoom-in';
      chart.innerHTML = `
        <figure>
          <img class="pic" src="images/mva.png" />
          <figcaption style="font-size:x-small;">
            Figure 5: Multidimensional Visual Analyser (MVA)
          </figcaption>
        </figure>`;
      chart.style.maxHeight = 'auto';
      chart.style.justifyContent = 'center';
      chart.style.alignItems = 'center';
      chart.onclick = handleClick;
    }
    else if (step === 2) {
      chart.style.visibility = 'visible';
      chart.className = 'pointer';
      chart.innerHTML = '';
      chart.style.pointerEvents = 'none';
      chart.style.maxWidth = '100%';
      chart.style.maxHeight = 'auto';
      drawChart(dataset);
      // eslint-disable-next-line no-undef
      const toolbar = document.getElementById('toolbarRow') as HTMLDivElement | null;
      if (toolbar) toolbar.style.setProperty('font-size', '0vw', 'important');
      // eslint-disable-next-line no-undef
      document.querySelectorAll<SVGPathElement>('path').forEach(p => (p.style.pointerEvents = 'none'));
      (document.getElementById('outlier-button') as HTMLButtonElement | null)?.setAttribute('disabled', '');
      (document.getElementById('correlation-button') as HTMLButtonElement | null)?.setAttribute('disabled', '');
      (document.getElementById('correlation-neg-button') as HTMLButtonElement | null)?.setAttribute('disabled', '');
      const activateButton = document.getElementById('activate-button') as HTMLButtonElement | null;
      if (activateButton) {
        activateButton.disabled = false;
        activateButton.textContent = 'Interact Directly';
      }
      const stepperButtons = document.querySelectorAll<HTMLButtonElement>('.stepper-button');
      stepperButtons.forEach(button => {
        button.disabled = false;
      });

      status = false;
    }
    else {
      chart.style.visibility = 'visible';
      chart.className = 'pointer';
      chart.innerHTML = '';
      chart.style.pointerEvents = 'auto';
      chart.style.maxWidth = '100%';
      chart.style.maxHeight = 'auto';
      drawChart(dataset);

      // eslint-disable-next-line no-undef
      const toolbar = document.getElementById('toolbarRow') as HTMLDivElement | null;
      if (toolbar) toolbar.style.setProperty('font-size', '0.8vw', 'important');

      // eslint-disable-next-line no-undef
      document.querySelectorAll<SVGPathElement>('path').forEach(p => (p.style.pointerEvents = 'stroke'));

      const outlierBtn = document.getElementById('outlier-button') as HTMLButtonElement | null;
      if (outlierBtn) outlierBtn.textContent = 'Show Outlier';

      const negBtn = document.getElementById('correlation-neg-button') as HTMLButtonElement | null;
      if (negBtn) negBtn.textContent = 'Move Fitness Score Dimension';

      ['move-error', 'invert-error', 'show-error'].forEach(id => {
        // eslint-disable-next-line no-undef
        const el = document.getElementById(id) as HTMLParagraphElement | null;
        if (el) el.textContent = '';
      });

      (document.getElementById('outlier-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
      (document.getElementById('correlation-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
      (document.getElementById('correlation-neg-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
      const activateButton = document.getElementById('activate-button') as HTMLButtonElement | null;
      if (activateButton) activateButton.disabled = true;
      const stepperButtons = document.querySelectorAll<HTMLButtonElement>('.stepper-button');
      stepperButtons.forEach(button => {
        button.disabled = true;
      });
    }
    if (chart.style.visibility !== 'hidden') {
      chart.style.opacity = '1';
    }
    currentStep.value = 0;
  }, 450);
});

onBeforeUnmount(() => {
  if (usageContainer.value) {
    usageContainer.value.removeEventListener("click", handleClick);
  }
})

onMounted(async (): Promise<void> => {
  healthDataset.value = await loadDataset('data/health-data.csv');
  financeDataset.value = await loadDataset('data/finance-data.csv');
  studentDataset.value = await loadDataset('data/student-marks-data.csv');
  drawChart(financeDataset.value);
  loadContent(introText, 'content/introduction.html');
  loadContent(financeDatasetText, 'content/data-finance.html');
  loadContent(recordOperationsText, 'content/operations-records.html');
  loadContent(dimensionOperationsText, 'content/operations-dimensions.html');
  loadContent(healthDatasetText, 'content/data-health.html');
  loadContent(usageText, 'content/usage.html');
  loadContent(studentDatasetText, 'content/stepper/data-student.html');
  loadContent(moveText, 'content/stepper/move.html');
  loadContent(selectText, 'content/stepper/select.html');
  loadContent(filterText, 'content/stepper/filter.html');
  loadContent(rangeText, 'content/stepper/range.html');
  loadContent(invertText, 'content/stepper/invert.html');
  loadContent(summaryText, 'content/stepper/summary.html');
  loadContent(multipleViewsText, 'content/multipleviews.html');
  loadContent(referencesDatasetText, 'content/resources.html');
  

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
        scrub: 1,
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
        scrub: 1,
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
        scrub: 1,
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
  animation-range: 0vh 80vh;
}

@media (max-width: 960px) and (orientation: portrait){
  .use-native {
    animation: sticky-header-move-and-size-tablet linear forwards;
    animation-timeline: scroll();
    animation-range: 0vh 80vh;
  }

  .sticky-header {
    font-size: large;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .use-native {
    animation: sticky-header-move-and-size-mobile linear forwards;
    animation-timeline: scroll();
    animation-range: 0vh 80vh;
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
    font-size: xx-large;
  }

  to {
    background-position: 50% 100%;
    height: 6.5vh;
    width: 100%;
    font-size: larger;
  }
}

@media (max-width: 960px) and (orientation: portrait) {
  @keyframes sticky-header-move-and-size-tablet {
    from {
      background-position: 50% 0%;
      height: 100vh;
      width: 100%;
      font-size: xx-large;
    }

    to {
      background-position: 50% 100%;
      height: 6vh;
      width: 100%;
      font-size: larger;
    }
  }
}

@media (max-width: 600px) and (orientation: portrait) {
  @keyframes sticky-header-move-and-size-tablet {
    from {
      background-position: 50% 0%;
      height: 100vh;
      width: 100%;
      font-size: x-large;
    }

    to {
      background-position: 50% 100%;
      height: 6vh;
      width: 100%;
      font-size: large;
    }
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  @keyframes sticky-header-move-and-size-mobile {
    from {
      background-position: 50% 0%;
      height: 100vh;
      width: 100%;
      font-size: x-large;
    }

    to {
      background-position: 50% 100%;
      height: 6.5vh;
      width: 100%;
      font-size: large;
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

.explorable-explainer {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

#pc_svg {
  display: block;
  height: auto;
  max-height: 30rem;
  width: 100%;;
}

#chart-title {
  font-size: x-large;
  font-weight: bold;
  text-align: center;
  margin-top: 1rem;
}

.main-chart {
  position: sticky;
  top: calc(10vh + 1rem);
  border: 0.01rem solid black;
  border-radius: 0.3rem;
}

#parallelcoords {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.5s ease;
}

.text-container {
  margin-right: 1rem;
}

.pic {
  margin-left: 2rem;
  padding-right: 2rem;
}


/* Tablet portrait (chart and text column) */
@media (max-width: 960px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column !important;
  }

  #chart-title {
    font-size: x-large;
  }

  .main-chart {
    position: fixed;
    top: 2.9rem;
    left: 0;
    width: 100%;
    background: white;
    z-index: 100;
  }

  .chart-container {
    flex: 1 1 20rem;
    min-width: 100%;
  }

  .text-container {
    min-width: 100%;
  }

  #pc_svg {
    height: 18rem;
  }
}

/* Mini tablet (chart and text column)*/
@media (max-width: 800px) and (orientation: portrait) {
  #chart-title {
    font-size: larger;
  }

  .explorable-explainer {
    flex-direction: column;
  }

  .main-chart {
    position: fixed;
    top: 2.7rem;
    left: 0;
    width: 100%;
    background: white;
    z-index: 100;
  }

  .chart-container {
    flex: 1 1 18rem;
    min-width: 100%;
  }

  .text-container {
    min-width: 100%;
  }

  #pc_svg {
    height: 16rem;
  }
}

/* Mobile portrait (chart and text column) */
@media (max-width: 600px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column;
  }

  #chart-title {
    font-size: large;
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
    padding-bottom: 0;
  }

  .text-container {
    min-width: 100%;
  }

  #pc_svg {
    height: 18rem;
  }
}

/* Mobile portrait (chart and text column) */
@media (max-width: 450px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column;
  }

  #chart-title {
    font-size: large;
  }

  .main-chart {
    position: fixed;
    top: 2.5rem;
    left: 0;
    width: 100%;
    z-index: 100;
    justify-content: left !important;
    align-items: left !important;
  }

  .chart-container {
    flex: 1 1 8rem;
    min-width: 100%;
    padding-bottom: 0;
  }
}

/* Mobile landscape (chart and text row) */
@media (max-height: 600px) and (orientation: landscape) {
  .explorable-explainer {
    flex-direction: row;
  }

  #chart-title {
    font-size: large;
  }

  .main-chart {
    position: sticky;
    top: 2rem;
    height: auto;
  }

  .chart-container {
    flex: 1 1 50%;
    min-width: 40%;
  }

  .text-container {
    flex: 1 1 50%;
    min-width: 40%;
  }

  #pc_svg {
    height: 16rem;
  }
}


/* Sections in Textcontainer with animation */
section {
  width: calc(100% - 0.5rem);
  max-width: 100%;
  background: oklch(0.99 0.011 91.69);  /* rgb(229, 229, 220); */
  border: 0.01rem solid black;
  border-radius: 0.3rem;
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(100px);
  padding-right: 1rem;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
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

h2 {
  padding-top: 1rem;
  padding-bottom: 0.5rem;
  padding-left: 1rem;
  text-wrap: balance;
  text-align: left;
  letter-spacing: normal;
  word-spacing: normal;
}

h3 {
  padding-left: 1rem;
  margin-bottom: 0;
  padding-top: 0.5rem;
  padding-bottom: 0.25rem;
  text-wrap: balance;
  text-align: left;
  letter-spacing: normal;
  word-spacing: normal;
}

h4 {
  padding-left: 1rem;
  padding-top: 0.5rem;
  margin-bottom: 0;
  text-wrap: balance;
  text-align: left;
  letter-spacing: normal;
  word-spacing: normal;
}

p {
  border-left: 1rem solid transparent;
  margin-bottom: 0.25rem;
  font-size: 1em;
  text-align: justify;
  hyphens: auto;
  word-wrap: break-word;
  letter-spacing: normal;
  word-spacing: normal;
}

p + p {
  text-indent: 1em;
}

/* listings */

ul {
  border-left: 1rem solid transparent;
  padding-left: 1rem;
  margin-top: 0;
}

li {
  font-size: 1em;
}

.liheading {
  font-weight: bold;
  margin-top: 1rem;
  font-size: 1em;
}

.litext {
  border-left: 0 solid transparent;
  font-size: 1em;
}

.liinstruction::before {
  content: "{";
}

.liinstruction::after {
  content: "}";
}

.liinstruction {
  border-left: 0 solid transparent;
  font-style: italic;
  color: #00356B;  /* black; */
  text-indent: 0;
  font-size: 1em;
}

/* Table */

.table-container {
  flex: 1 1 20rem;
  max-height: 30rem;
  padding-top: 1rem;
  margin-left: 0.5rem;
  position: relative;
  isolation: isolate;
}

table {
  text-align: justify;
  width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8em;
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
  background-color: rgba(30,61,89,0.8) !important;
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
  margin-top: 0rem;
  margin-right: 0.25rem;
  background: white;
  color: black;
  border: none;
  border-radius: 75%;
  cursor: pointer;
  width: 1.2rem;
  height: 1.2rem;
  line-height: 1.2rem;
  font-size: 0.9em;
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
  padding: 0;
  margin-top: 0.5rem;
  margin-right: 0.2rem;
  color: black;
  font-weight: bold;
  font-size: 0.9em;
  top: 0.2rem;
  right: 0.4rem;
  position: absolute;
}

.narrow-column {
  width: 2.5rem;
  text-align: center;
}

input[type="number"] {
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
  font-size: 0.9em;
  margin-top: 0.5rem;
}

.usage-button {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

.error {
  color: red;
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
  flex: 1 1 8em;
  text-align: center;
  margin: 0;
  cursor: zoom-in;
}

figcaption {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: small;
}

/* stepper */
.stepper {
  display: flex;
  flex-direction: column;
  text-align: justify;
  width: calc(100% - 0.5rem);
  max-width: 100%;
  background: rgb(229, 229, 220);
  border-radius: 0.3rem;
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(100px);
  padding-right: 1rem;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
  padding-bottom: 0.5rem;

  animation: slide-in-from-bottom 1s ease-out forwards;
  animation-timeline: scroll();
  animation-range: 0vh 100vh;
  animation-duration: 1s;
}

.buttons {
  margin-top: auto;
  justify-content: center;
  align-items: center;
  display: flex;
}

li.active {
  background: rgba(0, 129, 175, 1) no-repeat center left;
  color: white;
  font-weight: bold;
  border-radius: 0.25rem;
  padding-left: 0.5rem;
}

li.active::marker {
  color: black;
  font-weight: normal;
}

.step-indicator {
  margin-top: 0.5em;
  display: flex;
  gap: 0.5em;
  justify-content: center;
  font-size: 0.75em;
}

.step-indicator span {
  position: relative;
  padding: 0 0.3rem;
}

.step-indicator span.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.1em;
  height: 0.1em;
  background: grey;
}
/* References section */

#border {
  border-bottom: rgb(0, 129, 175) 0.4rem;
  border-bottom-style: solid;
  margin-top: 10rem;
}

.references {
  background: white;
  margin-top: 1rem;
  margin-left: 1rem;
  margin-right: 1rem;
}
</style>
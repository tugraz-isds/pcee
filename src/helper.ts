import { ref, type Ref, nextTick } from 'vue';
import { columnsFinance, rowsFinance } from './data.js';
import * as spcd3 from './spcd3.js';

export interface Column {
  key: string
  label: string
  type?: number | string
}

export type Row = Record<string, unknown>;

export const columns = ref<Column[]>(structuredClone(columnsFinance));
export const rows = ref<Row[]>(structuredClone(rowsFinance));
export const healthDataset = ref('');
export const studentDataset = ref('');
export const financeDataset = ref('');
const currentStep = ref(0);
let isColored = false;

export const getSharedVariable = () => {
  const resetCurrentStep = () => {
    currentStep.value = 0
  }

  return { currentStep, resetCurrentStep }
}

export const resetTable = (): void => {
  columns.value = structuredClone(columnsFinance);
  rows.value = structuredClone(rowsFinance);
}

// Load files from public/content/
export const loadContent = async (content: Ref<string>, filePath: string): Promise<void> => {
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
export const loadDataset = async (filePath: string): Promise<string> => {
  try {
    const response = await fetch(filePath);
    const csv = await response.text();
    return csv;
  } catch (error) {
    console.error('Error loading dataset:', error);
    return '';
  }
};

export const initalLoadOfDataset = async (): Promise<void> => {
  healthDataset.value = await loadDataset('data/health-data.csv');
  financeDataset.value = await loadDataset('data/finance-data.csv');
  studentDataset.value = await loadDataset('data/student-marks-data.csv');
}

export const getDatasetForStep = (step: number): string | undefined => {
  if (step === 0) return financeDataset.value;
  if (step === 1) return healthDataset.value;
  if (step === 2) return studentDataset.value;
}

// draw parallel coordinates with spcd3
export const drawChart = async (dataset: string | undefined): Promise<void> => {
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

export const writeTitleToDataset = (step: number): void => {
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

export const getCurrentStepIndex = (): number => {
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

const getOrientation = (): number => {
  if (window.innerWidth < 600) {
    return window.innerHeight * 0.95;
  } else if (window.innerWidth < 1200) {
    return window.innerHeight * 0.5;
  } else {
    return window.innerHeight * 0.5;
  }
}

const addClickEvent = (): void => {
  const outlierButton = document.getElementById('outlier-button');
  if (outlierButton) {
    outlierButton.addEventListener('click', selectOutlier);
  }
  const clusterButton = document.getElementById('cluster-button');
  if (clusterButton) {
    clusterButton.addEventListener('click', showClusters);
  }
  const correlationButton = document.getElementById('correlation-button');
  if (correlationButton) {
    correlationButton.addEventListener('click', showPositiveCorrelation);
  }
  const negCorrelationButton = document.getElementById('correlation-neg-button');
  if (negCorrelationButton) {
    negCorrelationButton.addEventListener('click', showNegativeCorrelation);
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

  const isAlreadySelected = spcd3.isSelected("Patient F");

  if (isAlreadySelected && (document.getElementById('outlier-button') as HTMLButtonElement).textContent === 'Show Outlier') {
     if (showError) {
      showError.textContent = "Outlier (Patient F) is already selected!";
      (document.getElementById('outlier-button') as HTMLButtonElement).textContent = 'Hide Outlier';
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

const showClusters = (): void => {
  if (isColored) {
    resetColorOfRecord("Patient A");
    resetColorOfRecord("Patient B");
    resetColorOfRecord("Patient C");

    resetColorOfRecord("Patient D");
    resetColorOfRecord("Patient E");
    resetColorOfRecord("Patient F");
    (document.getElementById('cluster-button') as HTMLButtonElement).textContent = 'Show Clusters';
    isColored = false;
  } else {
    colorRecord("Patient A", "magenta");
    colorRecord("Patient B", "magenta");
    colorRecord("Patient C", "magenta");

    colorRecord("Patient D", "green");
    colorRecord("Patient E", "green");
    colorRecord("Patient F", "green");
    (document.getElementById('cluster-button') as HTMLButtonElement).textContent = 'Hide Clusters';
    isColored = true;
  }
}

const colorRecord = (record: string, color: string): void => {
  if (!spcd3.isRecordInactive(record)) {
    spcd3.colorRecord(record, color);
  }
}

const resetColorOfRecord = (record: string): void => {
  if (!spcd3.isRecordInactive(record)) {
    spcd3.uncolorRecord(record);
  }
}

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
  const isHiddenFitness = hiddenDimensions.includes("Fitness Score (0-100)");
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

  const posFitness = spcd3.getDimensionPosition('Fitness Score (0-100)');
  const posAge = spcd3.getDimensionPosition('Age');
  const diff = posAge - posFitness;
  if (diff === 1) {
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).textContent = 'Move Fitness Score Dimension';
    spcd3.move('Fitness Score (0-100)', true, 'Cholesterol (mg/dl)');
  }
  else {
    (document.getElementById('correlation-neg-button') as HTMLButtonElement).textContent = 'Move Fitness Score Dimension';
    spcd3.move('Fitness Score (0-100)', true, 'Age');
  }
}

import { ref, type Ref, nextTick } from "vue";
import { columnsFinance, rowsFinance } from "./data.js";
import * as spcd3 from "./spcd3.js";

export interface Column {
  key: string;
  label: string;
  type?: number | string;
}

export type Row = Record<string, unknown>;

export const columns = ref<Column[]>(structuredClone(columnsFinance));
export const rows = ref<Row[]>(structuredClone(rowsFinance));
export const healthDataset = ref("");
export const studentDataset = ref("");
export const financeDataset = ref("");
const currentStep = ref(0);
let isColored = false;
let isOutlierShown = false;
const usageButtonsWithListener = new WeakSet<HTMLElement>();

export const getSharedVariable = () => {
  const resetCurrentStep = () => {
    currentStep.value = 0;
  };

  return { currentStep, resetCurrentStep };
};

export const resetTable = (): void => {
  columns.value = structuredClone(columnsFinance);
  rows.value = structuredClone(rowsFinance);
};

export const resetUsageState = (): void => {
  isColored = false;
  isOutlierShown = false;

  const labels: Record<string, string> = {
    "outlier-button": "Show Outlier",
    "cluster-button": "Show Clusters",
    "correlation-button": "Invert Blood Pressure Dimension",
    "correlation-neg-button": "Move Fitness Score Dimension",
  };

  Object.entries(labels).forEach(([id, label]) => {
    const button = document.getElementById(id) as HTMLButtonElement | null;
    if (button) button.textContent = label;
  });

  ["move-error", "invert-error", "show-error"].forEach((id) => {
    const error = document.getElementById(id);
    if (error) error.textContent = "";
  });
};

// Load files from public/content/
export const loadContent = async (
  content: Ref<string>,
  filePath: string,
): Promise<void> => {
  try {
    const response = await fetch(filePath);
    const data = await response.text();
    content.value = data;
    await nextTick(() => {
      addClickEvent();
    });
  } catch (error) {
    console.error("Error loading data:", error);
  }
};

// Load files from public/data
export const loadDataset = async (filePath: string): Promise<string> => {
  try {
    const response = await fetch(filePath);
    const csv = await response.text();
    return csv;
  } catch (error) {
    console.error("Error loading dataset:", error);
    return "";
  }
};

export const initalLoadOfDataset = async (): Promise<void> => {
  healthDataset.value = await loadDataset("data/health-data.csv");
  financeDataset.value = await loadDataset("data/finance-data.csv");
  studentDataset.value = await loadDataset("data/student-marks-data.csv");
};

export const getDatasetForStep = (step: number): string | undefined => {
  if (step === 0) return financeDataset.value;
  if (step === 1) return healthDataset.value;
  if (step === 2) return studentDataset.value;
};

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
    console.error("Error drawing data:", error);
  }
};

export const writeTitleToDataset = (step: number): void => {
  const titleElement = document.getElementById(
    "chart-title",
  ) as HTMLHeadingElement | null;
  if (titleElement == null) return;
  if (step == 0) {
    titleElement.textContent = "Personal Finances Dataset";
  } else if (step == 1) {
    titleElement.textContent = "Heart Health Dataset";
  } else if (step == 2) {
    titleElement.textContent = "Case Study: Student Marks";
  } else if (step == 3) {
    titleElement.textContent = "Coordinated Multiple Views";
  } else {
    titleElement.textContent = "";
  }
};

export const getCurrentStepIndex = (): number => {
  const steps = document.querySelectorAll<HTMLElement>(".step");
  let currentIndex = 0;
  let maxVisibleTop: number | null = null;

  steps.forEach((step) => {
    const rect = step.getBoundingClientRect();
    const steppoint = getOrientation();
    const isHalfInView = rect.top <= steppoint;
    if (isHalfInView && (maxVisibleTop === null || rect.top > maxVisibleTop)) {
      maxVisibleTop = rect.top;
      currentIndex = parseInt(step.dataset.step ?? "0", 10);
    }
  });
  return currentIndex;
};

const getOrientation = (): number => {
  if (window.innerWidth < 600) {
    return window.innerHeight * 0.95;
  } else if (window.innerWidth < 1200) {
    return window.innerHeight * 0.5;
  } else {
    return window.innerHeight * 0.5;
  }
};

const addClickEvent = (): void => {
  const outlierButton = document.getElementById("outlier-button");
  if (outlierButton && !usageButtonsWithListener.has(outlierButton)) {
    outlierButton.addEventListener("click", selectOutlier);
    usageButtonsWithListener.add(outlierButton);
  }
  const clusterButton = document.getElementById("cluster-button");
  if (clusterButton && !usageButtonsWithListener.has(clusterButton)) {
    clusterButton.addEventListener("click", showClusters);
    usageButtonsWithListener.add(clusterButton);
  }
  const correlationButton = document.getElementById("correlation-button");
  if (correlationButton && !usageButtonsWithListener.has(correlationButton)) {
    correlationButton.addEventListener("click", showPositiveCorrelation);
    usageButtonsWithListener.add(correlationButton);
  }
  const negCorrelationButton = document.getElementById(
    "correlation-neg-button",
  );
  if (negCorrelationButton && !usageButtonsWithListener.has(negCorrelationButton)) {
    negCorrelationButton.addEventListener("click", showNegativeCorrelation);
    usageButtonsWithListener.add(negCorrelationButton);
  }
};

const selectOutlier = (): void => {
  const showError = document.getElementById(
    "show-error",
  ) as HTMLParagraphElement | null;

  const isOutlierInactive = spcd3.isRecordInactive("William");
  const button = document.getElementById("outlier-button") as HTMLButtonElement | null;
  if (!button) return;

  if (isOutlierInactive && !isOutlierShown) {
    if (showError) {
      showError.textContent = "Outlier (William) is filtered out!";
    }
    return;
  } else {
    if (showError) {
      showError.textContent = "";
    }
  }

  if (isOutlierShown) {
    isOutlierShown = false;
    if (!isColored) {
      spcd3.setUnselected("William");
    }
    button.textContent = "Show Outlier";
  } else {
    isOutlierShown = true;
    if (!isColored) {
      spcd3.setSelected("William");
    }
    button.textContent = "Hide Outlier";
  }
};

const showClusters = (): void => {
  if (isColored) {
    resetColorOfRecord("Adam");
    resetColorOfRecord("David");
    resetColorOfRecord("Elaine");

    resetColorOfRecord("Nicola");
    resetColorOfRecord("Peter");
    resetColorOfRecord("William");
    (
      document.getElementById("cluster-button") as HTMLButtonElement
    ).textContent = "Show Clusters";
    isColored = false;

    if (isOutlierShown && !spcd3.isRecordInactive("William")) {
      spcd3.setSelected("William");
    }
  } else {
    if (isOutlierShown) {
      spcd3.setUnselected("William");
    }

    colorRecord("Adam", "magenta");
    colorRecord("David", "magenta");
    colorRecord("Elaine", "magenta");

    colorRecord("Nicola", "green");
    colorRecord("Peter", "green");
    colorRecord("William", "green");
    (
      document.getElementById("cluster-button") as HTMLButtonElement
    ).textContent = "Hide Clusters";
    isColored = true;
  }
};

const colorRecord = (record: string, color: string): void => {
  if (!spcd3.isRecordInactive(record)) {
    spcd3.colorRecord(record, color);
  }
};

const resetColorOfRecord = (record: string): void => {
  if (!spcd3.isRecordInactive(record)) {
    spcd3.uncolorRecord(record);
  } else {
    spcd3.setClassColoredFalse(record);
  }
};

const showPositiveCorrelation = (): void => {
  const hiddenDimensions = spcd3.getAllHiddenDimensionNames();
  const isHidden = hiddenDimensions.includes("Blood Pressure (mmHg)");
  const invertError = document.getElementById(
    "invert-error",
  ) as HTMLParagraphElement | null;

  if (isHidden) {
    if (invertError) {
      invertError.textContent = "Blood Pressure Dimension is hidden!";
      return;
    }
  } else {
    if (invertError) {
      invertError.textContent = "";
    }
  }

  if (spcd3.getInversionStatus("Blood Pressure (mmHg)") == "descending") {
    spcd3.setInversionStatus("Blood Pressure (mmHg)", "ascending");
    const button = document.getElementById("correlation-button") as HTMLButtonElement | null;
    if (button) button.textContent = "Invert Blood Pressure Dimension";
  } else {
    spcd3.showMarker("Blood Pressure (mmHg)");
    spcd3.setInversionStatus("Blood Pressure (mmHg)", "descending");
    setTimeout(() => {
      spcd3.hideMarker("Blood Pressure (mmHg)");
    }, 1000);
    const button = document.getElementById("correlation-button") as HTMLButtonElement | null;
    if (button) button.textContent = "Reset Blood Pressure Dimension";
  }
};

const showNegativeCorrelation = (): void => {
  const hiddenDimensions = spcd3.getAllHiddenDimensionNames();
  const isHiddenFitness = hiddenDimensions.includes("Fitness Score (0-100)");
  const isHiddenAge = hiddenDimensions.includes("Age");
  const moveError = document.getElementById(
    "move-error",
  ) as HTMLParagraphElement | null;
  if (isHiddenFitness || isHiddenAge) {
    if (moveError) {
      moveError.textContent = "Fitness Score and/or Age is hidden!";
      return;
    }
  } else {
    if (moveError) {
      moveError.textContent = "";
    }
  }

  const posFitness = spcd3.getDimensionPosition("Fitness Score (0-100)");
  const posAge = spcd3.getDimensionPosition("Age");
  const button = document.getElementById(
    "correlation-neg-button",
  ) as HTMLButtonElement | null;
  if (!button) return;
  const diff = posAge - posFitness;
  if (diff === 1) {
    button.textContent = "Move Fitness Score Dimension";
    spcd3.move("Fitness Score (0-100)", true, "Cholesterol (mg/dl)");
  } else {
    button.textContent = "Reset Fitness Score Dimension";
    spcd3.move("Fitness Score (0-100)", true, "Age");
  }
};

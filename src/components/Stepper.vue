<template>
    <div>
        <section 
        class="stepper"
        content-section
        >
        <div v-html="studentDatasetText" />
        <ol class="steps">
            <li
              v-for="(step, index) in steps"
              :key="step.title"
              :class="{ active: index === currentStep }"
            >
            <div
            class="li-header"
            :style="{ cursor: 'pointer' }"
            :aria-expanded="index === currentStep ? 'true' : 'false'"
            @click="goToStep(index)"
            >
            <span class="triangle-bullet"></span>
            {{ step.title }}
            </div>
            <transition name="expand">
                <div
                  v-show="index === currentStep"
                  class="step-panel"
                >
                <div
                  class="step-text"
                  v-html="step.content.value" 
                />
                  <button
                    class="action-buttons"
                    :id="`activate-button-${index}`"
                    :disabled="isUpdatingChart"
                    @click="handleStepAction(index)"
                  >
                    {{ getButtonLabel(index) }}
                  </button>
                </div>
            </transition>
            </li>
        </ol>
        <div class="buttons">
            <button
              id="reset-button"
              class="stepper-button"
              :disabled="currentStep === 0 || isUpdatingChart"
              @click="reset"
            >
              <img class="icon"
                src="/svg/reset-button.svg"
              >
            </button>
            <button
              id="back-button"
              class="stepper-button"
              :disabled="currentStep === 0 || isUpdatingChart"
              @click="back"
            >
              <img class="icon"
                src="/svg/back-button.svg"
              >
            </button>
            <button
              id="next-button"
              class="stepper-button"
              :disabled="currentStep === steps.length - 1 || isUpdatingChart"
              @click="next"
            >
              <img class="icon"
                src="/svg/next-button.svg"
              >
            </button>
            <button
              id="skip-button"
              class="stepper-button"
              :disabled="currentStep === steps.length - 1 || isUpdatingChart"
              @click="skip"
            >
              <img class="icon"
                src="/svg/skip-button.svg"
              >
            </button>
        </div>

        <div class="step-indicator">
            <span
              v-for="(step, index) in steps"
              :key="index"
              :style="{ cursor: 'pointer' }"
              :class="{ active: index === currentStep }"
              @click="goToStep(index)"
            >
              {{ index + 1 }}
            </span>
        </div>
        <p>
            In summary, interactive parallel coordinates are helpful to identify
            outliers, clusters, and correlations within a multidimensional
            dataset, as demonstrated in this case study.
        </p>
        </section>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as spcd3 from '../spcd3.js';
import { loadContent, loadDataset, getSharedVariable, drawChart } from '@/helper.js';

const studentDatasetText = ref('');
const invertText = ref('');
const filterText = ref('');
const moveText = ref('');
const rangeText = ref('');
const selectText = ref('');
const interactiveText = ref('');
const healthDataset = ref('');
const studentDataset = ref('');
const financeDataset = ref('');
const { currentStep } = getSharedVariable();

const steps = [
  { title: '1. Adjusting Dimension Ranges', content: rangeText },
  { title: '2. Selecting Records', content: selectText },
  { title: '3. Moving Dimensions', content: moveText },
  { title: '4. Inverting Dimensions', content: invertText },
  { title: '5. Filtering Records', content: filterText },
  { title: '6. Explore the Data', content: interactiveText }
];

const stepRan = ref(steps.map(() => false));
const isUpdatingChart = ref(false);

function isLastStep(index: number) {
  return index === steps.length - 1;
}

function getButtonLabel(index: number) {
  if (isLastStep(index)) {
    return stepRan.value[index] ? 'Disable Interactivity' : 'Enable Interactivity';
  }
  return stepRan.value[index] ? 'Reset' : 'Run';
}

async function handleStepAction(index: number): Promise<void> {
  if (isUpdatingChart.value) return;

  if (index === 1 && spcd3.isRecordInactive('Sylvia')) return;

  if (isLastStep(index)) {
    if (stepRan.value[index]) {
      deactivateChart(index);
    } else {
      await activateChart(index);
    }
  } else if (stepRan.value[index]) {
    stepRan.value[index] = false;
    if (index === 4) {
      await resetFilterStep();
    } else {
      resetAction(index);
    }
  } else {
    runAction(index);
    stepRan.value[index] = true;
  }
}

const runAction = (currentStep: number): void => {
  triggerNext(currentStep + 1);
};

const resetAction = (currentStep: number): void => {
  triggerBack(currentStep);
};

const resetFilterStep = async (): Promise<void> => {
  if (!studentDataset.value) return;

  isUpdatingChart.value = true;
  try {
    await drawChart(studentDataset.value);
    spcd3.disableInteractivity();

    if (stepRan.value[0]) setRangeNext();
    if (stepRan.value[1]) selectRecordNext();
    if (stepRan.value[2]) moveDimensionNext();
    if (stepRan.value[3]) spcd3.invertWithoutTransition('English');
  } finally {
    isUpdatingChart.value = false;
  }
};

const disableStepInteractivity = (): void => {
  spcd3.disableInteractivity();
  stepRan.value[steps.length - 1] = false;
};

const goToStep = (index: number): void => {
  disableStepInteractivity();
  currentStep.value = index;
}

const next = (event: MouseEvent): void => {
  (event.currentTarget as HTMLButtonElement).blur();
  disableStepInteractivity();
  currentStep.value++;
}

const back = (): void => {
  disableStepInteractivity();
  currentStep.value--;
}

const reset = async (): Promise<void> => {
  isUpdatingChart.value = true;
  try {
    if (studentDataset.value) await drawChart(studentDataset.value);
    spcd3.disableInteractivity();
    stepRan.value = steps.map(() => false);
    currentStep.value = 0;
  } finally {
    isUpdatingChart.value = false;
  }
}

const skip = (): void => {
  disableStepInteractivity();
  currentStep.value = 5;
}

const activateChart = async (currentStep: number): Promise<void> => {
  isUpdatingChart.value = true;
  try {
    if (studentDataset.value) await drawChart(studentDataset.value);
    stepRan.value = steps.map(() => false);
    spcd3.enableInteractivity();
    stepRan.value[currentStep] = true;
  } finally {
    isUpdatingChart.value = false;
  }
}

const deactivateChart = (currentStep: number): void => {
  spcd3.disableInteractivity();
  stepRan.value[currentStep] = false;
}

const triggerNext = (currentStep: number): void => {
  switch(currentStep) {
    case 0:
      break;
    case 1:
      setRangeNext();
      break;
    case 2:
      selectRecordNext();
      break;
    case 3:
      moveDimensionNext();
      break;
    case 4:
      invertDimensionNext();
      break;
    case 5:
      filterRecordsNext();
      break;
    default:
      break;
  }
}

const triggerBack = (currentStep: number): void => {
  switch(currentStep) {
    case 0:
      setRangeBack();
      break;
    case 1:
      selectRecordBack();
      break;
    case 2:
      moveDimensionBack();
      break;
    case 3:
      invertDimensionBack();
      break;
  }
}

const setRangeNext = (): void => {
  const dimensions = spcd3.getAllDimensionNames();
  dimensions.forEach(function (dimension: string) {
    if (!isNaN(spcd3.getMinValue(dimension))) {
      spcd3.setDimensionRange(dimension, 0, 100);
      const range = spcd3.getDimensionRange(dimension);
      spcd3.setFilter(dimension, Number(range[1]), Number(range[0]));
    }
  });
}

const setRangeBack = (): void => {
  const dimensions = spcd3.getAllDimensionNames();
  const filterIsActive = stepRan.value[4];

  dimensions.forEach(function (dimension: string) {
    if (!isNaN(spcd3.getMinValue(dimension))) {
      const min = spcd3.getMinValue(dimension);
      const max = spcd3.getMaxValue(dimension);
      const [filterMin, filterMax] = spcd3.getFilter(dimension);
      spcd3.setDimensionRange(dimension, min, max);

      if (filterIsActive && dimension === 'IT') {
        spcd3.setFilter(
          dimension,
          Math.max(min, filterMin),
          Math.min(max, filterMax),
        );
      } else {
        const range = spcd3.getDimensionRange(dimension);
        spcd3.setFilter(dimension, Number(range[1]), Number(range[0]));
      }
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
  const values = spcd3.getDimensionRange('IT');
  if(spcd3.getInversionStatus('IT') === 'descending') {
    spcd3.setFilter('IT', 35, values[1]);
  }
  else {
     spcd3.setFilter('IT', values[0], 35);
  }
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


onMounted(async (): Promise<void> => {
  healthDataset.value = await loadDataset('data/health-data.csv');
  financeDataset.value = await loadDataset('data/finance-data.csv');
  studentDataset.value = await loadDataset('data/student-marks-data.csv');
  loadContent(studentDatasetText, 'content/stepper/data-student.html');
  loadContent(moveText, 'content/stepper/move.html');
  loadContent(selectText, 'content/stepper/select.html');
  loadContent(filterText, 'content/stepper/filter.html');
  loadContent(rangeText, 'content/stepper/range.html');
  loadContent(invertText, 'content/stepper/invert.html');
  loadContent(interactiveText, 'content/stepper/interactive.html');
});

</script>

<style>
.stepper {
  display: flex;
  flex-direction: column;
  background: var(--content-panel-background);
  border-radius: 0.3rem;
  margin-top: 1rem;
  margin-left: 0.5rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;
  border: 0.01rem solid var(--panel-border-color);

  transform: translateY(5rem);

  animation: slide-in-from-bottom ease-out forwards;
  animation-timeline: scroll();
  animation-range: 0vh 100vh;
}

@media (max-width: 60em) and (orientation: portrait) {
  .stepper {
    overflow-anchor: none;
  }
}

.buttons {
  margin-top: auto;
  justify-content: center;
  align-items: center;
  display: flex;
}

.stepper-button {
  width: 1.5rem;
  height: 1.5rem;
  margin-right: 0.5rem;
}

.icon {
  padding-bottom: 0.6rem;
  filter: var(--toolbar-icon-filter);
}

.action-buttons {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

.step-indicator {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.7rem 0;
  font-size: 0.6rem;
}

.step-indicator span {
  position: relative;
  padding: 0 0.3rem;
  cursor: pointer;
}

.step-indicator span.active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.15rem;
  height: 0.1rem;
  background: var(--muted-text-color);
}

.steps {
  padding-left: 0;
}

.steps > li {
  padding: 0;
  margin: 0 0 0.1rem 0.5rem;
  overflow: hidden;
}

.li-header {
  background: var(--content-panel-background);
  padding: 0.2rem 0 0.2rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.triangle-bullet{
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 0.5rem solid currentColor;
  border-top: 0.3rem solid transparent;
  border-bottom: 0.3rem solid transparent;
  transition: transform 0.2s ease;
}

li.active .triangle-bullet{
  transform: rotate(90deg);
}

.steps > li.active .li-header {
  background: var(--brand-accent-background);
  color: var(--accent-contrast-text-color);
  font-weight: 600;
  padding-left: 0.5rem;
  margin-left: 0.5rem;
}

.step-panel {
  margin-left: 0.5rem;
  padding-right: 1rem;
  border: 0.01rem solid var(--panel-border-color);
}

.step-text {
  margin-left: 1rem;
}

.expand-enter-active,
.expand-leave-active {
  transition: max-height 0.5s ease-in, opacity 0.5s ease-out;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}

.expand-enter-to,
.expand-leave-from {
  max-height: 10rem;
  opacity: 1;
}
</style>
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
            :style="{ cursor: status ? 'default' : 'pointer' }"
            :aria-expanded="index === currentStep ? 'true' : 'false'"
            @click="status === false && goToStep(index)"
            >
            <span class="triangle"></span>
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
                  v-if="step.title === '6. Explore the Data'"
                  id="activate-button"
                  class="action-buttons"
                  @click="activateChart(index)"
                  :disabled="stepRan[index]"
                >
                  Enable Interactivity
                </button>
                <button
                  v-else
                  id="`run-button-${index}`"
                  class="action-buttons"
                  @click="runAction(index)"
                  :disabled="stepRan[index]"
                >
                  Run
                </button>
                <button
                  v-if="step.title === '6. Explore the Data'"
                  id="deactivate-button"
                  @click="deactivateChart(index)"
                  :disabled="!stepRan[index]"
                >
                  Disable Interactivity
                </button>
                <button
                  v-else
                  id="`res-button-${index}`"
                  :disabled="!stepRan[index]"
                  @click="resetAction(index)"
                >
                  Reset
                </button>
                </div>
            </transition>
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
              >
            </button>
            <button
              id="back-button"
              class="stepper-button"
              :disabled="currentStep === 0"
              @click="back"
            >
              <img 
                src="/svg/back-button.svg"
              >
            </button>
            <button
              id="next-button"
              class="stepper-button"
              :disabled="currentStep === steps.length - 1"
              @click="next"
            >
              <img 
                src="/svg/next-button.svg"
              >
            </button>
            <button
              id="skip-button"
              class="stepper-button"
              :disabled="currentStep === steps.length - 1"
              @click="skip"
            >
              <img 
                src="/svg/skip-button.svg"
              >
            </button>
        </div>

        <div class="step-indicator">
            <span
              v-for="(step, index) in steps"
              :key="index"
              :style="{ cursor: status ? 'default' : 'pointer' }"
              :class="{ active: index === currentStep }"
              @click="status === false && goToStep(index)"
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
import { ref, onMounted, watch } from 'vue';
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
let status = false;
const stepRan = ref<boolean[]>([])

const steps = [
  { title: '1. Adjusting Dimension Ranges', content: rangeText },
  { title: '2. Selecting Records', content: selectText },
  { title: '3. Filtering Records', content: filterText },
  { title: '4. Moving Dimensions', content: moveText },
  { title: '5. Inverting Dimensions', content: invertText },
  { title: '6. Explore the Data', content: interactiveText }
];

watch(
  () => steps,
  (newSteps) => {
    stepRan.value = newSteps.map((_, i) => stepRan.value[i] ?? false)
  },
  { immediate: true }
)

const goToStep = (index: number): void => {
  if (currentStep.value === 5) drawChart(studentDataset.value);
  spcd3.disableInteractivity();
  stepRan.value[index] = false
  currentStep.value = index;
}

const next = (): void => {
  if (currentStep.value === 5) drawChart(studentDataset.value);
  spcd3.disableInteractivity();
  stepRan.value[currentStep.value] = false
  currentStep.value++;
}

const back = (): void => {
  if (currentStep.value === 5) drawChart(studentDataset.value);
  spcd3.disableInteractivity();
  stepRan.value[currentStep.value] = false
  currentStep.value--;
}

const reset = (): void => {
  if (currentStep.value === 5) drawChart(studentDataset.value);
  spcd3.disableInteractivity();
  stepRan.value[currentStep.value] = false
  currentStep.value = 0;
}

const skip = (): void => {
  if (currentStep.value === 5) drawChart(studentDataset.value);
  spcd3.disableInteractivity();
  stepRan.value[currentStep.value] = false
  currentStep.value = 5;
}

const runAction = (currentStep: number): void => {
  triggerNext(currentStep + 1);
  stepRan.value[currentStep] = true;
}

const resetAction = (currentStep: number): void => {
  triggerBack(currentStep);
  stepRan.value[currentStep] = false;
}

const activateChart = (currentStep:number): void => {
  if (currentStep === 5) drawChart(studentDataset.value);
  spcd3.enableInteractivity();
  drawChart(studentDataset.value);
  stepRan.value[currentStep] = true;
}

const deactivateChart = (currentStep: number): void => {
  if (currentStep === 5) drawChart(studentDataset.value);
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
      filterRecordsNext();
      break;
    case 4:
      moveDimensionNext();
      break;
    case 5:
      invertDimensionNext();
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
      setRangeBack();
      break;
    case 2:
      filterRecordsBack();
      break;
    case 3:
      moveDimensionBack();
      break;
    case 4:
      invertDimensionBack();
      break;
    case 5:
      break;
    default:
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
/* stepper */
.stepper {
  display: flex;
  flex-direction: column;
  text-align: justify;
  width: auto;
  background: oklch(0.99 0.011 91.69);
  border-radius: 0.3rem;
  margin-top: 1rem;
  opacity: 0;
  transform: translateY(100px);
  padding-right: 1rem;
  margin-left: 0.5rem;
  padding-bottom: 0.5rem;
  border: 0.01rem solid black;

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

.stepper-button {
  width: 1.7rem;
  height: 1.7rem;
  display: block;
}

.step-indicator {
  margin-top: 0.5em;
  display: flex;
  gap: 0.5em;
  justify-content: center;
  font-size: 75%;
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
  bottom: -0.1em;
  height: 0.1em;
  background: grey;
}

.steps {
  padding: 0;
}

.steps > li {
  padding: 0;
  margin: 0 0 0.1rem 0.5rem;
  overflow: hidden;
}

.li-header {
  background: oklch(0.99 0.011 91.69);
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  padding-left: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: .5rem;
}

.triangle{
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 0.5rem solid currentColor;
  border-top: 0.3rem solid transparent;
  border-bottom: 0.3rem solid transparent;
  transition: transform .2s ease;
}

li.active .triangle{
  transform: rotate(90deg);
}

.steps > li.active .li-header {
  background: rgba(0, 129, 175, 1);
  display: inline;
  color: rgb(255,255,255);
  font-weight: 590;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.step-panel {
  margin-left: 0.5rem;
  padding-right: 1rem;
  border: 0.01rem solid black;
}

.step-text {
  margin-left: 1rem;
}

.expand-enter-active,
.expand-leave-active {
  transition: max-height .5s ease-in, opacity .5s ease-out;
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

.note {
  font-size: 80%;
  text-indent: 0;
}

.note::before {
  content: "[";
}

.note::after {
  content: "]";
}

#activate-button {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

#run-button {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

.action-buttons {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}


</style>
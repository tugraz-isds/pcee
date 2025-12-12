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
            {{ step.title }}
            </div>
            <transition name="expand">
                <div
                  v-show="index === currentStep"
                  class="step-panel"
                >
                <p class="step-text">
                    {{ step.content }}
                </p>

                <button
                  v-if="step.title === '6. Explore the Data'"
                  id="activate-button"
                >
                  Enable Interactivity
                </button>
                <button
                  v-else
                  id="run-button"
                  @click="runAction(index)"
                >
                  Run
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
import { ref, onMounted, nextTick } from 'vue';
import * as spcd3 from '../spcd3.js';
import { loadContent, loadDataset, getCurrentStepIndex, getDatasetForStep, drawChart, writeTitleToDataset, getSharedVariable } from '@/helper.js';

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

const steps = [
  { title: '1. Adjusting Dimension Ranges', content: rangeText },
  { title: '2. Selecting Records', content: selectText },
  { title: '3. Filtering Records', content: filterText },
  { title: '4. Moving Dimensions', content: moveText },
  { title: '5. Inverting Dimensions', content: invertText },
  { title: '6. Play with the Data', content: interactiveText }
];

const goToStep = async(index: number): Promise<void> => {
  if (index > currentStep.value) {
    //index = index + 1;
    /*for (let i = currentStep.value; i < index; i++) {
      currentStep.value = i;
      //runForward(i);
      await wait(800);
    }*/
    currentStep.value = index;
  } else {
    let step = currentStep.value;
    currentStep.value = index;
    for (let i = step; i >= index; i--) {
      runBackward(i);
      await wait(800);
    }
  }  
}

const next = (): void => {
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
  //triggerNext(currentStep.value);
}

const back = (): void => {
  triggerBack(currentStep.value);
  currentStep.value--;
}

const reset = (): void => {
  triggerReset();
}

const skip = (): void => {
  triggerSkip();
}

function wait(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

function runForward(i: number) {
  switch (i) {
    case 1: step1Forward(); break
    case 2: step2Forward(); break
    case 3: step3Forward(); break
    case 4: step4Forward(); break
    case 5: step5Forward(); break
  }
}

function runBackward(i: number) {
  switch (i) {
    case 0: step1Backward(); break
    case 1: step2Backward(); break
    case 2: step3Backward(); break
    case 3: step4Backward(); break
    case 4: step5Backward(); break
  }
}

const step1Forward = (): void => {
  setRangeNext();
}

const step2Forward = (): void => {
  selectRecordNext();
}

const step3Forward = (): void => {
  filterRecordsNext();
}

const step4Forward = (): void => {
  moveDimensionNext();
}

const step5Forward = (): void => {
  invertDimensionNext();
}

const step1Backward = (): void => {
  setRangeBack();
}

const step2Backward = (): void => {
  selectRecordBack();
}

const step3Backward = (): void => {
  filterRecordsBack();
}

const step4Backward = (): void => {
  moveDimensionBack();
}

const step5Backward = (): void => {
  invertDimensionBack();
}

const triggerReset = async (): Promise<void> => {
  currentStep.value = 0;
  
  drawChart(studentDataset.value);
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

  // hitboxes filter
  const handleHitboxes = document.querySelectorAll<HTMLDivElement>('.handle-hitbox')

  handleHitboxes.forEach((hitbox) => {
    hitbox.style.pointerEvents = "none";
  });

  // hitboxes invert
  const hitboxes = document.querySelectorAll<HTMLDivElement>('.hitbox')

  hitboxes.forEach((hitbox) => {
    hitbox.style.pointerEvents = "none";
  });

  status = false;
  (document.getElementById('activate-button') as HTMLButtonElement).textContent = "Enable Interactivity";
}


const triggerSkip = async (): Promise<void> => {
  currentStep.value = 5;
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
      setRangeBack();
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

const runAction = (currentStep: number): void => {
  triggerNext(currentStep + 1);
}

const activateChart = async (): Promise<void> => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.stepper-button');
  const currentStepIndex = getCurrentStepIndex();
  if (currentStepIndex !== 2) return;
  if (!status) {
    const dataset = getDatasetForStep(currentStepIndex);
    drawChart(dataset);
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

    const handleHitboxes = document.querySelectorAll<HTMLDivElement>('.handle-hitbox')

    handleHitboxes.forEach((hitbox) => {
      hitbox.style.pointerEvents = "auto";
    });

    // hitboxes invert
    const hitboxes = document.querySelectorAll<HTMLDivElement>('.hitbox')

    hitboxes.forEach((hitbox) => {
      hitbox.style.pointerEvents = "auto";
    });

    buttons.forEach(btn => {
      btn.disabled = true;
    });
    status = true;
    (document.getElementById('activate-button') as HTMLButtonElement).textContent = "Disable Interactivity";
  }
  else {
    const dataset = getDatasetForStep(currentStepIndex);
    writeTitleToDataset(currentStepIndex);
    drawChart(dataset);
    currentStep.value = 0;
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

    // hitboxes filter
    const handleHitboxes = document.querySelectorAll<HTMLDivElement>('.handle-hitbox')

    handleHitboxes.forEach((hitbox) => {
      hitbox.style.pointerEvents = "none";
    });

    // hitboxes invert
    const hitboxes = document.querySelectorAll<HTMLDivElement>('.hitbox')

    hitboxes.forEach((hitbox) => {
      hitbox.style.pointerEvents = "none";
    });

    buttons.forEach(btn => {
      if (btn.id === "back-button" || btn.id === "reset-button") {
        btn.disabled = true;
      }
      else {
        btn.disabled = false;
      }
    });

    status = false;
    (document.getElementById('activate-button') as HTMLButtonElement).textContent = "Enable Interactivity";
  }
}

const addClickEvent = (): void => {
    const activateButton = document.getElementById('activate-button');
    if (activateButton) {
        activateButton.addEventListener('click', activateChart);
    }
}


onMounted(async (): Promise<void> => {
  healthDataset.value = await loadDataset('data/health-data.csv');
  financeDataset.value = await loadDataset('data/finance-data.csv');
  studentDataset.value = await loadDataset('data/student-marks-data.csv');
  loadContent(studentDatasetText, 'content/data-student.html');
  loadContent(moveText, 'content/stepper/move.html');
  loadContent(selectText, 'content/stepper/select.html');
  loadContent(filterText, 'content/stepper/filter.html');
  loadContent(rangeText, 'content/stepper/range.html');
  loadContent(invertText, 'content/stepper/invert.html');
  loadContent(interactiveText, 'content/stepper/interactive.html');

  await nextTick(() => {
    addClickEvent();
  });
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
  font-size: 0.75em;
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
  margin: 0 0 0.1rem 0;
  overflow: hidden;
}

.li-header {
  background: oklch(0.99 0.011 91.69);
  padding-top: 0.2rem;
  padding-bottom: 0.2rem;
  padding-left: 1rem;
  cursor: pointer;
}

.steps > li.active .li-header {
  background: rgba(0, 129, 175, 1);
  display: inline;
  color: rgb(255,255,255);
  font-weight: 590;
  margin-left: 1rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}

.step-panel {
  margin-left: 1rem;
  padding-right: 1rem;
  border: 0.01rem solid black;
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

#activate-button {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

#run-button {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}
</style>
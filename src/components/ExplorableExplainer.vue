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
        An Interactive Tutorial<br>
        <span class="info">Scroll to begin</span>
      </div>
      <div
        ref="singleLine"
        class="single-line"
      >
        Parallel Coordinates: An Interactive Tutorial
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
      class="chart-container flex-1 basis-[30rem] relative justify-center"
    >
      <div class="main-chart">
        <NavigationDropdown :offset="60" />
        <div class="chart-wrapper">
          <h3 id="chart-title">
            Personal Finances Dataset
          </h3>
          <div id="parallelcoords" />
        </div>
      </div>
    </div>
    <div class="text-container flex-1 basis-[23rem] min-w-[23rem] flex flex-col w-full">
      <div v-html="introText" />
      <div v-html="financeDatasetText" />
      <Table/>
      <div v-html="recordOperationsText" />
      <div v-html="dimensionOperationsText" />
      <div
        ref="usageContainer" 
        v-html="usageText" 
      />
      <Stepper/>
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
import { ref, onMounted, onBeforeUnmount, provide } from 'vue';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import * as spcd3 from '../spcd3.js';
import NavigationDropdown from './NavigationDropdown.vue';
import Table from './Table.vue';
import Stepper from './Stepper.vue';
import { resetTable, loadContent, getCurrentStepIndex, initalLoadOfDataset, getDatasetForStep, drawChart, 
  writeTitleToDataset, getSharedVariable } from '../helper.js';
const { resetCurrentStep } = getSharedVariable();

gsap.registerPlugin(ScrollTrigger);

const introText = ref('');
const recordOperationsText = ref('');
const dimensionOperationsText = ref('');
const usageText = ref('');
const healthDatasetText = ref('');
const multipleViewsText = ref('');
const financeDatasetText = ref('');
const referencesDatasetText = ref('');
const header = ref<HTMLElement | null>(null);
const multiLine = ref<HTMLElement | null>(null);
const singleLine = ref<HTMLElement | null>(null);
const usageContainer = ref<HTMLDivElement | null>(null);
const zoomSrc = ref<string | null>(null);
let lastStep = -1;

const image = new Image();
image.src = 'images/mva.png';
provide('image', image);

const supportsScrollDrivenAnimations: boolean =
  typeof CSS !== 'undefined' &&
  typeof CSS.supports === 'function' &&
  CSS.supports('animation-timeline: scroll()');

const handleClick = (e: Event): void => {
  const target = e.target as HTMLElement;
  const img = target.closest("img") as HTMLImageElement | null;
  if (img) {
    zoomSrc.value = img.src;
  }
}

const isPortrait = (): boolean => {
  return window.innerHeight > window.innerWidth;
}

const handleImage = (chart: HTMLDivElement): void => {
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

const handleStudentDataset = (chart: HTMLDivElement, dataset: string | undefined): void => {
  chart.style.visibility = 'visible';
  chart.className = 'pointer';
  chart.innerHTML = '';
  chart.style.pointerEvents = 'none';
  chart.style.maxWidth = '100%';
  chart.style.maxHeight = 'auto';
  drawChart(dataset);
  spcd3.disableInteractivity();

  (document.getElementById('outlier-button') as HTMLButtonElement | null)?.setAttribute('disabled', '');
  (document.getElementById('correlation-button') as HTMLButtonElement | null)?.setAttribute('disabled', '');
  (document.getElementById('correlation-neg-button') as HTMLButtonElement | null)?.setAttribute('disabled', '');
  const stepperButtons = document.querySelectorAll<HTMLButtonElement>('.stepper-button');

  stepperButtons.forEach(btn => {
    if (btn.id === "back-button" || btn.id === "reset-button") {
      btn.disabled = true;
    }
    else {
      btn.disabled = false;
    }
  });
}

const handleMisc = (chart: HTMLDivElement, dataset: string | undefined) : void => {
  chart.style.visibility = 'visible';
  chart.className = 'pointer';
  chart.innerHTML = '';
  chart.style.pointerEvents = 'auto';
  chart.style.maxWidth = '100%';
  chart.style.maxHeight = 'auto';
  drawChart(dataset);
  resetTable();
  spcd3.enableInteractivity();

  const outlierBtn = document.getElementById('outlier-button') as HTMLButtonElement | null;
  if (outlierBtn) outlierBtn.textContent = 'Show Outlier';

  const negBtn = document.getElementById('correlation-neg-button') as HTMLButtonElement | null;
  if (negBtn) negBtn.textContent = 'Move Fitness Score Dimension';

  ['move-error', 'invert-error', 'show-error'].forEach(id => {
    const el = document.getElementById(id) as HTMLParagraphElement | null;
    if (el) el.textContent = '';
  });

  (document.getElementById('outlier-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
  (document.getElementById('correlation-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
  (document.getElementById('correlation-neg-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
  const stepperButtons = document.querySelectorAll<HTMLButtonElement>('.stepper-button');
  stepperButtons.forEach(button => {
    button.disabled = true;
  });
}

window.addEventListener('scroll', () => {
  
  if (isPortrait()) {
    const el = document.querySelector(".chart-container") as HTMLElement | null;

    if (el) {
      el.addEventListener("wheel", (e) => { e.preventDefault(); }, { passive: false });
    }
  }

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
      handleImage(chart);
    }
    else if (step === 2) {
      handleStudentDataset(chart, dataset);
    }
    else {
      handleMisc(chart, dataset);
    }


    (document.getElementById('activate-button') as HTMLButtonElement).textContent = "Enable Interactivity";
    if (chart.style.visibility !== 'hidden') {
      chart.style.opacity = '1';
    }
    resetCurrentStep();
    
  }, 450);
});

onBeforeUnmount(() => {
  if (usageContainer.value) {
    usageContainer.value.removeEventListener("click", handleClick);
  }
})

onMounted(async (): Promise<void> => {
  initalLoadOfDataset();
  loadContent(introText, 'content/introduction.html');
  loadContent(financeDatasetText, 'content/data-finance.html');
  loadContent(recordOperationsText, 'content/operations-records.html');
  loadContent(dimensionOperationsText, 'content/operations-dimensions.html');
  loadContent(healthDatasetText, 'content/data-health.html');
  loadContent(usageText, 'content/usage.html');
  loadContent(multipleViewsText, 'content/multipleviews.html');
  loadContent(referencesDatasetText, 'content/resources.html');

  const container = usageContainer.value;
  if(container) {
    container.addEventListener('click', handleClick);
  }

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
      fontSize: 'small',
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
      fontSize: 'medium',
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
  font-size: x-large;

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
  width: auto;
  max-width: min(65ch, 100% - 2rem);;
  word-wrap: break-word;
  overflow-wrap: anywhere;
  box-sizing: border-box;
  padding-inline: 1rem;
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

.info {
  font-size: medium;
  color:yellow;
  margin-top: 5rem;
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

  .info {
    font-size: small;
    color:yellow;
    margin-top: 6rem;
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
    font-size: medium;
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
      font-size: medium;
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
      font-size: small;
    }
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  @keyframes sticky-header-move-and-size-mobile {
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
  height: 100%;
  max-height: 25rem;
  width: 100%;
}

#chart-title {
  font-size: larger;
  font-weight: bold;
  text-align: center;
  margin-top: 1rem;
}

.chart-container {
  overscroll-behavior: auto;
}

.main-chart {
  position: sticky;
  top: calc(10vh + 1rem);
  margin-left: 1rem;
}

.chart-wrapper {
  border: 0.01rem solid black;
  border-radius: 0.3rem;
  padding-bottom: 1rem;
}

#parallelcoords {
  transition: opacity 0.5s ease;
}

.text-container {
  margin-right: 1rem;
  max-width: 100%;
}

.pic {
  margin-left: 2rem;
  padding-right: 4rem;
}


/* Tablet portrait (chart and text column) */
@media (max-width: 960px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column !important;
  }

  #chart-title {
    font-size: large;
  }

  .main-chart {
    position: fixed;
    top: 2.9rem;
    left: 0;
    width: 100%;
    background: white;
    z-index: 100;
    margin-left: 0;
  }

  .chart-container {
    flex: 1 1 20rem;
    overscroll-behavior: contain;
    touch-action: pinch-zoom;
  }

  section {
    margin-right: 0.5rem;
  }

  .stepper {
    margin-right: 0.5rem;
  }

  .table-container {
    margin-right: 0.5rem;
  }
}

/* Mini tablet (chart and text column)*/
@media (max-width: 800px) and (orientation: portrait) {
  #chart-title {
    font-size: large;
    margin-top: 0.5rem;
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
    margin-left: 0;
  }

  .chart-container {
    flex: 1 1 18rem;
    overscroll-behavior: contain;
    touch-action: pinch-zoom;
  }
  
  section {
    margin-right: 0.5rem;
  }

  .stepper {
    margin-right: 0.5rem;
  }

  .table-container {
    margin-right: 0.5rem;
  }

}

/* Mobile portrait (chart and text column) */
@media (max-width: 600px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column;
  }

  #chart-title {
    font-size: small;
    margin-top: 0.25rem;
  }

  .main-chart {
    position: fixed;
    top: 2.7rem;
    left: 0;
    width: 100%;
    background: white;
    z-index: 100;
    margin-left: 0;
  }

  .chart-container {
    flex: 1 1 20rem;
    padding-bottom: 0;
    overscroll-behavior: contain;
    touch-action: pinch-zoom;
  }
  
  section {
    margin-right: 0.5rem;
  }

  .stepper {
    margin-right: 0.5rem;
  }

  .table-container {
    margin-right: 0.5rem;
  }

}

/* Mobile portrait (chart and text column) */
@media (max-width: 450px) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column;
  }

  #chart-title {
    font-size: small;
    margin-top: 0.15rem;
  }

  .main-chart {
    position: fixed;
    top: 2.5rem;
    left: 0;
    width: 100%;
    z-index: 100;
    justify-content: left !important;
    align-items: left !important;
    margin-left: 0;
  }

  .chart-container {
    flex: 1 1 8rem;
    min-width: 100%;
    padding-bottom: 0;
    overscroll-behavior: contain;
    touch-action: pinch-zoom;
  }
  
  section {
    margin-right: 0.5rem;
  }

  .stepper {
    margin-right: 0.5rem;
  }

  .table-container {
    margin-right: 0.5rem;
  }

}

/* Mobile landscape (chart and text row) */
@media (max-height: 600px) and (orientation: landscape) {
  .explorable-explainer {
    flex-direction: row;
  }

  #chart-title {
    font-size: small;
  }

  .main-chart {
    position: sticky;
    top: 2rem;
    height: auto;
  }

  .chart-container {
    flex: 1 1 50%;
    min-width: 40%;
    overscroll-behavior: auto;
  }

  .text-container {
    flex: 1 1 50%;
    min-width: 40%;
  }

}

/* Sections in Textcontainer with animation */
section {
  width: auto;
  background: oklch(0.99 0.011 91.69);  /* rgb(229, 229, 220); */
  border: 0.01rem solid black;
  border-radius: 0.3rem;
  margin-top: 1rem;
  opacity: 0;
  padding-right: 1rem;
  margin-left: 0.5rem;
  padding-bottom: 0.5rem;

  animation: slide-in-from-bottom 1s ease-out forwards;
  animation-timeline: scroll();
  animation-range: 0vh 10vh;
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

li p {
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

svg {
  display: inline;
  vertical-align: middle;
}

/* Buttons */
button {
  padding: 0.25rem;
  margin-right: 0.5rem;
  font-size: 90%;
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
  width: auto;
}
</style>
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
      class="chart-container"
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
    <div class="text-container">
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
  chart.style.background = 'white';
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
    el.removeEventListener("wheel", () => {});
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

    (document.getElementById('activate-button-5') as HTMLButtonElement).textContent = "Enable Interactivity";
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

  gsap.set(multiLine.value, {
    fontSize: '3rem'
  })

  gsap.set(singleLine.value, {
    fontSize: '1.2rem',
    opacity: 0,
    visibility: 'hidden'
  })

  gsap.set(multiLine.value, {
    opacity: 1,
    visibility: 'visible',
    fontSize: '1rem',
  });

  gsap.set(singleLine.value, {
    opacity: 0,
    visibility: 'hidden',
    fontSize: '0.875rem',
  });

  gsap.to(header.value, {
    height: '6.8vh',
    backgroundPosition: '50% 100%',
    paddingLeft: '1rem',
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: '+=90vh',
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  gsap.to(multiLine.value, {
    opacity: 0,
    fontSize: '0.875rem',
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top top',
      end: '+=80vh',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (multiLine.value) {
          multiLine.value.style.visibility =
            self.progress < 0.99 ? 'visible' : 'hidden';
        }
      },
    },
  });

  gsap.to(singleLine.value, {
    opacity: 1,
    fontSize: '1rem',
    ease: 'none',
    scrollTrigger: {
      trigger: document.body,
      start: 'top+=80vh top',
      end: 'top+=90vh top',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        if (singleLine.value) {
          singleLine.value.style.visibility =
            self.progress > 0.01 ? 'visible' : 'hidden';
        }
      },
    },
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
  overflow-wrap: anywhere;
  padding-inline: 1rem;
  width: 100%;
  max-width: min(65ch, calc(100% - 2rem));
  box-sizing: border-box;
}

.multi-line {
  font-size: clamp(1.2rem, 3.2vw, 2.6rem);
  line-height: 1.1;
  opacity: 1;
  visibility: visible;
}

.single-line {
  font-size: clamp(0.9rem, 1.4vw + 0.35rem, 1.25rem);
  line-height: 1.05;
  opacity: 0;
  visibility: hidden;
  white-space: nowrap;
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
  font-size: clamp(1.1rem, 1vw + 0.4rem, 1.4rem);
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
  animation: sticky-header-desktop linear forwards;
  animation-timeline: scroll();
  animation-range: 0vh 80vh;
}

@media (max-width: 60em) and (orientation: portrait) {
  .use-native {
    animation: sticky-header-tablet linear forwards;
    animation-timeline: scroll();
    animation-range: 0vh 80vh;
  }
}

@media (max-width: 37.5em) and (orientation: portrait) {
  .single-line {
    font-size: clamp(0.85rem, 1vw + 0.45rem, 1rem);
  }

  .use-native {
    animation: sticky-header-phone-portrait linear forwards;
    animation-timeline: scroll();
    animation-range: 0vh 80vh;
  }
}

@media (max-height: 31.25em) and (orientation: landscape) {
  .use-native {
    animation: sticky-header-mobile-landscape linear forwards;
    animation-timeline: scroll();
    animation-range: 0vh 80vh;
  }
}

@keyframes sticky-header-desktop {
  from {
    background-position: 50% 0%;
    height: 100vh;
  }

  to {
    background-position: 50% 100%;
    height: clamp(3.5rem, 6.5vh, 5rem);
  }
}

@keyframes sticky-header-tablet {
  from {
    background-position: 50% 0%;
    height: 100vh;
  }

  to {
    background-position: 50% 100%;
    height: clamp(3.25rem, 6vh, 4.5rem);
  }
}

@keyframes sticky-header-phone-portrait {
  from {
    background-position: 50% 0%;
    height: 100vh;
  }

  to {
    background-position: 50% 100%;
    height: clamp(3.5rem, 6vh, 4.25rem);
  }
}

@keyframes sticky-header-mobile-landscape {
  from {
    background-position: 50% 0%;
    height: 100vh;
  }

  to {
    background-position: 50% 100%;
    height: clamp(3.25rem, 6.5vh, 4.25rem);
  }
}

.header-spacer-native {
  height: 100vh;
}

.header-spacer-polyfill {
  height: 40vh;
}

.explorable-explainer {
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

#pc_svg {
  width: 100%;
  height: 100%;
  max-height: 25rem;
}

.chart-container {
  flex: 1.2 1 25rem;
  min-width: 0;
  position: relative;
}

.main-chart {
  position: sticky;
  top: calc(10vh + 1rem);
  width: 100%;
  margin-left: 1rem;
  align-self: flex-start;
}

.chart-wrapper {
  border: 0.01rem solid black;
  border-radius: 0.3rem;
  padding-bottom: 1rem;
  background: white;
}

#chart-title {
  font-size: clamp(1rem, 0.9rem + 0.6vw, 1.35rem);
  font-weight: 700;
  text-align: center;
  margin-top: clamp(0.5rem, 0.4rem + 0.6vw, 1rem);
}

#parallelcoords {
  transition: opacity 0.5s ease;
}

.text-container {
  flex: 1 1 23rem;
  min-width: 23rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin-right: 1rem;
  overflow: visible;
  max-height: none;
  height: auto;
}

.pic {
  margin-left: 2rem;
  padding-right: 4rem;
}

section {
  background: oklch(0.99 0.011 91.69);
  border: 0.01rem solid black;
  border-radius: 0.3rem;
  margin-top: 1rem;
  margin-inline: 0.5rem;
  padding-right: 1rem;
  padding-bottom: 0.5rem;
  opacity: 0;

  animation: slide-in-from-bottom 1s ease-out forwards;
  animation-timeline: scroll();
  animation-range: 0vh 10vh;
}

@keyframes slide-in-from-bottom {
  from {
    opacity: 0;
    transform: translateY(100%);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 60em) and (orientation: portrait) {
  .explorable-explainer {
    flex-direction: column;
    gap: 1rem;
    position: relative;
  }

  .chart-container {
    display: contents;
  }

  .navigation-dropdown {
    margin-top: 2rem;
  }

  .main-chart {
    position: sticky;
    top: 2.9rem;
    width: 100%;
    margin-left: 0;
    align-self: flex-start;
    z-index: 201;
    background: white;
  }

  .text-container {
    min-width: 0;
    width: 100%;
    margin-right: 0;
    overflow: visible;
    max-height: none;
    height: auto;
    z-index: 1;
  }

  #parallelcoords {
    touch-action: pan-y;
  }
}

@media (max-width: 50em) and (orientation: portrait) {
  .main-chart {
    top: 2.7rem;
  }

  #chart-title {
    font-size: clamp(0.95rem, 0.9rem + 0.35vw, 1.1rem);
    margin-top: clamp(0.35rem, 0.25rem + 0.3vw, 0.5rem);
  }
}

@media (max-width: 37.5em) and (orientation: portrait) {
  .main-chart {
    top: 2.7rem;
  }

  #chart-title {
    font-size: clamp(0.9rem, 0.85rem + 0.3vw, 1rem);
    margin-top: clamp(0.2rem, 0.15rem + 0.2vw, 0.35rem);
  }

  section {
    padding-right: 0.75rem;
    padding-bottom: 0.4rem;
  }
}

@media (max-width: 28.125em) and (orientation: portrait) {
  .chart-container {
    width: 100%;
    min-width: 0;
  }

  .main-chart {
    top: 2.5rem;
  }

  #chart-title {
    font-size: clamp(0.85rem, 0.8rem + 0.25vw, 0.95rem);
    margin-top: 0.15rem;
  }

  section {
    margin-inline: 0.35rem;
  }
}

@media (max-height: 37.5em) and (orientation: landscape) {
  .explorable-explainer {
    flex-direction: row;
    align-items: stretch;
  }

  .chart-container {
    flex: 1 1 50%;
    min-width: 40%;
  }

  .main-chart {
    position: sticky;
    top: 2rem;
    margin-left: 1rem;
    width: 100%;
  }

  .text-container {
    flex: 1 1 50%;
    min-width: 40%;
    margin-right: 1rem;
  }

  #chart-title {
    font-size: clamp(0.9rem, 0.85rem + 0.3vw, 1rem);
    margin-top: 0.25rem;
  }
}

svg {
  display: inline;
  vertical-align: middle;
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
  color: #00356B;
  text-indent: 0;
  text-align: left;
  hyphens: none;
  font-size: 1em;
}

.liinstruction svg {
  display: inline-block;
  vertical-align: middle;
}

/* Buttons */
button {
  padding: 0.25rem;
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

.references li {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.references a {
  overflow-wrap: anywhere;
  word-break: break-word;
  white-space: normal;
}
</style>
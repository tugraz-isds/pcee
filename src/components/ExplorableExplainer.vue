<template>
  <div>
    <div
      ref="header"
      :class="['sticky-header', { 'use-native': supportsScrollDrivenAnimations }]"
    >
      <div class="header-actions">
        <button
          type="button"
          class="header-action-button"
          @click="showAbout = true"
        >
          <img
            class="header-icon-image"
            src="/svg/info-icon.svg"
          >
        </button>
        <a
          class="header-action-button"
          :href="repoUrl"
        >
          <img
            class="header-icon-image"
            src="/svg/github.svg"
          >
        </a>
      </div>
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
    v-if="showAbout"
    class="about-overlay"
    @click.self="showAbout = false"
  >
    <div class="about-dialog">
      <div class="about-header">
        <h2 class="about-title">
          About
        </h2>
        <button
          type="button"
          class="about-close"
          @click="showAbout = false"
        >
          x
        </button>
      </div>
      <p class="about-copy">
        Parallel Coordinates: An Interactive Tutorial
      </p>
      <p class="about-copy">
        PCEE version: {{ appVersion }}
      </p>
      <p class="about-copy">
        SPCD3 version: 1.0.0
      </p>
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
 <div class="explorable-explainer portrait-resizable">
    <div
      class="chart-container"
    >
      <div class="main-chart">
        <NavigationDropdown :offset="60" />
        <div class="chart-wrapper">
          <h3 id="chart-title">
            Personal Finances Dataset
          </h3>
          <div id="spcd3-parallelcoords" />
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
import packageInfo from '../../package.json';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import '../spcd3.css';
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
const showAbout = ref(false);
let lastStep = -1;
const appVersion = packageInfo.version;
const repoUrl = packageInfo.repository.url;
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const darkModeMediaQuery =
  typeof window !== 'undefined' ? window.matchMedia(DARK_MODE_MEDIA_QUERY) : null;

const applyTheme = (nextTheme: 'light' | 'dark'): void => {
  document.documentElement.dataset.theme = nextTheme;
}

const syncThemeWithSystemPreference = (event?: MediaQueryListEvent): void => {
  const prefersDark = event?.matches ?? darkModeMediaQuery?.matches ?? false;
  applyTheme(prefersDark ? 'dark' : 'light');
}

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
  chart.style.background = 'transparent';
  chart.style.color = 'var(--chart-text-color)';
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

  const chart = document.getElementById('spcd3-parallelcoords') as HTMLDivElement | null;
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

  darkModeMediaQuery?.removeEventListener('change', syncThemeWithSystemPreference);
})

onMounted(async (): Promise<void> => {
  syncThemeWithSystemPreference();
  darkModeMediaQuery?.addEventListener('change', syncThemeWithSystemPreference);
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
  height: 100%;

  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;

  color: var(--accent-contrast-text-color);
  background: var(--brand-accent-background);

  z-index: 1000;

  will-change: transform, height, font-size;
  contain: layout style;
}

.header-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  z-index: 2;
}

.header-action-button {
  display: inline-flex;
  align-items: center;
  border: 0.01rem solid rgb(255 255 255 / 45%);
  border-radius: 999rem;
  background: rgb(255 255 255 / 14%);
  color: var(--accent-contrast-text-color);
  justify-content: center;
  inline-size: 2.4rem;
  block-size: 2.4rem;
  padding: 0;
  font: inherit;
  font-size: 0.9rem;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  backdrop-filter: blur(0.25rem);
  margin-top: 0;
  vertical-align: middle;
  flex: 0 0 auto;
}

.header-action-button:hover,
.header-action-button:focus-visible {
  background: rgb(255 255 255 / 24%);
  outline: none;
}

.header-icon-image {
  inline-size: 1.55rem;
  block-size: 1.55rem;
  flex: 0 0 auto;
  display: block;
  object-fit: contain;
  filter: var(--toolbar-icon-filter);
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
  /*max-width: min(65ch, calc(100% - 2rem));*/
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
  display: block;
  font-size: clamp(1.1rem, 1vw + 0.4rem, 1.4rem);
  color: var(--highlight-text-color);
  margin-top: 6rem;
}

.about-overlay {
  position: fixed;
  inset: 0;
  background: var(--modal-overlay-background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1200;
}

.about-dialog {
  width: min(26rem, 100%);
  border-radius: 0.6rem;
  background: var(--floating-card-background);
  color: var(--body-text-color);
  padding: 1rem 1.1rem;
  box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 22%);
}

.about-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.about-title {
  margin: 0;
  padding: 0;
}

.about-close {
  margin-top: 0;
  border: 0.01rem solid var(--ui-border-color);
  border-radius: 999rem;
  background: var(--subtle-panel-background);
  padding: 0.35rem 0.8rem;
}

.about-copy {
  margin: 0.75rem 0 0;
  border-left: 0;
  text-indent: 0;
  text-align: left;
}

.about-link {
  display: inline-block;
  margin-top: 1rem;
  color: var(--accent-text-color);
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
  .header-actions {
    top: 0.75rem;
    right: 0.75rem;
    gap: 0.5rem;
  }

  .header-action-button {
    inline-size: 2.1rem;
    block-size: 2.1rem;
    font-size: 0.8rem;
  }

  .single-line {
    font-size: clamp(0.85rem, 1vw + 0.45rem, 1rem);
  }

  .info {
    margin-top: 4.5rem;
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
    height: 8vh;
  }
}

@keyframes sticky-header-tablet {
  from {
    background-position: 50% 0%;
    height: 100vh;
  }

  to {
    background-position: 50% 100%;
    height: 8vh;
  }
}

@keyframes sticky-header-phone-portrait {
  from {
    background-position: 50% 0%;
    height: 100vh;
  }

  to {
    background-position: 50% 100%;
    height: 8vh;
  }
}

@keyframes sticky-header-mobile-landscape {
  from {
    background-position: 50% 0%;
    height: 100vh;
  }

  to {
    background-position: 50% 100%;
    height: 8vh;
  }
}

.header-spacer-native {
  height: 100vh;
}

.header-spacer-polyfill {
  height: 40vh;
}

.explorable-explainer {
  --header-content-offset: calc(6.5vh + 1rem);
  display: flex;
  flex-direction: row;
  gap: 1rem;
}

.chart-container {
  flex: 1.2 1 25rem;
  min-width: 0;
  position: relative;
}

.main-chart {
  position: sticky;
  top: var(--header-content-offset);
  margin-left: 1rem;
  align-self: flex-start;
}

.chart-wrapper {
  border: 0.01rem solid var(--panel-border-color);
  border-radius: 0.3rem;
  padding-bottom: 1rem;
  background: var(--spcd3-bg);
  color: var(--chart-text-color);
}

#chart-title {
  font-size: clamp(1rem, 0.9rem + 0.6vw, 1.35rem);
  font-weight: 700;
  text-align: center;
  margin-top: clamp(0.5rem, 0.4rem + 0.6vw, 1rem);
}

#spcd3-parallelcoords {
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  flex: 1 1 auto;
  transition: opacity 0.5s ease;
}

.text-container {
  flex: 1 1 23rem;
  min-width: 23rem;
  display: flex;
  flex-direction: column;
  margin-right: 0.5rem;
  overflow: visible;
  max-height: none;
  height: auto;
}

.pic {
  margin-left: 2rem;
  padding-right: 4rem;
}

section {
  background: var(--content-panel-background);
  border: 0.01rem solid var(--panel-border-color);
  border-radius: 0.3rem;
  margin-bottom: 1rem;
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
  .explorable-explainer.portrait-resizable {
    --header-content-offset: calc(5vh + 2rem);
    flex-direction: column;
    gap: 0;
  }

  .navigation-dropdown {
    margin-top: 1rem;
  }

  .main-chart {
    position: fixed;
    top: calc(5vh + 1rem);
    left: 0.5rem;
    right: 0.5rem;
    margin-left: 0;
    z-index: 201;
    background: var(--page-background);
  }

  .text-container {
    min-width: 0;
    margin-right: 0;
  }

  #spcd3-parallelcoords {
    touch-action: pan-y;
  }
}

@media (max-width: 50em) and (orientation: portrait) {
  #chart-title {
    font-size: clamp(0.95rem, 0.9rem + 0.35vw, 1.1rem);
    margin-top: clamp(0.35rem, 0.25rem + 0.3vw, 0.5rem);
  }
}

@media (max-width: 37.5em) and (orientation: portrait) {
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
    min-width: 0;
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
  .single-line {
    white-space: normal;
    line-height: 1.15;
  }
  .explorable-explainer {
    flex-direction: row;
    align-items: stretch;
  }

  .chart-container {
    flex: 1 1 50%;
  }

  .main-chart {
    position: sticky;
    margin-left: 1rem;
  }

  .text-container {
    flex: 1 1 50%;
    margin-right: 1rem;
  }

  #chart-title {
    font-size: clamp(0.9rem, 0.85rem + 0.3vw, 1rem);
    margin-top: 0.25rem;
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
  color: var(--accent-text-color);
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
  color: var(--error-text-color);
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

:root[data-theme='dark'] .figure-row img[src*="correlation-"] {
  filter: invert(1) hue-rotate(180deg);
}

:root[data-theme='dark'] img[src$=".png"] {
  filter: invert(1) hue-rotate(180deg);
}

figcaption {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  font-size: small;
}

/* References section */
#border {
  border-bottom: var(--brand-accent-background) 0.4rem;
  border-bottom-style: solid;
  margin-top: 10rem;
}

.references {
  background: var(--floating-card-background);
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

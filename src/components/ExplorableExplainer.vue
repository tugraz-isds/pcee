<template>
  <div>
    <div
      ref="header"
      :class="['sticky-header', { 'use-native': supportsScrollDrivenAnimations }]"
    >
      <div class="header-actions">
        <a
          class="header-action-button"
          :href="repoUrl"
        >
          <img
            class="header-icon-image"
            src="/svg/github.svg"
          >
        </a>
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
      <button
        type="button"
        class="about-close"
        @click="showAbout = false"
      >
        x
      </button>
      <div v-html="aboutText" />
      <div class="about-version-row">
        <p class="about-copy">
          PCEE version: {{ appVersion }}&nbsp;&nbsp;{{ releaseDate }}
        </p>
        <p class="about-copy">
          SPCD3 version: 1.0.0&nbsp;&nbsp;26 Jul 2026
        </p>
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
  <div
    ref="explainerRoot"
    :class="[
      'explorable-explainer',
      {
        'portrait-reading-mode': portraitReadingMode,
        'portrait-chart-restoring': portraitChartRestoring,
      },
    ]"
  >
    <div
      ref="chartContainer"
      class="chart-container"
    >
      <div
        ref="mainChart"
        class="main-chart"
      >
        <NavigationDropdown :offset="60" />
        <div class="chart-wrapper">
          <h3 id="chart-title">
            Personal Finances Dataset
          </h3>
          <div id="spcd3-parallelcoords" />
        </div>
      </div>
    </div>
    <div class="portrait-sheet-controls" aria-label="Text area size">
      <button
        type="button"
        class="portrait-mode-toggle"
        :class="{ active: portraitReadingMode }"
        @click="togglePortraitReadingMode"
      >
        <img src="/svg/split.svg" alt="" aria-hidden="true">
      </button>
    </div>
    <div class="text-container">
      <div v-html="introText" />
      <div v-html="financeDatasetText" />
      <Table/>
      <div v-html="recordOperationsText" />
      <div v-html="dimensionOperationsText" />
      <div v-html="otherFunctionalityText" />
      <div
        ref="usageContainer" 
        v-html="usageText" 
      />
      <Stepper/>
    </div>
  </div>
  <div
    ref="multipleViewsContainer"
    class="multiple-views-content"
    v-html="multipleViewsText"
  />
  <div v-html="referencesDatasetText" />
  <Teleport to="body">
    <div
      v-if="isImageViewerOpen"
      class="image-viewer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
      @click.self="closeImageViewer"
      @wheel.prevent="handleImageViewerWheel"
    >
      <div
        ref="imageViewerContainer"
        class="image-viewer-container"
        @pointerdown="startImageDrag"
        @pointermove="dragImage"
        @pointerup="stopImageDrag"
        @pointercancel="stopImageDrag"
      >
        <img
          ref="imageViewerImage"
          :src="zoomSrc ?? ''"
          :class="[
            'image-viewer-image',
            { 'image-viewer-image-svg': zoomSrc?.toLowerCase().endsWith('.svg') },
          ]"
          :style="imageViewerStyle"
          draggable="false"
          @load="initializeImageViewer"
        >
      </div>
      <button
        type="button"
        class="image-viewer-button image-viewer-reset"
        title="Reset zoom"
        aria-label="Reset zoom"
        @click="resetImageZoom"
      >
        ⧉
      </button>
      <button
        type="button"
        class="image-viewer-button image-viewer-zoom-out"
        title="Zoom out"
        aria-label="Zoom out"
        @click="zoomOutImage"
      >
        −
      </button>
      <button
        type="button"
        class="image-viewer-button image-viewer-zoom-in"
        title="Zoom in"
        aria-label="Zoom in"
        @click="zoomInImage"
      >
        +
      </button>
      <button
        type="button"
        class="image-viewer-button image-viewer-close"
        title="Close image viewer"
        aria-label="Close image viewer"
        @click="closeImageViewer"
      >
        ×
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, provide } from 'vue';
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
const otherFunctionalityText = ref('');
const usageText = ref('');
const healthDatasetText = ref('');
const multipleViewsText = ref('');
const financeDatasetText = ref('');
const referencesDatasetText = ref('');
const aboutText = ref('');
const header = ref<HTMLElement | null>(null);
const multiLine = ref<HTMLElement | null>(null);
const singleLine = ref<HTMLElement | null>(null);
const explainerRoot = ref<HTMLElement | null>(null);
const chartContainer = ref<HTMLElement | null>(null);
const mainChart = ref<HTMLElement | null>(null);
const usageContainer = ref<HTMLDivElement | null>(null);
const multipleViewsContainer = ref<HTMLDivElement | null>(null);
const zoomSrc = ref<string | null>(null);
const isImageViewerOpen = ref(false);
const imageViewerContainer = ref<HTMLDivElement | null>(null);
const imageViewerImage = ref<HTMLImageElement | null>(null);
const imageZoomFactor = ref(1);
const initialImageZoomFactor = ref(1);
const imageWidth = ref(0);
const imageHeight = ref(0);
const imageOffsetX = ref(0);
const imageOffsetY = ref(0);
const showAbout = ref(false);
let activeImagePointerId: number | null = null;
let imageDragStartX = 0;
let imageDragStartY = 0;
let lastStep = -1;
const appVersion = packageInfo.version;
const releaseDate = new Date(packageInfo.releaseDate).toLocaleDateString('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const repoUrl = packageInfo.repository.url;
const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const PORTRAIT_RESIZE_QUERY = '(max-width: 60em) and (orientation: portrait)';
const darkModeMediaQuery =
  typeof window !== 'undefined' ? window.matchMedia(DARK_MODE_MEDIA_QUERY) : null;
const portraitResizeMediaQuery =
  typeof window !== 'undefined' ? window.matchMedia(PORTRAIT_RESIZE_QUERY) : null;
const portraitReadingMode = ref(false);
const portraitReadingModeManuallyToggled = ref(false);
const portraitChartRestoring = ref(false);
let portraitChartFitTimer: number | null = null;
let portraitChartObserver: MutationObserver | null = null;

const isPortraitResizeMode = (): boolean => {
  return portraitResizeMediaQuery?.matches ?? false;
}

const alignSpcd3ToolbarToLabels = (): void => {
  requestAnimationFrame(() => {
    const toolbarRow = document.getElementById('spcd3-toolbarRow');
    const svgNode = document.getElementById('spcd3-pc_svg');
    const axisNodes = Array.from(document.querySelectorAll<SVGGElement>('#spcd3-pc_svg .dimensions'));
    if (!toolbarRow || !svgNode || axisNodes.length === 0) return;

    const leftmostAxis = axisNodes.reduce((leftmost, axis) => (
      axis.getBoundingClientRect().left < leftmost.getBoundingClientRect().left ? axis : leftmost
    ));
    const labelNodes = Array.from(leftmostAxis.querySelectorAll<SVGTextElement>('.tick text'));
    const labelLeft = labelNodes.reduce(
      (left, label) => Math.min(left, label.getBoundingClientRect().left),
      leftmostAxis.getBoundingClientRect().left,
    );
    toolbarRow.style.paddingLeft = `${Math.max(0, labelLeft - toolbarRow.getBoundingClientRect().left)}px`;
  });
};

const updatePortraitChartFit = (): void => {
  if (!explainerRoot.value || !isPortraitResizeMode() || portraitReadingMode.value) return;

  const chartArea = document.getElementById('spcd3-parallelcoords') as HTMLDivElement | null;
  const svgNode = document.getElementById('spcd3-pc_svg') as SVGSVGElement | null;
  if (!chartArea || !svgNode) return;

  const naturalWidth = Number.parseFloat(svgNode.getAttribute('width') ?? '');
  const naturalHeight = Number.parseFloat(svgNode.getAttribute('height') ?? '');
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) {
    return;
  }

  const availableWidth = Math.max(220, chartArea.clientWidth - 12);
  const splitModeMaxHeight = (window.visualViewport?.height ?? window.innerHeight) * 0.45;
  const chartChromeHeight = Math.max(
    0,
    (mainChart.value?.getBoundingClientRect().height ?? 0) - chartArea.clientHeight,
  );
  const toolbarHeight =
    chartArea.querySelector('#spcd3-toolbarRow')?.getBoundingClientRect().height ?? 0;
  const availableHeight = Math.max(
    120,
    splitModeMaxHeight - chartChromeHeight - toolbarHeight - 16,
  );
  const fitScale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);

  explainerRoot.value.style.setProperty('--portrait-chart-width', `${Math.round(naturalWidth * fitScale)}px`);
  const chartAreaTop = chartArea.getBoundingClientRect().top;
  const renderedSvgHeight = Math.max(
    naturalHeight * fitScale,
    svgNode.getBoundingClientRect().bottom - chartAreaTop,
  );
  explainerRoot.value.style.setProperty(
    '--portrait-chart-content-height',
    `${Math.ceil(chartChromeHeight + renderedSvgHeight + 8)}px`,
  );
}

const schedulePortraitChartFit = (): void => {
  requestAnimationFrame(updatePortraitChartFit);

  if (portraitChartFitTimer !== null) {
    window.clearTimeout(portraitChartFitTimer);
  }

  portraitChartFitTimer = window.setTimeout(() => {
    portraitChartFitTimer = null;
    updatePortraitChartFit();
  }, 220);
}

const ensurePortraitChartHeight = (): void => {
  if (!explainerRoot.value) return;
  if (!isPortraitResizeMode()) {
    explainerRoot.value.style.removeProperty('--portrait-chart-width');
    explainerRoot.value.style.removeProperty('--portrait-chart-content-height');
    return;
  }
  schedulePortraitChartFit();
}

const togglePortraitReadingMode = (): void => {
  portraitReadingModeManuallyToggled.value = true;
  const isReturningToSplit = portraitReadingMode.value;
  portraitReadingMode.value = !portraitReadingMode.value;

  if (!isReturningToSplit) return;

  portraitChartRestoring.value = true;
  if (portraitChartFitTimer !== null) {
    window.clearTimeout(portraitChartFitTimer);
    portraitChartFitTimer = null;
  }

  requestAnimationFrame(() => {
    updatePortraitChartFit();
    requestAnimationFrame(() => {
      portraitChartRestoring.value = false;
    });
  });
}

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
    if (img.classList.contains('svg')) {
      return;
    }
    openImageViewer(img.src);
  }
}

const imageViewerStyle = computed(() => ({
  width: `${imageWidth.value * imageZoomFactor.value}px`,
  height: `${imageHeight.value * imageZoomFactor.value}px`,
  left: `${imageOffsetX.value}px`,
  top: `${imageOffsetY.value}px`,
}));

const openImageViewer = (src: string): void => {
  zoomSrc.value = src;
  isImageViewerOpen.value = true;
};

const closeImageViewer = (): void => {
  isImageViewerOpen.value = false;
  activeImagePointerId = null;
};

const applyImageOffset = (center: boolean): void => {
  const container = imageViewerContainer.value;
  if (!container) return;

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  const currentImageWidth = imageWidth.value * imageZoomFactor.value;
  const currentImageHeight = imageHeight.value * imageZoomFactor.value;

  if (center || currentImageWidth <= containerWidth) {
    imageOffsetX.value = (containerWidth - currentImageWidth) / 2;
  }
  else {
    imageOffsetX.value = Math.min(0, Math.max(containerWidth - currentImageWidth, imageOffsetX.value));
  }

  if (center || currentImageHeight <= containerHeight) {
    imageOffsetY.value = (containerHeight - currentImageHeight) / 2;
  }
  else {
    imageOffsetY.value = Math.min(0, Math.max(containerHeight - currentImageHeight, imageOffsetY.value));
  }
};

const resetImageZoom = (): void => {
  if (!imageWidth.value || !imageHeight.value || !imageViewerContainer.value) return;

  const container = imageViewerContainer.value;
  const imageAspectRatio = imageWidth.value / imageHeight.value;
  const containerAspectRatio = container.clientWidth / container.clientHeight;

  initialImageZoomFactor.value = containerAspectRatio > imageAspectRatio
    ? container.clientHeight / imageHeight.value
    : container.clientWidth / imageWidth.value;
  imageZoomFactor.value = initialImageZoomFactor.value;
  applyImageOffset(true);
};

const initializeImageViewer = (event: Event): void => {
  const image = event.target as HTMLImageElement;
  imageWidth.value = image.naturalWidth;
  imageHeight.value = image.naturalHeight;
  resetImageZoom();
};

const zoomImage = (factor: number, clientX?: number, clientY?: number): void => {
  const container = imageViewerContainer.value;
  if (!container || !initialImageZoomFactor.value) return;

  const nextZoomFactor = Math.max(
    initialImageZoomFactor.value / 10,
    imageZoomFactor.value * factor,
  );
  if (nextZoomFactor === imageZoomFactor.value) return;

  const bounds = container.getBoundingClientRect();
  const pivotX = clientX == null ? container.clientWidth / 2 : clientX - bounds.left;
  const pivotY = clientY == null ? container.clientHeight / 2 : clientY - bounds.top;
  const zoomRatio = nextZoomFactor / imageZoomFactor.value;

  imageOffsetX.value = pivotX - (pivotX - imageOffsetX.value) * zoomRatio;
  imageOffsetY.value = pivotY - (pivotY - imageOffsetY.value) * zoomRatio;
  imageZoomFactor.value = nextZoomFactor;
  applyImageOffset(false);
};

const zoomInImage = (): void => zoomImage(1.2);
const zoomOutImage = (): void => zoomImage(1 / 1.2);

const handleImageViewerWheel = (event: WheelEvent): void => {
  zoomImage(event.deltaY < 0 ? 1.2 : 1 / 1.2, event.clientX, event.clientY);
};

const startImageDrag = (event: PointerEvent): void => {
  if (event.button !== 0) return;

  activeImagePointerId = event.pointerId;
  imageDragStartX = event.clientX;
  imageDragStartY = event.clientY;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
};

const dragImage = (event: PointerEvent): void => {
  if (activeImagePointerId !== event.pointerId) return;

  imageOffsetX.value += event.clientX - imageDragStartX;
  imageOffsetY.value += event.clientY - imageDragStartY;
  imageDragStartX = event.clientX;
  imageDragStartY = event.clientY;
  applyImageOffset(false);
};

const stopImageDrag = (event: PointerEvent): void => {
  if (activeImagePointerId !== event.pointerId) return;

  activeImagePointerId = null;
  (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
};

const handleImageViewerKeydown = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && isImageViewerOpen.value) {
    closeImageViewer();
  }
};

const resizeImageViewer = (): void => {
  if (isImageViewerOpen.value) {
    applyImageOffset(true);
  }
};

const isPortrait = (): boolean => {
  return window.innerHeight > window.innerWidth;
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
  (document.getElementById('cluster-button') as HTMLButtonElement | null)?.setAttribute('disabled', '');
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

  const clusterBtn = document.getElementById('cluster-button') as HTMLButtonElement | null;
  if (clusterBtn) clusterBtn.textContent = 'Show Clusters';

  const negBtn = document.getElementById('correlation-neg-button') as HTMLButtonElement | null;
  if (negBtn) negBtn.textContent = 'Move Fitness Score Dimension';

  ['move-error', 'invert-error', 'show-error'].forEach(id => {
    const el = document.getElementById(id) as HTMLParagraphElement | null;
    if (el) el.textContent = '';
  });

  (document.getElementById('outlier-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
  (document.getElementById('cluster-button') as HTMLButtonElement | null)?.removeAttribute('disabled');
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
  if (isPortraitResizeMode() && step >= 3) {
    portraitReadingModeManuallyToggled.value = false;
  }

  if (isPortraitResizeMode() && !portraitReadingModeManuallyToggled.value) {
    const shouldUseReadingMode = step >= 3;
    if (portraitReadingMode.value !== shouldUseReadingMode) {
      portraitReadingMode.value = shouldUseReadingMode;
      schedulePortraitChartFit();
    }
  }

  if (step === lastStep) return;

  if (
    !isPortraitResizeMode()
    && ((step === 3 && lastStep !== 4) || (step === 2 && lastStep === 3))
  ) {
    lastStep = step;
    return;
  }

  lastStep = step;

  const chartStep = step === 3 && !isPortraitResizeMode() ? 2 : step;
  const dataset = getDatasetForStep(chartStep);
  writeTitleToDataset(chartStep);
  chart.style.opacity = '0';

  window.setTimeout(() => {

    if (step === 4) {
      chart.style.visibility = 'hidden';
      chart.innerHTML = '';
    }
    else if (step === 3) {
      if (isPortraitResizeMode()) {
        chart.style.visibility = 'hidden';
        chart.innerHTML = '';
      } else {
        handleStudentDataset(chart, dataset);
      }
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
    requestAnimationFrame(updatePortraitChartFit);
    if (!isPortraitResizeMode()) {
      resetCurrentStep();
    }
    
  }, 450);
});

onBeforeUnmount(() => {
  if (portraitChartFitTimer !== null) {
    window.clearTimeout(portraitChartFitTimer);
  }
  portraitChartObserver?.disconnect();
  portraitResizeMediaQuery?.removeEventListener('change', ensurePortraitChartHeight);
  window.removeEventListener('resize', ensurePortraitChartHeight);
  window.removeEventListener('resize', resizeImageViewer);
  window.removeEventListener('keydown', handleImageViewerKeydown);
  if (usageContainer.value) {
    usageContainer.value.removeEventListener("click", handleClick);
  }
  if (multipleViewsContainer.value) {
    multipleViewsContainer.value.removeEventListener("click", handleClick);
  }

  darkModeMediaQuery?.removeEventListener('change', syncThemeWithSystemPreference);
})

onMounted(async (): Promise<void> => {
  syncThemeWithSystemPreference();
  darkModeMediaQuery?.addEventListener('change', syncThemeWithSystemPreference);
  window.addEventListener('resize', resizeImageViewer);
  window.addEventListener('keydown', handleImageViewerKeydown);
  initalLoadOfDataset();
  loadContent(introText, 'content/introduction.html');
  loadContent(financeDatasetText, 'content/data-finance.html');
  loadContent(recordOperationsText, 'content/operations-records.html');
  loadContent(dimensionOperationsText, 'content/operations-dimensions.html');
  loadContent(otherFunctionalityText, 'content/other-functionality.html');
  loadContent(healthDatasetText, 'content/data-health.html');
  loadContent(usageText, 'content/usage.html');
  loadContent(multipleViewsText, 'content/multipleviews.html');
  loadContent(referencesDatasetText, 'content/resources.html');
  loadContent(aboutText, 'content/about.html');

  const container = usageContainer.value;
  if(container) {
    container.addEventListener('click', handleClick);
  }

  const multipleViews = multipleViewsContainer.value;
  if(multipleViews) {
    multipleViews.addEventListener('click', handleClick);
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

  ensurePortraitChartHeight();
  const chartArea = document.getElementById('spcd3-parallelcoords');
  if (chartArea) {
    portraitChartObserver = new MutationObserver(() => {
      schedulePortraitChartFit();
      alignSpcd3ToolbarToLabels();
    });
    portraitChartObserver.observe(chartArea, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['width', 'height', 'viewBox'],
    });
  }
  alignSpcd3ToolbarToLabels();
  portraitResizeMediaQuery?.addEventListener('change', ensurePortraitChartHeight);
  window.addEventListener('resize', () => {
    ensurePortraitChartHeight();
    requestAnimationFrame(updatePortraitChartFit);
    alignSpcd3ToolbarToLabels();
  });
});

</script>

<style>
/* Header native and polyfill */
:root {
  --sticky-header-gap: 0.5rem;
  --image-zoom-svg-background: #ffffff;
}

:root[data-theme='dark'] {
  --image-zoom-svg-background: #111827;
}

.sticky-header {
  --header-actions-top: 1rem;
  --header-actions-right: 1rem;
  --header-action-size: clamp(1.8rem, 4.5vh, 2.4rem);
  --header-actions-gap: clamp(0.35rem, 1.2vw, 0.75rem);
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

.sticky-header::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(-1 * var(--sticky-header-gap));
  height: var(--sticky-header-gap);
  background: var(--page-background);
  pointer-events: none;
}

.header-actions {
  position: absolute;
  top: min(var(--header-actions-top), calc(50% - (var(--header-action-size) / 2)));
  right: var(--header-actions-right);
  display: flex;
  gap: var(--header-actions-gap);
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
  inline-size: var(--header-action-size);
  block-size: var(--header-action-size);
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
  inline-size: calc(var(--header-action-size) * 0.65);
  block-size: calc(var(--header-action-size) * 0.65);
  flex: 0 0 auto;
  display: block;
  object-fit: contain;
  filter: var(--toolbar-icon-filter);
}

.image-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  background: rgb(0 0 0 / 90%);
  user-select: none;
}

.image-viewer-container {
  position: relative;
  inline-size: 100%;
  block-size: 100%;
  overflow: hidden;
  cursor: grab;
}

.image-viewer-container:active {
  cursor: grabbing;
}

.image-viewer-image {
  position: absolute;
  max-width: none;
  max-height: none;
  background: #ffffff;
  cursor: inherit;
  touch-action: none;
}

.image-viewer-image-svg {
  box-sizing: border-box;
  padding: clamp(0.75rem, 2vw, 1.5rem);
  background: var(--image-zoom-svg-background);
  border: 0.0625rem solid var(--ui-border-color);
  border-radius: 0.5rem;
}

.image-viewer-button {
  position: fixed;
  z-index: 1;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: #f1f1f1;
  padding: 0;
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
  text-shadow: -0.0625rem -0.0625rem 0 #000, 0.0625rem -0.0625rem 0 #000,
    -0.0625rem 0.0625rem 0 #000, 0.125rem 0.125rem 0 #000;
  cursor: pointer;
}

.image-viewer-button:hover,
.image-viewer-button:focus-visible {
  color: #bbbbbb;
}

.image-viewer-close {
  top: 1rem;
  right: 1rem;
}

.image-viewer-zoom-in {
  right: 1rem;
  bottom: 1rem;
}

.image-viewer-zoom-out {
  right: 3rem;
  bottom: 1rem;
}

.image-viewer-reset {
  right: 5rem;
  bottom: 1rem;
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
  padding-inline-end: 6.25rem;
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
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(42rem, 100%);
  max-height: calc(100vh - 2rem);
  border-radius: 0.6rem;
  background: var(--floating-card-background);
  color: var(--body-text-color);
  padding: 2.6rem 1.1rem 1rem;
  box-shadow: 0 1rem 2.5rem rgb(0 0 0 / 22%);
  overflow: auto;
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
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  margin-top: 0;
  border: 0.01rem solid var(--ui-border-color);
  border-radius: 999rem;
  background: var(--subtle-panel-background);
  padding: 0.35rem 0.8rem;
}

.about-version-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.5rem;
  margin-top: auto;
  padding-top: 1rem;
}

.about-copy {
  margin: 0;
  border-left: 0;
  text-indent: 0;
  text-align: center;
  font-size: 0.7rem;
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
  .sticky-header {
    --header-actions-top: 0.75rem;
    --header-actions-right: 0.75rem;
    --header-action-size: clamp(1.7rem, 4.2vh, 2.1rem);
    --header-actions-gap: clamp(0.3rem, 1vw, 0.5rem);
  }

  .header-actions {
    gap: var(--header-actions-gap);
  }

  .header-action-button {
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

@media (max-width: 60em) and (orientation: portrait) {
  .header-spacer-native {
    height: 98svh;
  }
}

.explorable-explainer {
  --sticky-header-height: 8vh;
  --header-content-offset: calc(var(--sticky-header-height) + var(--sticky-header-gap));
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

#spcd3-parallelcoords .spcd3-chartWrapper {
  width: 100%;
  margin-inline: auto;
  margin-left: 0;
  overflow: hidden;
}

#spcd3-parallelcoords #spcd3-pc_svg {
  width: 100%;
  max-width: 100%;
  height: auto;
}

.portrait-sheet-controls {
  display: none;
}

@media (orientation: landscape) {
  .chart-container {
    display: flex;
  }

  .main-chart {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-block-size: 0;
  }

  .chart-wrapper {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-block-size: 0;
  }
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
  .explorable-explainer {
    --portrait-chart-max-height: 45svh;
    --portrait-chart-height: min(
      var(--portrait-chart-max-height),
      var(--portrait-chart-content-height, var(--portrait-chart-max-height))
    );
    flex-direction: column;
    gap: 0;
  }

  .explorable-explainer.portrait-reading-mode {
    --portrait-chart-height: 0px;
  }

  .chart-container {
    flex: 0 0 var(--portrait-chart-height);
    block-size: var(--portrait-chart-height);
    min-block-size: 0;
    min-width: 0;
    overflow: clip;
  }

  .navigation-dropdown {
    margin-block: 0.15rem;
  }

  #chart-title {
    font-size: clamp(0.8rem, 0.75rem + 0.2vw, 0.95rem);
    margin-top: 0.3rem;
  }

  .main-chart {
    position: fixed;
    top: var(--header-content-offset);
    left: 0.5rem;
    right: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    block-size: var(--portrait-chart-height);
    margin-left: 0;
    z-index: 300;
    background: var(--page-background);
    overflow: clip;
    transition: opacity 180ms ease;
  }

  .chart-wrapper {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    min-height: 0;
    block-size: 100%;
    overflow: clip;
  }

  .text-container {
    position: relative;
    z-index: 1;
    block-size: auto;
    min-width: 0;
    margin-right: 0;
    padding: 0 0 1rem;
    border-top: 0;
    border-radius: 1rem 1rem 0 0;
    background: var(--page-background);
    box-shadow: none;
  }

  .portrait-sheet-controls {
    position: fixed;
    top: calc(var(--header-content-offset) + var(--portrait-chart-height));
    left: 0.5rem;
    right: 0.5rem;
    z-index: 301;
    display: flex;
    justify-content: center;
    gap: 0.18rem;
    padding: 0.15rem 0;
    background: var(--page-background);
  }

  .portrait-sheet-controls button {
    min-block-size: 1.3rem;
    margin: 0;
    padding: 0.05rem 0.3rem;
    border: 0.01rem solid var(--panel-border-color);
    border-radius: 999rem;
    background: var(--content-panel-background);
    color: var(--body-text-color);
    font-size: 0.58rem;
    line-height: 1;
  }

  .portrait-sheet-controls button.active {
    border-color: var(--brand-accent-background);
    background: var(--brand-accent-background);
    color: var(--accent-contrast-text-color);
  }

  .portrait-mode-toggle img {
    inline-size: 0.75rem;
    block-size: 0.75rem;
  }

  .portrait-sheet-controls .portrait-mode-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 100%;
    min-block-size: 0.9rem;
    border: 0.01rem solid var(--panel-border-color);
    border-radius: 0.3rem;
    background: #f1f1f1;
  }

  .portrait-sheet-controls .portrait-mode-toggle.active {
    background: #f1f1f1;
  }

  .portrait-reading-mode .main-chart {
    opacity: 0;
    pointer-events: none;
  }

  .portrait-chart-restoring .main-chart {
    opacity: 0;
    pointer-events: none;
  }

  #spcd3-parallelcoords {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    touch-action: pan-y;
    flex: 1 1 auto;
    inline-size: 100%;
    min-height: 0;
    overflow: auto;
    overscroll-behavior: contain;
  }

  #spcd3-parallelcoords .spcd3-chartWrapper {
    flex: 0 0 auto;
    inline-size: min(100%, var(--portrait-chart-width, 100%));
    block-size: auto;
    max-inline-size: 100%;
    margin-inline: auto;
    margin-left: auto;
    margin-right: auto;
    overflow: visible;
  }

  #spcd3-parallelcoords #spcd3-pc_svg {
    display: block;
    inline-size: 100%;
    block-size: auto;
    max-inline-size: 100%;
    margin-inline: auto;
  }
}

@media (max-width: 50em) and (orientation: portrait) {
  #chart-title {
    font-size: clamp(0.8rem, 0.75rem + 0.2vw, 0.9rem);
    margin-top: 0.25rem;
  }
}

@media (max-width: 37.5em) and (orientation: portrait) {
  #chart-title {
    font-size: 0.8rem;
    margin-top: 0.2rem;
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
    font-size: 0.75rem;
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
  margin-right: -0.25em;
}

.liinstruction::after {
  content: "}";
  margin-left: -0.25em;
}

.liinstruction {
  border-left: 0 solid transparent;
  font-style: italic;
  color: var(--accent-text-color);
  text-indent: 0;
  text-align: left;
  hyphens: none;
  font-size: 0.8em;
}

.liinstruction svg,
.inline-icon {
  display: inline-block;
}

.inline-icon {
  vertical-align: -0.16em;
}

.inline-icon--record-filter {
  vertical-align: -0.48em;
}

.inline-icon--toolbar-toggle {
  vertical-align: -0.25em;
}

.inline-icon--text-centered {
  vertical-align: -0.09em;
}

/* Buttons */
button {
  padding: 0.25rem;
  font-size: 90%;
  margin-top: 0.5rem;
}

.spcd3-chart-modal .spcd3-button,
.spcd3-modal .spcd3-button,
.spcd3-modal-tabledata .spcd3-button {
  margin-top: 0;
  font-size: inherit;
}

.spcd3-modal .spcd3-save-button {
  display: inline-flex;
  align-items: center;
  min-block-size: 1.7rem;
  margin: 0 0 0 0.5rem;
  vertical-align: middle;
}

.spcd3-contextmenu-records,
.spcd3-contextmenu-dimensions {
  font-size: 0.75rem;
}

@media (max-width: 60em) and (orientation: portrait) {
  .spcd3-contextmenu-records,
  .spcd3-contextmenu-dimensions {
    font-size: 0.6rem;
  }

  .spcd3-toolbar-button {
    width: 1.05rem;
    height: 1.05rem;
  }

  .spcd3-toolbar-buttonicon {
    width: 0.72rem;
    height: 0.72rem;
  }
}

.usage-button {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

.error {
  color: var(--error-text-color);
}

[content-section] a:not([class]),
.references a:not([class]) {
  color: var(--body-link-color);
  text-decoration: underline;
}

[content-section] a:not([class]):hover,
.references a:not([class]):hover {
  color: var(--body-link-hover-color);
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
  min-width: 0;
  text-align: center;
  margin: 0;
  cursor: zoom-in;
}

.figure-row img {
  max-width: 100%;
  height: auto;
}

.multiple-views-image {
  width: 100%;
  height: auto;
  padding-left: 1rem;
  padding-top: 1rem;
}

:root[data-theme='dark'] .figure-row img[src*="correlation-"],
:root[data-theme='dark'] .figure-row img[src*="clusters-"] {
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
.references {
  background: var(--floating-card-background);
  margin-top: 1rem;
  width: auto;
}

@media (orientation: landscape) {
  .multiple-views-content .references {
    margin-top: 5rem;
  }
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

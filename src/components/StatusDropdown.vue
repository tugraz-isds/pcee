<template>
  <select
    class="mb-4 mt-4 w-auto rounded-md border border-gray-200 bg-[rgb(253,252,250)] px-2.5 py-1.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
    :value="activeId"
    @change="onChange"
  >
    <option 
      v-for="section in sections" 
      :key="section.id" 
      :value="section.id"
    >
      {{ section.title }}
    </option>
  </select>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

type ModeKey = 'portrait' | 'landscape';

interface ModeConfig {
  query: string;
  containerSelector: string;
  rootSelector?: string;
  offsetElementSelector?: string;
  offsetFallback?: number;
  sectionQuery?: string;
  activeRatio?: number;
}

interface Properties {
  // eslint-disable-next-line vue/require-default-prop
  config?: Partial<Record<ModeKey, Partial<ModeConfig>>>;
  smooth?: boolean;
  useHeadingTitle?: boolean;
}

const properties = withDefaults(defineProps<Properties>(), {
  smooth: true,
  useHeadingTitle: true,
});

const defaults: Record<ModeKey, ModeConfig> = {
  portrait: {
    query: '(max-width: 900px), (orientation: portrait) and (max-width: 1200px)',
    containerSelector: '',
    rootSelector: '.text-container',
    offsetElementSelector: '#chart-container',
    offsetFallback: 300,
    activeRatio: 0.25,
    sectionQuery: '[content-section]',
  },
  landscape: {
    query: '(min-width: 901px) and (orientation: landscape)',
    containerSelector: '',
    rootSelector: '#text',
    offsetElementSelector: '#header',
    offsetFallback: 0,
    activeRatio: 0.5,
    sectionQuery: '[content-section]',
  },
};

const getConfig = (mode: ModeKey): ModeConfig => {
  return { ...defaults[mode], ...(properties.config?.[mode] ?? {}) } as ModeConfig;
}

interface SectionInfo {
  id: string;
  title: string;
  element: HTMLElement;
  top: number;
  bottom: number;
}

const mode = ref<'portrait' | 'landscape'>('landscape');
const mqlPortrait = window.matchMedia(getConfig('portrait').query);
const mqlLandscape = window.matchMedia(getConfig('landscape').query);

const OFFSET_LANDSCAPE = ['.sticky-header'];
const OFFSET_PORTRAIT  = ['.sticky-header', '.main-chart'];
const MIN_OVERLAP_PX = 56;
const HYSTERESIS_PX  = 32;
const IDLE_MS = 140;
const suppressUntil = ref(0);
let idleTimer: number | null = null;
let pendingSnap: HTMLElement | null = null;
let lastScrollY = 0;
let scrollDir: 1 | -1 | 0 = 0;

// eslint-disable-next-line no-undef
const scroller = ref<Window | HTMLElement>(window);
const sections = ref<SectionInfo[]>([]);
const activeId = ref<string>('');

let ticking = false;
// eslint-disable-next-line no-undef
let resizeObs: ResizeObserver | null = null;
// eslint-disable-next-line no-undef
let stickyObs: ResizeObserver | null = null;
// eslint-disable-next-line no-undef
let mutObs: MutationObserver | null = null;

const getCurrentConfig = (): ModeConfig => {
  return getConfig(mode.value);
}

const resolveScroller = (): void => {
  const { containerSelector } = getCurrentConfig();
  scroller.value = containerSelector
    ? (document.querySelector(containerSelector) as HTMLElement) || window
    : window;
}

// eslint-disable-next-line no-undef
const getScrollY = (scroller: Window | HTMLElement): number => {
  return scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop;
}

// eslint-disable-next-line no-undef
const setScrollY = (y: number, behavior: ScrollBehavior = 'auto'): void => {
  if (scroller.value === window) {
    window.scrollTo({ top: y, behavior });
  } else {
    (scroller.value as HTMLElement).scrollTo({ top: y, behavior });
  }
}

// eslint-disable-next-line no-undef
const getViewportHeight = (scroller: Window | HTMLElement): number => {
  return scroller === window
    ? (window.visualViewport?.height ?? window.innerHeight)
    : (scroller as HTMLElement).clientHeight;
}

// eslint-disable-next-line no-undef
const getTopPositionOfSection = (el: HTMLElement, scroller: Window | HTMLElement): number => {
  if (scroller === window) {
    const r = el.getBoundingClientRect();
    return getScrollY(scroller) + r.top;
  } else {
    const r = el.getBoundingClientRect();
    const sr = (scroller as HTMLElement).getBoundingClientRect();
    return (scroller as HTMLElement).scrollTop + (r.top - sr.top);
  }
}

const getTitleOfSection = (element: HTMLElement): string => {
  if (properties.useHeadingTitle) {
    const header = element.querySelector('h1,h2,h3');
    if (header?.textContent) {
      return header.textContent.trim();
    }
  }
  return element.id || 'Section';
}

const getAllSection = (): void => {
  const cfg = getCurrentConfig();
  const root = cfg.rootSelector ? (document.querySelector(cfg.rootSelector) ?? document) : document;
  const query = cfg.sectionQuery ?? '[content-section]';

  const nodes = Array.from(root.querySelectorAll<HTMLElement>(query));
  const tops = nodes.filter(n => !nodes.some(m => m !== n && m.contains(n)));

  sections.value = tops.map(element => {
    let id = element.id;
    if (!id) {
      const base = getTitleOfSection(element).toLowerCase().replace(/\s+/g,'-').replace(/[^\w-]/g,'');
      id = base || 'section';
      element.id = id;
    }
    const title = getTitleOfSection(element);
    const top = getTopPositionOfSection(element, scroller.value);
    const bottom = top + element.offsetHeight;
    return { id, title, element, top, bottom };
  });
};

const recalcPositions = (): void => {
  sections.value.forEach(section => {
    section.top = getTopPositionOfSection(section.element, scroller.value);
    section.bottom = section.top + section.element.offsetHeight;
  });
}

// eslint-disable-next-line no-undef
const findActiveSection = (scr: Window | HTMLElement): void => {
  const vh = getViewportHeight(scr);
  const ratioBase = mode.value === 'portrait' ? 0.25 : 0.5;
  const ratio = ratioBase + (scrollDir === 1 ? +0.05 : scrollDir === -1 ? -0.05 : 0);

  const baseY = getScrollY(scr);
  const topLimit    = baseY + totalOffsetPx() + Math.max(8, vh * (ratio - 0.15));
  const bottomLimit = Math.min(topLimit + Math.max(220, vh * 0.5), baseY + vh);

  let best: SectionInfo | null = null;
  let bestOverlap = -1;

  for (const s of sections.value) {
    const overlap = Math.max(0, Math.min(s.bottom, bottomLimit) - Math.max(s.top, topLimit));
    if (overlap > bestOverlap) { bestOverlap = overlap; best = s; }
  }

  const current = sections.value.find(s => s.id === activeId.value) || null;
  if (current) {
    const curOverlap = Math.max(0, Math.min(current.bottom, bottomLimit) - Math.max(current.top, topLimit));
    const needSwitch =
      best && best.id !== current.id &&
      (bestOverlap >= Math.max(MIN_OVERLAP_PX, curOverlap + HYSTERESIS_PX));
    if (!needSwitch) return;
  }
  if (best && bestOverlap >= MIN_OVERLAP_PX && best.id !== activeId.value) {
    activeId.value = best.id;
  }
};

const onScroll = (): void => {
  const currentY = getScrollY(scroller.value);
  const dy = currentY - lastScrollY;
  scrollDir = Math.abs(dy) < 1 ? 0 : (dy > 0 ? 1 : -1);
  lastScrollY = currentY;

  if (!ticking) {
    ticking = true;
    // eslint-disable-next-line no-undef
    requestAnimationFrame(() => {
      ticking = false;
      // eslint-disable-next-line no-undef
      if (performance.now() < suppressUntil.value) return;
      findActiveSection(scroller.value);
    });
  }

  // eslint-disable-next-line no-undef
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    if (!pendingSnap) return;
    const finalY = getTopPositionOfSection(pendingSnap, scroller.value) - totalOffsetPx();
    const maxY = (scroller.value === window) 
    ? document.documentElement.scrollHeight - getViewportHeight(scroller.value) 
    : (scroller.value as HTMLElement).scrollHeight - (scroller.value as HTMLElement).clientHeight;
    const snapY = Math.max(0, Math.min(finalY, maxY));
    setScrollY(snapY, 'auto');
    pendingSnap = null;
  }, IDLE_MS);
};

const totalOffsetPx = (): number => {
  const order = mode.value === 'portrait' ? ['.sticky-header', '.main-chart']
    : ['.sticky-header'];

  let baseline = 0;
  let sum = 0;

  for (const selector of order) {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) continue;

    const rect = element.getBoundingClientRect();
    const height = rect.height;

    if (rect.top <= baseline + 1) {
      sum += height;
      baseline += height;
    }
  }
  return Math.round(sum + 2);
}

const measure = (elementSelector?: string): number => {
  if (!elementSelector) return 0;
  const element = document.querySelector(elementSelector) as HTMLElement | null;
  return element ? element.getBoundingClientRect().height : 0;
}

const recomputeScrollOffset = (): void => {
  const list = mode.value === 'portrait' ? OFFSET_PORTRAIT : OFFSET_LANDSCAPE;
  const total = list.reduce((sum, sel) => sum + measure(sel), 0);
  document.documentElement.style.setProperty('--scroll-offset', `${Math.round(total + 2)}px`);
}

// eslint-disable-next-line no-undef
const onChange = (e: Event): void => {
  // eslint-disable-next-line no-undef
  suppressUntil.value = performance.now() + 800;

  // eslint-disable-next-line no-undef
  const id = (e.target as HTMLSelectElement).value;
  const section = sections.value.find(x => x.id === id);
  if (!section) return;

  const anchor = (section.element.querySelector('[data-anchor],h1,h2,h3') as HTMLElement) || section.element;

  recomputeScrollOffset();
  recalcPositions();
  const initialY = getTopPositionOfSection(anchor, scroller.value) - totalOffsetPx();

  const maxY = (scroller.value === window)
    ? document.documentElement.scrollHeight - getViewportHeight(scroller.value)
    : (scroller.value as HTMLElement).scrollHeight - (scroller.value as HTMLElement).clientHeight;
  const y = Math.max(0, Math.min(initialY, maxY));

  pendingSnap = anchor;
  setScrollY(y, properties.smooth ? 'smooth' : 'auto');
  activeId.value = id;
};


const applyMode = (): void => {
  resolveScroller();
  recomputeScrollOffset();
  getAllSection();
  recalcPositions();
  findActiveSection(scroller.value);

  resizeObs?.disconnect();
  const target = scroller.value === window ? document.documentElement : (scroller.value as HTMLElement);
  // eslint-disable-next-line no-undef
  resizeObs = new ResizeObserver(() => { recalcPositions(); findActiveSection(scroller.value); });
  resizeObs.observe(target);

  stickyObs?.disconnect();
  const stickyElement = getCurrentConfig().offsetElementSelector
    ? document.querySelector(getCurrentConfig().offsetElementSelector as string)
    : null;
  if (stickyElement) {
    // eslint-disable-next-line no-undef
    stickyObs = new ResizeObserver(() => {
      recomputeScrollOffset();
      recalcPositions();
      findActiveSection(scroller.value);
    });
    stickyObs.observe(stickyElement);
  }

  mutObs?.disconnect();
  // eslint-disable-next-line no-undef
  mutObs = new MutationObserver(() => {
    getAllSection();
    recalcPositions();
    findActiveSection(scroller.value);
  });
  const root = getCurrentConfig().rootSelector ? document.querySelector(getCurrentConfig().rootSelector!) : document.body;
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  (root || document.body).ownerDocument?.body && mutObs.observe(document.body, {
    childList: true, subtree: true, attributes: true,
    attributeFilter: ['id','data-title','content-section','class','style'],
  });
}

onMounted(async () => {
  mode.value = mqlPortrait.matches ? 'portrait' : 'landscape';
  await nextTick();
  applyMode();
  recomputeScrollOffset();

  const target = scroller.value === window ? window : (scroller.value as HTMLElement);
  target.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('resize', () => {
    recomputeScrollOffset();
    recalcPositions();
    findActiveSection(scroller.value);
  });
  window.visualViewport?.addEventListener('resize', () => {
  recomputeScrollOffset();
  recalcPositions();
  findActiveSection(scroller.value);
  },
  { 
    passive: true
  });
  window.visualViewport?.addEventListener('scroll', () => {
    findActiveSection(scroller.value);
  },
  {
    passive: true
  });

  // eslint-disable-next-line no-undef
  const ro = new ResizeObserver(() => recomputeScrollOffset());
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  document.querySelector('.sticky-header') && ro.observe(document.querySelector('.sticky-header')!);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  document.querySelector('.main-chart')  && ro.observe(document.querySelector('.main-chart')!);

  const onModeChange = () => {
    const newMode: ModeKey = mqlPortrait.matches ? 'portrait' : 'landscape';
    if (newMode !== mode.value) {
      mode.value = newMode;
      applyMode();
      recomputeScrollOffset();
    }
  };
  mqlPortrait.addEventListener('change', onModeChange);
  mqlLandscape.addEventListener('change', onModeChange);
});
</script>

<style>
[content-section] { scroll-margin-top: var(--scroll-offset, 0px); }
</style>

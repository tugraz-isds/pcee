<template>
  <select
    class="mx-2 w-auto rounded-md border border-gray-200 bg-[rgb(229,229,220)] px-2.5 py-1.5 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
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

interface SectionInfo {
  id: string;
  title: string;
  element: HTMLElement;
  top: number;
  bottom: number;
}

interface Properties {
  offset?: number;
  smooth?: boolean;
  useHeadingTitle?: boolean;
  sectionQuery?: string;
  activeRatio?: number;
}

const properties = withDefaults(defineProps<Properties>(), {
  offset: 0,
  smooth: true,
  useHeadingTitle: true,
  sectionQuery: '[content-section]',
  activeRatio: 0.2
});

// eslint-disable-next-line no-undef
const scroller = ref<Window | HTMLElement>(window);
const sections = ref<SectionInfo[]>([]);
const activeId = ref<string>('');
let ticking = false;
// eslint-disable-next-line no-undef
let resizeObs: ResizeObserver | null = null;
// eslint-disable-next-line no-undef
let mutObs: MutationObserver | null = null;

function getScrollY(): number {
  return scroller.value === window ? window.scrollY : (scroller.value as HTMLElement).scrollTop;
}

// eslint-disable-next-line no-undef
function setScrollY(y: number, behavior: ScrollBehavior = 'auto'): void {
  if (scroller.value === window) {
    window.scrollTo({ top: y, behavior });
  } else {
    (scroller.value as HTMLElement).scrollTo({ top: y, behavior });
  }
}

function getViewportHeight(): number {
  return scroller.value === window ? window.innerHeight : (scroller.value as HTMLElement).clientHeight;
}

function getTopPositionOfSection(element: HTMLElement): number {
  if (scroller.value === window) {
    const rect = element.getBoundingClientRect();
    return getScrollY() + rect.top - properties.offset;
  } else {
    const rect = element.getBoundingClientRect();
    const sRect = (scroller.value as HTMLElement).getBoundingClientRect();
    return (scroller.value as HTMLElement).scrollTop + (rect.top - sRect.top) - properties.offset;
  }
}

function getTitleOfSection(element: HTMLElement): string {
  if (properties.useHeadingTitle) {
    const header = element.querySelector('h1,h2,h3');
    if (header?.textContent) {
      return header.textContent.trim();
    }
  }
  return element.id || 'Section';
}

function getAllSections(): void {
  const sectionList = Array.from(document.querySelectorAll<HTMLElement>(properties.sectionQuery));
  sections.value = sectionList.map(element => {
    const id = getTitleOfSection(element);
    const title = getTitleOfSection(element);
    const top = getTopPositionOfSection(element);
    const height = element.offsetHeight;
    const bottom = top + height;
    return { id, title, element, top, bottom };
  });
}

function recalcPositions(): void {
  sections.value.forEach(section => {
    section.top = getTopPositionOfSection(section.element);
    section.bottom = section.top + section.element.offsetHeight;
  });
}

function findActiveSection(): void {
  const cursor = getScrollY() + getViewportHeight() * properties.activeRatio;
  let best: SectionInfo | null = null;
  let bestDist = Infinity;
  for (const section of sections.value) {
    if (cursor >= section.top && cursor <= section.bottom) {
      best = section;
      break;
    }
    const d = Math.min(Math.abs(cursor - section.top), Math.abs(cursor - section.bottom));
    if (d < bestDist) {
      bestDist = d;
      best = section;
    }
  }
  if (best && best.id !== activeId.value) {
    activeId.value = best.id;
  }
}

function onScroll(): void {
  if (!ticking) {
    ticking = true;
    // eslint-disable-next-line no-undef
    requestAnimationFrame(() => {
      ticking = false;
      findActiveSection();
    });
  }
}

// eslint-disable-next-line no-undef
function onChange(e: Event): void {
  // eslint-disable-next-line no-undef
  const select = e.target as HTMLSelectElement;
  const id = select.value;
  activeId.value = id;
  const section = sections.value.find(x => x.id === id);
  if (!section) return;
  setScrollY(section.top, properties.smooth ? 'smooth' : 'auto');
}

onMounted(async () => {
  scroller.value = window;

  await nextTick();
  getAllSections();
  recalcPositions();
  findActiveSection();

  const target = window; 
  target.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', recalcPositions);
  window.addEventListener('orientationchange', recalcPositions);

  // eslint-disable-next-line no-undef
  resizeObs = new ResizeObserver(() => {
    recalcPositions();
    findActiveSection();
  });
  resizeObs.observe(document.documentElement);

  // eslint-disable-next-line no-undef
  mutObs = new MutationObserver(() => {
    getAllSections();
    recalcPositions();
    findActiveSection();
  });
  mutObs.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['id', 'data-title', 'data-section', 'class', 'style'],
  });
});
</script>
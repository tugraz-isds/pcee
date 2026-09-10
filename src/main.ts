import './style/reset.css'
import './style/stylesheet.css'

import { createApp } from 'vue'
import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import App from './App.vue'

const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

let zoom = 1;

const setZoom = async (nextZoom: number): Promise<void> => {
  if (!isTauri()) return;

  zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
  await getCurrentWebview().setZoom(zoom);
}

const handleZoomShortcut = (event: KeyboardEvent): void => {
  if (!event.metaKey && !event.ctrlKey) return;

  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    void setZoom(zoom + ZOOM_STEP);
  } else if (event.key === '-' || event.key === '_') {
    event.preventDefault();
    void setZoom(zoom - ZOOM_STEP);
  } else if (event.key === '0') {
    event.preventDefault();
    void setZoom(1);
  }
}

const handleZoomWheel = (event: WheelEvent): void => {
  if (!event.metaKey && !event.ctrlKey) return;

  event.preventDefault();
  void setZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
}

document.addEventListener('keydown', handleZoomShortcut);
document.addEventListener('wheel', handleZoomWheel, { passive: false });

const resolveInitialTheme = (): 'light' | 'dark' =>
  window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light';

const initialTheme = resolveInitialTheme();
document.documentElement.dataset.theme = initialTheme;

createApp(App).mount('#app');

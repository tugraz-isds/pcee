import './style/stylesheet.css'
import './style/reset.css'

import { createApp } from 'vue'
import App from './App.vue'

const DARK_MODE_MEDIA_QUERY = '(prefers-color-scheme: dark)'

const resolveInitialTheme = (): 'light' | 'dark' =>
  window.matchMedia(DARK_MODE_MEDIA_QUERY).matches ? 'dark' : 'light'

const initialTheme = resolveInitialTheme()
document.documentElement.dataset.theme = initialTheme

createApp(App).mount('#app')

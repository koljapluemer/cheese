import './main.css'
import { createApp } from 'vue'

import AppShell from './AppShell.vue'
import { router } from './router'

document.documentElement.setAttribute('data-theme', 'light')

createApp(AppShell).use(router).mount('#app')

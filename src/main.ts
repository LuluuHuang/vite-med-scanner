import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
// @ts-ignore
import router from './router'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
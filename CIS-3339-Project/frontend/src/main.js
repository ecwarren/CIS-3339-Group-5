import { createApp, markRaw } from 'vue'
import router from './router'
import App from './App.vue'
import './index.css'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import { createPinia } from 'pinia'
import { useLoggedInUserStore } from './store/loggedInUser'
import { setUnauthorizedHandler } from './api/api'

const app = createApp(App)

// create a pinia root store; give every store access to the router
const pinia = createPinia()
pinia.use(({ store }) => {
  store.$router = markRaw(router)
})
app.use(pinia)

// Toast must be installed before the store uses it
app.use(Toast, { position: 'bottom-right' })

// F4: restore a saved, unexpired login BEFORE the router runs its first guard
const user = useLoggedInUserStore()
user.restoreSession()

// F2: any 401 from the API clears the session and sends the user to /login
setUnauthorizedHandler(() => user.handleUnauthorized())

app.use(router)
app.mount('#app')

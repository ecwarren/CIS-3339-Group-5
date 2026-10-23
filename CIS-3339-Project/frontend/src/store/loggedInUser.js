// This pinia store contains state with respect to whether a user is logged in
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import { loginUser, logoutUser, setAuthHeader } from '../api/api'
import jwt_decode from 'jwt-decode'

const toast = useToast()

// Returns the decoded token if it is well-formed and not expired, otherwise null
function decodeValidToken(token) {
  if (!token) return null
  try {
    const decoded = jwt_decode(token) // throws on a corrupted token
    if (!decoded.exp || decoded.exp * 1000 <= Date.now()) return null
    return decoded
  } catch {
    return null
  }
}

export const useLoggedInUserStore = defineStore({
  id: 'loggedInUser',
  state: () => ({
    name: '',
    role: '',
    isLoggedIn: false
  }),
  getters: {
    // allowlist: only 'editor' can edit (anything else, including typos, cannot)
    isEditor: (state) => state.isLoggedIn && state.role === 'editor'
  },
  actions: {
    async login(username, password) {
      try {
        const token = await loginUser(username, password)
        const decodedToken = jwt_decode(token)
        this.$patch({
          isLoggedIn: true,
          role: decodedToken.role,
          name: decodedToken.name
        })
        // go back to the page the user originally wanted, if any
        const redirect = this.$router.currentRoute.value.query.redirect
        this.$router.push(typeof redirect === 'string' ? redirect : '/')
        toast.success('Login Successful!')
      } catch (error) {
        toast.error(error.message)
      }
    },

    // F4: called once on app startup (main.js)
    restoreSession() {
      const token = localStorage.getItem('authToken')
      const decoded = decodeValidToken(token)
      if (!decoded) {
        this.clearSession() // missing, expired or corrupted -> clean logged-out state
        return
      }
      setAuthHeader(token)
      this.$patch({
        isLoggedIn: true,
        role: decoded.role,
        name: decoded.name
      })
    },

    // clears both the stored token and the Pinia state
    clearSession() {
      logoutUser()
      this.$reset()
    },

    logout() {
      this.clearSession()
      this.$router.push('/login')
      toast.info('You have been logged out!')
    },

    // called by the axios interceptor on a 401
    handleUnauthorized() {
      const wasLoggedIn = this.isLoggedIn
      this.clearSession()
      const current = this.$router.currentRoute.value
      if (current.path !== '/login') {
        this.$router.push({ path: '/login', query: { redirect: current.fullPath } })
      }
      if (wasLoggedIn) toast.info('Your session has expired. Please log in again.')
    }
  }
})
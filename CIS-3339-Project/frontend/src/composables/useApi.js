// F2: shared loading / error / data state for any API call.
// Usage: const { data, loading, error, execute } = useApi(() => getClients())
import { ref } from 'vue'

export function useApi(apiCall) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function execute() {
    loading.value = true
    error.value = null
    try {
      // api.js functions already return response.data
      data.value = await apiCall()
    } catch (e) {
      // the axios interceptor has already turned this into a readable message
      error.value = e?.message || 'Something went wrong'
    } finally {
      loading.value = false
    }
  }

  return { data, loading, error, execute }
}
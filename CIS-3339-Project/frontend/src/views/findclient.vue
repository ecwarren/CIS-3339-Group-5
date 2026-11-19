<!-- This view displays a list of clients. The user can search for clients, and click on a client to redirect to another component to view that client's information -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Find Client
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <!--Search Client By selection-->
        <h2 class="text-2xl font-bold">Search Client By</h2>
        <!-- Displays Client Name search field -->
        <div class="flex flex-col">
          <select
            aria-label="Search by"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Client Name">Client Name</option>
            <option value="Client Number">Client Number</option>
          </select>
        </div>
        <!--Input box for searching by Client First Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="firstName" v-on:keyup.enter="handleSubmitForm" placeholder="Enter first name" />
          </label>
        </div>
        <!--Input box for searching by Client Last Name-->
        <div class="flex flex-col" v-if="searchBy === 'Client Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="lastName" v-on:keyup.enter="handleSubmitForm" placeholder="Enter last name" />
          </label>
        </div>
        <!-- Displays Client Number search field -->
        <div class="flex flex-col" v-if="searchBy === 'Client Number'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="text" v-model="phoneNumber" v-on:keyup.enter="handleSubmitForm"
            placeholder="Enter Client Phone Number" />
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>
        <!--Clear Search button-->
        <div class="mt-5 grid-cols-2">
          <button class="mr-10 border border-red-700 bg-white text-red-700 rounded" @click="loadData" type="submit">
            Clear Search
          </button>
          <!--Search Client button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="submit">
            Search Client
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Clients</h2>
        <h3 class="italic">Click table row to view client details</h3>
      </div>
      <!--Table showing list of Clients-->
      <div class="flex flex-col col-span-2">
        <!-- Loading state -->
        <div v-if="loading" class="p-6 text-center text-xl text-gray-500 animate-pulse">
          Loading clients...
        </div>
        <!-- Error state with retry -->
        <div v-else-if="error" class="p-4 rounded border border-red-300 bg-red-50" role="alert">
          <p class="font-bold text-red-800">Could not load clients</p>
          <p class="text-red-900">{{ error }}</p>
          <button class="mt-3 bg-red-700 text-white rounded" @click="execute()">Retry</button>
        </div>
        <!-- Data (DataTable shows the empty-results row itself) -->
        <DataTable
          v-else
          :columns="columns"
          :rows="rows"
          empty-text="No clients found. Try a different search or click Clear Search."
          @row-click="openDetails"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '../components/DataTable.vue'
import { useApi } from '../composables/useApi'
import { getClients, searchClients } from '../api/api'

const router = useRouter()

// search inputs
const searchBy = ref('')
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')

// null = show all clients, otherwise the last search that was run.
// Retry re-runs whichever one failed.
const activeQuery = ref(null)
const { data, loading, error, execute } = useApi(() =>
  activeQuery.value ? searchClients(activeQuery.value) : getClients()
)
const rows = computed(() => data.value || [])

const columns = [
  { label: 'Name', field: 'lastName', render: (c) => `${c.firstName} ${c.lastName}` },
  { label: 'Phone number', field: 'phoneNumber.primary' },
  { label: 'City', field: 'address.city' }
]

function openDetails(client) {
  router.push({ name: 'clientdetails', params: { id: client._id } })
}

// "Clear Search": reset inputs and show every client
function loadData() {
  searchBy.value = ''
  firstName.value = ''
  lastName.value = ''
  phoneNumber.value = ''
  activeQuery.value = null
  execute()
}

function handleSubmitForm() {
  if (searchBy.value === 'Client Name' && (firstName.value || lastName.value)) {
    activeQuery.value = {
      searchBy: 'name',
      firstName: firstName.value,
      lastName: lastName.value
    }
  } else if (searchBy.value === 'Client Number' && phoneNumber.value) {
    activeQuery.value = { searchBy: 'number', phoneNumber: phoneNumber.value }
  } else {
    return
  }
  execute()
}

onMounted(loadData)
</script>
<!-- This view shows a list of services. Users can search for services and click on a service to be redirected to another component that displays the service's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Find Services
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Service By</h2>
        <!-- Displays Service Name and Description selection -->
        <div class="flex flex-col">
          <select
            aria-label="Search by"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Service Name">Service Name</option>
            <option value="Service Description">Service Description</option>
          </select>
        </div>
        <!--Display service name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name" v-on:keyup.enter="handleSubmitForm" placeholder="Enter service name" />
          </label>
        </div>
        <!--Display service description search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Description'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="description" v-on:keyup.enter="handleSubmitForm" placeholder="Enter service description" />
          </label>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>
        <div class="mt-5 grid-cols-2">
          <!--Clear Search button-->
          <button class="mr-10 border border-red-700 bg-white text-red-700 rounded" @click="loadData" type="submit">
            Clear Search
          </button>
          <!--Search Service button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="submit">
            Search Service
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--List of Services table-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Services</h2>
        <h3 class="italic">Click table row to view service details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <!-- Loading state -->
        <div v-if="loading" class="p-6 text-center text-xl text-gray-500 animate-pulse">
          Loading services...
        </div>
        <!-- Error state with retry -->
        <div v-else-if="error" class="p-4 rounded border border-red-300 bg-red-50" role="alert">
          <p class="font-bold text-red-800">Could not load services</p>
          <p class="text-red-900">{{ error }}</p>
          <button class="mt-3 bg-red-700 text-white rounded" @click="execute()">Retry</button>
        </div>
        <!-- Data (DataTable shows the empty-results row itself) -->
        <DataTable
          v-else
          :columns="columns"
          :rows="rows"
          empty-text="No services found. Try a different search or click Clear Search."
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
import { getServices, searchServices } from '../api/api'

const router = useRouter()

// search inputs
const searchBy = ref('')
const name = ref('')
const description = ref('')

const activeQuery = ref(null)
const { data, loading, error, execute } = useApi(() =>
  activeQuery.value ? searchServices(activeQuery.value) : getServices()
)
const rows = computed(() => data.value || [])

const columns = [
  { label: 'Service Name', field: 'name' },
  { label: 'Service Description', field: 'description' }
]

function openDetails(service) {
  router.push({ name: 'servicedetails', params: { id: service._id } })
}

function loadData() {
  searchBy.value = ''
  name.value = ''
  description.value = ''
  activeQuery.value = null
  execute()
}

function handleSubmitForm() {
  if (searchBy.value === 'Service Name' && name.value) {
    activeQuery.value = { searchBy: 'name', name: name.value }
  } else if (searchBy.value === 'Service Description' && description.value) {
    activeQuery.value = { searchBy: 'description', description: description.value }
  } else {
    return
  }
  execute()
}

onMounted(loadData)
</script>

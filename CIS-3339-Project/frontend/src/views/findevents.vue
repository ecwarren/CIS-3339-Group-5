<!-- This view displays a list of events. Users can search for events, and click on an event to be redirected to another component to view that event's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        List of Events
      </h1>
    </div>
    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Event By</h2>
        <!-- Displays Event Name or Event Date selection -->
        <div class="flex flex-col">
          <select
            aria-label="Search by"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            v-model="searchBy">
            <option value="Event Name">Event Name</option>
            <option value="Event Date">Event Date</option>
          </select>
        </div>
        <!--Displays event name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Event Name'">
          <label class="block">
            <input type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name" v-on:keyup.enter="handleSubmitForm" placeholder="Enter event name" />
          </label>
        </div>
        <!-- Displays event date search field -->
        <div class="flex flex-col" v-if="searchBy === 'Event Date'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="date" v-model="eventDate" v-on:keyup.enter="handleSubmitForm" />
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
          <!--Search Event button-->
          <button class="bg-red-700 text-white rounded" @click="handleSubmitForm" type="submit">
            Search Event
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />
    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--Table showing List of Events-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Events</h2>
        <h3 class="italic">Click table row to view event details</h3>
      </div>
      <div class="flex flex-col col-span-2">
        <!-- Loading state -->
        <div v-if="loading" class="p-6 text-center text-xl text-gray-500 animate-pulse">
          Loading events...
        </div>
        <!-- Error state with retry -->
        <div v-else-if="error" class="p-4 rounded border border-red-300 bg-red-50" role="alert">
          <p class="font-bold text-red-800">Could not load events</p>
          <p class="text-red-900">{{ error }}</p>
          <button class="mt-3 bg-red-700 text-white rounded" @click="execute()">Retry</button>
        </div>
        <!-- Data (DataTable shows the empty-results row itself) -->
        <DataTable
          v-else
          :columns="columns"
          :rows="rows"
          empty-text="No events found. Try a different search or click Clear Search."
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
import { getEvents, searchEvents } from '../api/api'
import { formatDate } from '../utils/format'

const router = useRouter()

// search inputs
const searchBy = ref(null)
const name = ref(null)
const eventDate = ref(null)

const activeQuery = ref(null)
const { data, loading, error, execute } = useApi(() =>
  activeQuery.value ? searchEvents(activeQuery.value) : getEvents()
)
const rows = computed(() => data.value || [])

const columns = [
  { label: 'Event Name', field: 'name' },
  { label: 'Event Date', field: 'date', render: (e) => formatDate(e.date) },
  { label: 'Event Address', field: 'address.line1' }
]

function openDetails(event) {
  router.push({ name: 'eventdetails', params: { id: event._id } })
}

function loadData() {
  searchBy.value = null
  name.value = null
  eventDate.value = null
  activeQuery.value = null
  execute()
}

function handleSubmitForm() {
  if (searchBy.value === 'Event Name' && name.value) {
    activeQuery.value = { searchBy: 'name', name: name.value }
  } else if (searchBy.value === 'Event Date' && eventDate.value) {
    // <input type="date"> already gives YYYY-MM-DD
    activeQuery.value = { searchBy: 'date', eventDate: eventDate.value }
  } else {
    return
  }
  execute()
}

onMounted(loadData)
</script>

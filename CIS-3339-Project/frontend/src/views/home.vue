<!-- This is the home view - which shows a dashboard -->
<template>
  <main>
    <div>
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Dashboard
      </h1>
      <br />

      <!-- ===== Events Attendance ===== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div class="ml-10"></div>
        <div class="flex flex-col col-span-2">
          <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
            Events Attendance
          </h1>

          <!-- Loading -->
          <p v-if="attendance.loading.value" class="mt-10 text-4xl font-bold text-center text-gray-500 animate-pulse">
            Loading...
          </p>
          <!-- Error + retry -->
          <div v-else-if="attendance.error.value" class="mt-10 bg-red-50 rounded" role="alert">
            <h3 class="px-4 py-1 text-2xl font-bold text-white bg-red-800">Could not load attendance</h3>
            <p class="p-4 text-lg font-bold text-red-900">{{ attendance.error.value }}</p>
            <button class="m-4 bg-red-700 text-white rounded" @click="attendance.execute()">Retry</button>
          </div>
          <!-- Empty -->
          <div v-else-if="!recentEvents.length" class="flex justify-center mt-10">No events found.</div>
          <!-- Data -->
          <template v-else>
            <table class="min-w-full shadow-md rounded">
              <thead class="bg-gray-50 text-xl">
                <tr>
                  <th class="p-4 text-left">Event Name</th>
                  <th class="p-4 text-left">Event Date</th>
                  <th class="p-4 text-left">Number of Attendees</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                <tr
                  v-for="event in recentEvents"
                  :key="event._id"
                  class="cursor-pointer"
                  @click="router.push({ name: 'eventdetails', params: { id: event._id } })"
                >
                  <td class="p-2 text-left">{{ event.name }}</td>
                  <td class="p-2 text-left">{{ formatDate(event.date) }}</td>
                  <td class="p-2 text-left">{{ event.attendees.length }}</td>
                </tr>
              </tbody>
            </table>
            <AttendanceChart :label="labels" :chart-data="chartData" />
          </template>
        </div>
      </div>

      <!-- ===== Clients by Zip Code ===== -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div class="ml-10"></div>
        <div class="flex flex-col col-span-2">
          <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
            Clients by Zip Code
          </h1>

          <p v-if="zipData.loading.value" class="mt-10 text-4xl font-bold text-center text-gray-500 animate-pulse">
            Loading...
          </p>
          <div v-else-if="zipData.error.value" class="mt-10 bg-red-50 rounded" role="alert">
            <h3 class="px-4 py-1 text-2xl font-bold text-white bg-red-800">Could not load zip code data</h3>
            <p class="p-4 text-lg font-bold text-red-900">{{ zipData.error.value }}</p>
            <button class="m-4 bg-red-700 text-white rounded" @click="zipData.execute()">Retry</button>
          </div>
          <div v-else-if="!zips.length" class="flex justify-center mt-10">No clients found.</div>
          <template v-else>
            <table class="min-w-full shadow-md rounded">
              <thead class="bg-gray-50 text-xl">
                <tr>
                  <th class="p-4 text-left">Zip Number</th>
                  <th class="p-4 text-left">Client Count</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-300">
                <tr v-for="zip in zips" :key="zip._id">
                  <td class="p-2 text-left">{{ zip._id }}</td>
                  <td class="p-2 text-left">{{ zip.count }}</td>
                </tr>
              </tbody>
            </table>
            <div class="flex justify-center mt-10">
              <ZipChart :label="zipLabels" :chart-data="zipChartData" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AttendanceChart from '../components/barChart.vue'
import ZipChart from '../components/donutZipChart.vue'
import { useApi } from '../composables/useApi'
import { getAttendance, getClientsByZipCode } from '../api/api'
import { formatDate } from '../utils/format'

const router = useRouter()

// two independent requests, each with its own loading / error / data
const attendance = useApi(() => getAttendance())
const zipData = useApi(() => getClientsByZipCode())

const recentEvents = computed(() => attendance.data.value || [])
const labels = computed(() =>
  recentEvents.value.map((item) => `${item.name} (${formatDate(item.date)})`)
)
const chartData = computed(() => recentEvents.value.map((item) => item.attendees.length))

const zips = computed(() => zipData.data.value || [])
const zipLabels = computed(() => zips.value.map((item) => item._id))
const zipChartData = computed(() => zips.value.map((item) => item.count))

onMounted(() => {
  attendance.execute()
  zipData.execute()
})
</script>

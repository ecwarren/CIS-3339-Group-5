<template>
  <div class="w-1/2">
    <canvas class="p-10" ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  label: { type: Array, default: () => [] },
  chartData: { type: Array, default: () => [] }
})

const canvas = ref(null)
let chart = null

onMounted(() => {
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: {
      labels: props.label,
      datasets: [{ borderWidth: 1, data: props.chartData }]
    },
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Clients by Zip Code' }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  })
})

watch(
  () => [props.label, props.chartData],
  ([labels, data]) => {
    if (!chart) return
    chart.data.labels = labels
    chart.data.datasets[0].data = data
    chart.update()
  }
)

onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>
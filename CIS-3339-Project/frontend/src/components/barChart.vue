<template>
  <div>
    <canvas class="p-10" ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Chart, registerables, Colors } from 'chart.js'

Chart.register(...registerables, Colors)

const props = defineProps({
  label: { type: Array, default: () => [] },
  chartData: { type: Array, default: () => [] }
})

const canvas = ref(null)
let chart = null

onMounted(() => {
  chart = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: props.label,
      datasets: [{ borderWidth: 1, data: props.chartData }]
    },
    options: {
      scales: {
        y: { ticks: { stepSize: 1 } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Attendance Chart' }
      },
      responsive: true,
      maintainAspectRatio: true
    }
  })
})

// redraw when the data changes
watch(
  () => [props.label, props.chartData],
  ([labels, data]) => {
    if (!chart) return
    chart.data.labels = labels
    chart.data.datasets[0].data = data
    chart.update()
  }
)

// free the canvas when leaving the page (prevents a memory leak)
onBeforeUnmount(() => {
  chart?.destroy()
  chart = null
})
</script>
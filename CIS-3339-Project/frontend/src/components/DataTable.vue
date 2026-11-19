<!-- F3: one reusable table for the client, event and service lists.
     Props:
       columns: [{ label, field, render?: (row) => string }]
       rows:    array of records
       emptyText (optional): message for the "No results" row
     Emits:
       row-click(row)
     Sorting: click a header -> ascending -> descending -> unsorted.
     Pagination: 10 rows per page, client-side. -->
<template>
  <div>
    <table class="min-w-full shadow-md rounded">
      <thead class="bg-gray-50 text-xl">
        <tr>
          <th
            v-for="col in columns"
            :key="col.field"
            class="p-4 text-left cursor-pointer select-none"
            :aria-sort="ariaSort(col.field)"
            @click="toggleSort(col.field)"
          >
            {{ col.label }}
            <span class="text-sm text-gray-500">{{ sortIcon(col.field) }}</span>
          </th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-300">
        <tr v-if="rows.length === 0">
          <td :colspan="columns.length" class="p-4 text-center text-gray-500 italic">
            {{ emptyText }}
          </td>
        </tr>
        <tr
          v-for="row in pagedRows"
          :key="row._id"
          class="cursor-pointer"
          :class="{ hoverRow: hoverId === row._id }"
          tabindex="0"
          @click="emit('row-click', row)"
          @keyup.enter="emit('row-click', row)"
          @mouseenter="hoverId = row._id"
          @mouseleave="hoverId = null"
        >
          <td v-for="col in columns" :key="col.field" class="p-2 text-left">
            {{ cellValue(row, col) }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <div v-if="rows.length > 0" class="flex items-center justify-between mt-4">
      <span class="text-gray-700">
        Showing {{ startIndex + 1 }}–{{ endIndex }} of {{ rows.length }}
      </span>
      <div class="flex gap-2 items-center">
        <button
          class="border border-red-700 bg-white text-red-700 rounded disabled:opacity-50"
          :disabled="page === 1"
          @click="page--"
        >
          Prev
        </button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button
          class="border border-red-700 bg-white text-red-700 rounded disabled:opacity-50"
          :disabled="page === totalPages"
          @click="page++"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  pageSize: { type: Number, default: 10 },
  emptyText: { type: String, default: 'No results' }
})
const emit = defineEmits(['row-click'])

const hoverId = ref(null)
const page = ref(1)
const sortField = ref(null)
const sortDir = ref(null) // null | 'asc' | 'desc'

// Read nested fields like "address.city"
function getField(row, field) {
  return field.split('.').reduce((obj, key) => (obj == null ? obj : obj[key]), row)
}

function cellValue(row, col) {
  return col.render ? col.render(row) : getField(row, col.field)
}

// Sort by what the user actually sees (rendered value) so names/dates sort sensibly
function sortValue(row, col) {
  const raw = getField(row, col.field)
  if (raw instanceof Date || (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}/.test(raw))) {
    return new Date(raw).getTime()
  }
  const v = col.render ? col.render(row) : raw
  return typeof v === 'string' ? v.toLowerCase() : v
}

function toggleSort(field) {
  if (sortField.value !== field) {
    sortField.value = field
    sortDir.value = 'asc'
  } else if (sortDir.value === 'asc') {
    sortDir.value = 'desc'
  } else {
    sortField.value = null
    sortDir.value = null
  }
  page.value = 1
}

function sortIcon(field) {
  if (sortField.value !== field) return '↕'
  return sortDir.value === 'asc' ? '▲' : '▼'
}

function ariaSort(field) {
  if (sortField.value !== field) return 'none'
  return sortDir.value === 'asc' ? 'ascending' : 'descending'
}

const sortedRows = computed(() => {
  if (!sortField.value) return props.rows
  const col = props.columns.find((c) => c.field === sortField.value)
  const dir = sortDir.value === 'asc' ? 1 : -1
  return [...props.rows].sort((a, b) => {
    const va = sortValue(a, col)
    const vb = sortValue(b, col)
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    return va > vb ? dir : va < vb ? -dir : 0
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(props.rows.length / props.pageSize))
)
const startIndex = computed(() => (page.value - 1) * props.pageSize)
const endIndex = computed(() =>
  Math.min(startIndex.value + props.pageSize, props.rows.length)
)
const pagedRows = computed(() =>
  sortedRows.value.slice(startIndex.value, endIndex.value)
)

// New data (e.g. after a search) always starts back on page 1 -> no stale rows
watch(
  () => props.rows,
  () => {
    page.value = 1
  }
)
</script>
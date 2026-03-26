<template>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th
                    v-for="column in columns"
                    :key="column.key"
                    class="header"
                    >
                    <div class="header-cell">
                    <input
                    v-model="column.label"
                    type="text"
                    placeholder="Column name"
                    class="header-input"
                    :title="column.label"
                    >
                    <button
                    class="header-button"
                    @click="deleteColumn(column.key)"
                    >
                    -
                    </button>
                    </div>
                    </th>
                <th class="narrow-column">
                <button
                  class="add-button"
                  @click="addColumn"
                >
                +
                </button>
                </th>
                </tr>
            </thead>
        <tbody>
        <tr
            v-for="(row, rowIndex) in rows"
            :key="rowIndex"
            >
            <td
                v-for="column in columns"
                :key="column.key"
                :class="{
                    'text-right': column.type === 'number',
                    'text-left': column.type === 'string'
                    }"
                >
                <input
                  v-model="row[column.key]"
                  :type="column.type === 'number' ? 'number' : 'text'"
                  :class="{
                    'text-right': column.type === 'number',
                    'text-left': column.type === 'string'
                  }"
                  @blur="recomputeColumnType(column)"
                >
            </td>
            <td class="narrow-column">
                <!-- Delete Row Button -->
                <button
                  class="delete-button"
                  @click="deleteRow(rowIndex)"
                >
                -
                </button>
            </td>
        </tr>
        <tr>
            <td :colspan="columns.length">
                <button
                  class="table-button"
                  :disabled="!isFormValid"
                  @click="redrawChart"
                >
                  Redraw Chart
                </button>
                <button
                  class="table-button"
                  @click="resetTable">
                  Reset Table
                </button>
            </td>
            <td class="narrow-column">
                <!-- Add Row Button -->
                <button
                  class="add-button"
                  @click="addRow"
                >
                +
                </button>
            </td>
        </tr>
        </tbody>
        </table>
    </div>
</template>


<script setup lang="ts">
import { ref, computed } from 'vue';
import * as spcd3 from '../spcd3.js';
import { resetTable, Column, Row, columns, rows } from '@/helper.js';


const newColumn = ref('');

const addRow = (): void => {
  const newRow: Row = {};
  columns.value.forEach((column) => {
    newRow[column.key] = '';
  });
  rows.value.push(newRow);
};

const deleteRow = (index: number): void => {
  if (index >= 0 && index < rows.value.length) {
    rows.value.splice(index, 1);
  }
};

const isNumericString = (value: unknown): boolean => {
  if (value == null) return false;
  const stringValue = String(value).trim();
  if (!stringValue) return false;
  const normalized = stringValue
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(/,(?=\d{3}\b)/g, '')
    .replace(',', '.');
  return !isNaN(Number(normalized));
};

const detectColumnTypeFromRows = (rows: Record<string, unknown>[], colKey: string): 'string' | 'number'  => {
  const values = rows.map(r => r[colKey]);
  const nonEmpty = values.filter(v => String(v ?? '').trim() !== '');
  if (nonEmpty.length === 0) return 'string';
  const numericCount = nonEmpty.filter(isNumericString).length;
  return numericCount >= Math.ceil((2 * nonEmpty.length) / 3) ? 'number' : 'string';
};

const recomputeColumnType = (col: Column) => {
  col.type = detectColumnTypeFromRows(rows.value, col.key);
};

let colCounter = 0;
const addColumn = (): void => {
  const trimmed = newColumn.value.trim();
  const label = trimmed;
  const newCol: Column = { key: `col_${colCounter++}`, label };
  columns.value.push(newCol);
  rows.value.forEach(row => {
    row[newCol.key] = '';
  });
  newColumn.value = '';
};

const deleteColumn = (key: string): void => {
  const index = columns.value.findIndex(c => c.key === key)
  if (index === -1) return

  columns.value.splice(index, 1)

  for (const row of rows.value) {
    if (row && key in row) {
      delete row[key]
    }
  }
}

const redrawChart = (): void => {
  const headers = columns.value.map(column => column.label).join(',');
  const newRows = rows.value.map(row => {
    return columns.value.map(column => row[column.key]).join(',');
  }).join('\n');

  const csvData = `${headers}\n${newRows}`;
  let newData = spcd3.loadCSV(csvData);
  spcd3.drawChart(newData);
};

const isFormValid = computed<boolean>(() => {
  return rows.value.every(row =>
    columns.value.every(column => {
      const value = row[column.key];
      return value != null && String(value).trim() !== '';
    })
  );
});

</script>

<style>
.table-container {
  position: relative;
  margin-bottom: 1rem;
  margin-inline: 0.5rem;
  padding: 0.5rem;
  background: oklch(0.99 0.011 91.69);
  border: 0.01rem solid black;
  border-radius: 0.3rem;
  overflow-x: auto;
  overflow-y: hidden;
  box-sizing: border-box;
}

table {
  width: max-content;
  min-width: 100%;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 0.8rem;
}

th, td {
  position: relative;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 8rem;
  min-width: 8rem;
  border: 0.15rem solid lightgrey !important;
  padding: 0.25rem !important;
}

td {
  background-color: oklch(0.99 0.011 91.69);;
}

th {
  background-color: rgba(30, 61, 89, 0.8) !important;
  color: rgba(255, 255, 255, 1);
}

.header-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

.header-input {
  flex: 1 1 auto;
  min-width: 4rem;
  padding: 0.25rem 0.5rem;
}

.header-button { 
  flex: 0 0 auto; 
  padding: 0 0.5rem; 
  margin-top: 0rem; 
  margin-right: 0.25rem; 
  background: rgba(255, 255, 255, 1);; 
  color: rgba(0, 0, 0, 1); 
  border: none; 
  border-radius: 75%;
  cursor: pointer;
  width: 1.2rem;
  height: 1.2rem;
  font-size: 0.9em;
}

.text-left {
  text-align: left;
}
.text-right {
  text-align: right;
}

.delete-button,
.add-button {
  position: absolute;
  border: 0.01rem solid rgba(0, 0, 0, 1);
  border-radius: 50%;
  background: rgba(255, 255, 255, 1);
  color: rgba(0, 0, 0, 1);
  font-weight: bold;
  font-size: 0.9em;
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  padding: 0;
  top: 0;
  right: 0.1rem;
  margin-right: 0.5rem;
}

.header-button:hover,
.delete-button:hover,
.add-button:hover {
  background: rgba(173, 216, 230, 1);
}

.table-button {
  margin-right: 0.5rem;
}

.narrow-column {
  width: 2.5rem;
  min-width: max-content;
}

input {
  width: 100%;
}

input[type="number"] {
  padding: 0.2rem !important;
}

input[type="text"] {
  padding: 0.2rem !important;
}

td input:focus {
  outline: 0.1rem solid rgba(211, 211, 211, 1);
  background: rgba(211, 211, 211, 1);
}
</style>
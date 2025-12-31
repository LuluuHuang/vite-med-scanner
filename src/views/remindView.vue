<script setup>
import { ref, watch } from 'vue'

const startDate = ref('')
const endDate = ref('')
const doseCount = ref(1)
const times = ref([''])
const title = ref('')
const checkBtn = ref(false)
const reminder = ref(null)

// 監控次數變化
watch(doseCount, (newCount) => {
  if (times.value.length < newCount) {
    for (let i = times.value.length; i < newCount; i++) {
      times.value.push('')
    }
  } else if (times.value.length > newCount) {
    times.value.splice(newCount)
  }
})

function clickCheck() {
  const validTimes = times.value.filter(t => t)
  if (!startDate.value || !endDate.value || !title.value || validTimes.length === 0) {
    alert('請確實填寫資料')
    return
  }
  checkBtn.value = true
  reminder.value = {
    title: title.value,
    description: '飯後服用',
    startDate: startDate.value,
    endDate: endDate.value,
    times: validTimes.sort(),
    reminderMinutes: 10
  }
  console.log('確認資料', reminder.value)
}
function downloadICS(content) {
  const blob = new Blob([content], {
    type: 'text/calendar;charset=utf-8'
  })

  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = 'medicine-reminder.ics'
  a.click()

  URL.revokeObjectURL(url)
}
// 導入行事曆
function setReminder() {
  if (!reminder.value) return

  const until = reminder.value.endDate.replace(/-/g, '') + 'T235959'

  const events = reminder.value.times.map((time, index) => {
    const dt =
      reminder.value.startDate.replace(/-/g, '') +
      'T' +
      time.replace(':', '') +
      '00'

    return [
      'BEGIN:VEVENT',
      `UID:${Date.now()}-${index}@medicine-reminder`,
      `SUMMARY:服用 ${reminder.value.title}`,
      `DTSTART:${dt}`,
      `DTEND:${dt}`,
      `RRULE:FREQ=DAILY;UNTIL=${until}`,
      'BEGIN:VALARM',
      `TRIGGER:-PT${reminder.value.reminderMinutes}M`,
      'ACTION:DISPLAY',
      'DESCRIPTION:用藥提醒',
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n')
  }).join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Medicine Reminder//EN',
    events,
    'END:VCALENDAR'
  ].join('\r\n')

  downloadICS(ics)
}

</script>
<template>
    <div class="container mx-auto">
        <div class="flex flex-col grid sm:grid-cols-3 sm:mx-0 my-3 m-3 grid-cols-1 gap-4">
            <div>
                <label class="block text-sm font-medium mb-1">提醒標題</label>
                <input type="text" v-model="title" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">開始日期</label>
                <input
                    type="date"
                    v-model="startDate"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
                <label class="block text-sm font-medium mb-1">結束日期</label>
                <input
                    type="date"
                    v-model="endDate"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label class="block text-sm font-medium mb-1">每天用藥次數</label>
                <select
                    v-model.number="doseCount"
                    class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                    <option v-for="n in 5" :key="n" :value="n">{{ n }} 次</option>
                </select>
                <div v-for="i in doseCount">
                    <label class="block text-sm font-medium mb-1">服用時間{{i}}</label>
                    <input
                        type="time"
                        v-model="times[i - 1]"
                        class="w-full rounded-lg border border-gray-300 px-3 py-2"
                    />
                </div>
                <button class="w-full my-2 p-1 text-black rounded-lg border-2 border-sky-700/25 bg-sky-200 shadow-lg active:shadow-sm active:translate-y-0.5 transition-all duration-100" @click="clickCheck">確定</button>
            </div>
        </div>
        <div v-if="checkBtn" class="grid sm:grid-cols-3 grid-cols-1 sm:m-0 m-3">
        <div class="border p-3 rounded-lg border-2 border-gray-300 bg-slate-200/50">
            <p>用藥提醒</p>
            <p>標題：{{title}}</p>
            <p>用藥日期：{{startDate}}到{{endDate}}</p>
            <p>每日用藥時間：</p>
            <ul v-for="i in times">
                <li>{{i}}</li>
            </ul>
            <button class="w-full my-2 p-1 text-black rounded-lg border-2 border-sky-700/25 bg-sky-200 shadow-lg active:shadow-sm active:translate-y-0.5 transition-all duration-100" @click="setReminder">加入行事曆</button>
        </div>
        </div>
        <!-- <div v-if="checkBtn"> -->
    </div>
</template>
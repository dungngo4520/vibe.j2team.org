<script setup lang="ts">
import { computed, ref } from 'vue'

interface MapCity {
  label: string
  timezone: string
  flag: string
  x: number
  y: number
}

const props = defineProps<{
  now: Date
  selectedTimezones: string[]
}>()

const emit = defineEmits<{
  (e: 'toggle-city', city: { label: string; timezone: string; flag: string }): void
}>()

const hoveredCity = ref<MapCity | null>(null)

// City positions on a 1000x500 equirectangular projection
const cities: MapCity[] = [
  { label: 'Hà Nội', timezone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳', x: 753, y: 202 },
  { label: 'Tokyo', timezone: 'Asia/Tokyo', flag: '🇯🇵', x: 852, y: 175 },
  { label: 'Seoul', timezone: 'Asia/Seoul', flag: '🇰🇷', x: 825, y: 178 },
  { label: 'Singapore', timezone: 'Asia/Singapore', flag: '🇸🇬', x: 745, y: 260 },
  { label: 'Bangkok', timezone: 'Asia/Bangkok', flag: '🇹🇭', x: 730, y: 222 },
  { label: 'Bắc Kinh', timezone: 'Asia/Shanghai', flag: '🇨🇳', x: 790, y: 170 },
  { label: 'Mumbai', timezone: 'Asia/Kolkata', flag: '🇮🇳', x: 680, y: 216 },
  { label: 'Dubai', timezone: 'Asia/Dubai', flag: '🇦🇪', x: 640, y: 200 },
  { label: 'Moscow', timezone: 'Europe/Moscow', flag: '🇷🇺', x: 590, y: 125 },
  { label: 'London', timezone: 'Europe/London', flag: '🇬🇧', x: 490, y: 140 },
  { label: 'Paris', timezone: 'Europe/Paris', flag: '🇫🇷', x: 502, y: 152 },
  { label: 'Berlin', timezone: 'Europe/Berlin', flag: '🇩🇪', x: 520, y: 140 },
  { label: 'New York', timezone: 'America/New_York', flag: '🇺🇸', x: 275, y: 170 },
  { label: 'Los Angeles', timezone: 'America/Los_Angeles', flag: '🇺🇸', x: 170, y: 180 },
  { label: 'Sydney', timezone: 'Australia/Sydney', flag: '🇦🇺', x: 880, y: 370 },
  { label: 'São Paulo', timezone: 'America/Sao_Paulo', flag: '🇧🇷', x: 330, y: 340 },
]

function cityTime(tz: string) {
  return props.now.toLocaleString('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function isSelected(tz: string) {
  return props.selectedTimezones.includes(tz)
}

// Timezone vertical strips (UTC-12 to UTC+12, each 1000/25 ≈ 40px wide)
// offset from left: (utcOffset + 12) / 24 * 1000
const timezoneStrips = computed(() => {
  return Array.from({ length: 25 }, (_, i) => {
    const utcOffset = i - 12
    const x = (i / 24) * 1000
    const width = 1000 / 24
    // Determine if it's currently daytime in this offset
    const utcHours = props.now.getUTCHours()
    const localHour = (utcHours + utcOffset + 24) % 24
    const isDaytime = localHour >= 6 && localHour < 18
    return { utcOffset, x, width, isDaytime, localHour }
  })
})

// Simplified continent outlines as SVG paths (equirectangular projection on 1000x500)
const continents = [
  // North America
  'M 100,60 L 140,55 180,60 220,70 260,80 290,100 310,130 295,140 280,155 275,180 260,195 240,210 220,220 200,230 180,215 160,225 140,240 120,230 100,220 80,200 70,180 60,160 70,140 80,120 90,100 Z',
  // South America
  'M 260,260 L 280,270 300,280 320,290 340,310 350,340 340,370 330,390 310,410 290,420 270,410 260,390 250,370 240,340 240,310 245,290 255,270 Z',
  // Europe
  'M 470,80 L 490,75 510,80 530,85 550,90 560,100 555,110 545,120 540,135 530,145 520,155 510,160 500,165 490,158 480,150 470,140 465,125 460,110 465,95 Z',
  // Africa
  'M 470,185 L 490,175 510,180 530,185 550,195 560,210 565,230 560,260 550,290 540,320 530,345 520,360 505,370 490,370 475,360 465,340 460,310 455,280 460,250 465,225 468,200 Z',
  // Asia
  'M 560,65 L 600,55 650,50 700,55 750,60 800,70 840,80 870,100 880,130 870,155 850,170 830,180 800,190 770,195 740,210 720,225 700,220 680,215 660,210 640,200 620,185 600,170 585,155 575,135 565,115 560,95 Z',
  // Australia
  'M 810,300 L 840,290 870,295 900,310 910,335 905,355 890,370 870,380 845,385 825,375 810,360 800,340 800,320 Z',
]
</script>

<template>
  <div class="relative w-full">
    <svg
      viewBox="0 0 1000 500"
      class="w-full h-auto"
    >
      <!-- Background -->
      <rect x="0" y="0" width="1000" height="500" fill="#0F1923" />

      <!-- Timezone strips -->
      <rect
        v-for="strip in timezoneStrips"
        :key="strip.utcOffset"
        :x="strip.x"
        y="0"
        :width="strip.width"
        height="500"
        :fill="strip.isDaytime ? 'rgba(255, 184, 48, 0.04)' : 'rgba(15, 25, 35, 0.3)'"
      />

      <!-- Timezone grid lines -->
      <line
        v-for="strip in timezoneStrips"
        :key="'line' + strip.utcOffset"
        :x1="strip.x"
        y1="0"
        :x2="strip.x"
        y2="500"
        stroke="#253549"
        stroke-width="0.5"
        stroke-dasharray="4 4"
      />

      <!-- UTC labels at top -->
      <text
        v-for="strip in timezoneStrips"
        :key="'label' + strip.utcOffset"
        :x="strip.x + strip.width / 2"
        y="16"
        text-anchor="middle"
        fill="#4A6180"
        font-size="8"
        font-family="var(--font-display)"
      >
        {{ strip.utcOffset >= 0 ? '+' : '' }}{{ strip.utcOffset }}
      </text>

      <!-- Local hour at bottom -->
      <text
        v-for="strip in timezoneStrips"
        :key="'hour' + strip.utcOffset"
        :x="strip.x + strip.width / 2"
        y="492"
        text-anchor="middle"
        :fill="strip.isDaytime ? '#FFB830' : '#4A6180'"
        font-size="8"
        font-family="var(--font-display)"
      >
        {{ String(strip.localHour).padStart(2, '0') }}h
      </text>

      <!-- Continent outlines -->
      <path
        v-for="(path, i) in continents"
        :key="'continent' + i"
        :d="path"
        fill="#1E2F42"
        stroke="#253549"
        stroke-width="1"
      />

      <!-- Equator line -->
      <line x1="0" y1="250" x2="1000" y2="250" stroke="#253549" stroke-width="0.5" stroke-dasharray="8 6" opacity="0.5" />

      <!-- City pins -->
      <g
        v-for="city in cities"
        :key="city.timezone"
        class="city-pin"
        :class="{ 'city-selected': isSelected(city.timezone) }"
        @click="emit('toggle-city', city)"
        @mouseenter="hoveredCity = city"
        @mouseleave="hoveredCity = null"
      >
        <!-- Glow ring for selected -->
        <circle
          v-if="isSelected(city.timezone)"
          :cx="city.x"
          :cy="city.y"
          r="10"
          fill="none"
          stroke="#38BDF8"
          stroke-width="1"
          opacity="0.4"
          class="animate-ping-slow"
        />

        <!-- Pin dot -->
        <circle
          :cx="city.x"
          :cy="city.y"
          :r="isSelected(city.timezone) ? 4 : 3"
          :fill="isSelected(city.timezone) ? '#38BDF8' : '#FF6B4A'"
          class="transition-all duration-200"
        />

        <!-- City label (always visible for selected) -->
        <g v-if="isSelected(city.timezone) || hoveredCity?.timezone === city.timezone">
          <rect
            :x="city.x + 8"
            :y="city.y - 24"
            :width="Math.max(city.label.length * 7 + 50, 90)"
            height="20"
            fill="#162232"
            stroke="#253549"
            stroke-width="0.5"
            rx="0"
          />
          <text
            :x="city.x + 12"
            :y="city.y - 10"
            fill="#F0EDE6"
            font-size="9"
            font-family="var(--font-display)"
            font-weight="700"
          >
            {{ city.flag }} {{ city.label }}
          </text>
          <text
            :x="city.x + 8 + Math.max(city.label.length * 7 + 50, 90) - 4"
            :y="city.y - 10"
            fill="#38BDF8"
            font-size="9"
            font-family="var(--font-display)"
            font-weight="700"
            text-anchor="end"
          >
            {{ cityTime(city.timezone) }}
          </text>
        </g>
      </g>

      <!-- Border frame -->
      <rect x="0" y="0" width="1000" height="500" fill="none" stroke="#253549" stroke-width="1" />
    </svg>
  </div>
</template>

<style scoped>
.city-pin {
  cursor: pointer;
}
.city-pin:hover circle {
  filter: brightness(1.5);
}

@keyframes ping-slow {
  0% { transform-origin: center; opacity: 0.6; r: 10; }
  100% { transform-origin: center; opacity: 0; r: 18; }
}
.animate-ping-slow {
  animation: ping-slow 1.5s ease-out infinite;
}
</style>

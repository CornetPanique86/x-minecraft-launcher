<template>
  <div
    class="w-full h-full overflow-hidden"
    :class="{ 'absoluted': absolute }"
    @click="$emit('click', $event)"
  >
    <v-layout
      align-center
      justify-center
      row
      fill-height
    >
      <div
        v-if="!button"
        class="headline text-center select-none text-button"
        :style="{ 'color': color }"
      >
        <v-icon
          :style="{ 'font-size' : `${size}px`, 'color': color }"
          style="display: block"
        >
          {{ icon }}
        </v-icon>
        {{ text }}
      </div>
      <div
        v-else
        class="headline text-center select-none"
      >
        <v-btn>
          <v-icon
            :style="{ 'font-size' : `${size}px` }"
            style="display: block"
          >
            {{ icon }}
          </v-icon>
          {{ text }}
        </v-btn>
      </div>
    </v-layout>
  </div>
</template>

<script lang=ts setup>

defineProps({
  absolute: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: '',
  },
  text: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    default: 50,
  },
  button: {
    type: Boolean,
    default: false,
  },
  secondary: {
    type: Boolean,
    default: false,
  },
})
</script>

<style scoped>
.absoluted {
  position: absolute;
  left: 0;
  top: 0;
}
</style>

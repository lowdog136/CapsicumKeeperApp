<template>
  <div ref="container" class="virtual-list-container" @scroll="handleScroll">
    <div class="virtual-list-spacer" :style="{ height: spacerHeight + 'px' }"></div>
    <div class="virtual-list-content">
      <slot
        v-for="item in visibleItems"
        :key="getItemKey(item)"
        :item="item"
        :index="item.index"
      ></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

interface Props {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  keyField?: string;
  overscan?: number;
}

const props = withDefaults(defineProps<Props>(), {
  keyField: 'id',
  overscan: 5,
});

const container = ref<HTMLElement>();
const scrollTop = ref(0);

const totalHeight = computed(() => props.items.length * props.itemHeight);
const spacerHeight = computed(() => {
  const startIndex = Math.floor(scrollTop.value / props.itemHeight);
  return startIndex * props.itemHeight;
});

const visibleItems = computed(() => {
  const containerHeight = props.containerHeight;
  const itemHeight = props.itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop.value / itemHeight) - props.overscan);
  const endIndex = Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + containerHeight) / itemHeight) + props.overscan,
  );

  return props.items.slice(startIndex, endIndex).map((item, index) => ({
    ...item,
    index: startIndex + index,
  }));
});

const getItemKey = (item: any) => {
  return item[props.keyField] || item.index;
};

const handleScroll = () => {
  if (container.value) {
    scrollTop.value = container.value.scrollTop;
  }
};

// Установка высоты контейнера
onMounted(() => {
  if (container.value) {
    container.value.style.height = `${props.containerHeight}px`;
    container.value.style.overflowY = 'auto';
  }
});

// Очистка при размонтировании
onUnmounted(() => {
  if (container.value) {
    container.value.removeEventListener('scroll', handleScroll);
  }
});
</script>

<style scoped>
.virtual-list-container {
  position: relative;
  overflow-y: auto;
}

.virtual-list-spacer {
  flex-shrink: 0;
}

.virtual-list-content {
  position: relative;
}
</style>

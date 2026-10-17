<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <AppNavbar />
      <div class="app-content">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent } from 'vue'
import { RouterView } from 'vue-router'

const AppNavbar = defineAsyncComponent(() => import('@/components/AppNavbar.vue'))
const AppSidebar = defineAsyncComponent(() => import('@/components/AppSidebar.vue'))
</script>

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
import { RouterView } from 'vue-router'
import AppNavbar from '@/components/AppNavbar.vue'
import AppSidebar from '@/components/AppSidebar.vue'
</script>

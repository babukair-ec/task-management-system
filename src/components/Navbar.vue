<template>
  <header class="navbar">
    <div class="navbar-container">
      <div class="nav-left">
        <router-link to="/dashboard" class="brand">
          <div class="brand-logo">
            <i class="bi bi-diagram-3-fill"></i>
          </div>
          <span class="brand-name">TaskFlow</span>
        </router-link>

        <nav class="nav-links">
          <router-link to="/dashboard" class="nav-link" active-class="active">
            <i class="bi bi-grid-1x2"></i> {{ $t('navbar.dashboard') }}
          </router-link>
          <router-link to="/tasks" class="nav-link" active-class="active">
            <i class="bi bi-list-task"></i> {{ $t('navbar.myTasks') }}
          </router-link>
          <router-link to="/tasks/available" class="nav-link" active-class="active">
            <i class="bi bi-unlock"></i> {{ $t('navbar.availableTasks') }}
          </router-link>
          <router-link to="/task-requests" class="nav-link" active-class="active">
            <i class="bi bi-inbox"></i> {{ $t('navbar.requests') }}
          </router-link>
          <router-link to="/employees" class="nav-link" active-class="active">
            <i class="bi bi-people"></i> {{ $t('navbar.directory') }}
          </router-link>
        </nav>
      </div>

      <div class="nav-right">
        <!-- Language Switcher Button -->
        <button class="lang-toggle-btn" @click="toggleLocale" :title="locale === 'ar' ? 'Switch to English' : 'التحويل للعربية'">
          <i class="bi bi-translate"></i>
          <span class="lang-text">{{ locale === 'ar' ? 'English' : 'العربية' }}</span>
        </button>

        <div v-if="currentEmployee" class="user-profile-badge">
          <div class="user-avatar">{{ getInitials(currentEmployee.full_name) }}</div>
          <div class="user-details">
            <span class="user-name">{{ currentEmployee.full_name }}</span>
            <span class="user-role">{{ currentEmployee.department }}</span>
          </div>
          <button class="logout-btn" :title="$t('navbar.signOut')" @click="logout">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from '../stores/auth';
import { useI18n } from '../i18n';

const { currentEmployee, logout } = useAuth();
const { locale, toggleLocale } = useI18n();

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
</script>

<style scoped>
.navbar {
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.navbar-container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 0.75rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}
.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  box-shadow: 0 2px 6px var(--primary-glow);
}
.brand-name {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--dark);
  letter-spacing: -0.02em;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-muted);
  transition: all var(--transition-fast);
}
.nav-link:hover {
  color: var(--primary);
  background: var(--bg-subtle);
}
.nav-link.active {
  color: var(--primary);
  background: var(--primary-light);
  font-weight: 600;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.lang-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}
.lang-toggle-btn:hover {
  background: var(--primary-light);
  color: var(--primary);
  border-color: var(--primary);
}
.lang-toggle-btn i {
  font-size: 0.95rem;
  color: var(--primary);
}
.user-profile-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.5rem 0.35rem 0.35rem;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--dark-surface);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  padding-right: 0.25rem;
}
.user-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--dark);
}
.user-role {
  font-size: 0.7rem;
  color: var(--text-muted);
}
.logout-btn {
  background: none;
  border: none;
  color: var(--text-subtle);
  cursor: pointer;
  padding: 0.3rem;
  display: flex;
  border-radius: var(--radius-full);
  transition: color var(--transition-fast);
}
.logout-btn:hover {
  color: var(--danger);
}

@media (max-width: 900px) {
  .nav-links {
    display: none;
  }
}
</style>

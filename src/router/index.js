import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    redirect: '/dashboard',
    component: () => import('@/views/AppLayout.vue'),
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/ProfileView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Auth guard
router.beforeEach((to) => {
  const auth = useAuthStore()

  // 1. If token is present but expired, immediately terminate session and relocate to login
  if (auth.token && auth.isExpired()) {
    auth.handleSessionExpired()
    return {
      name: 'Login',
      query: {
        redirect: to.fullPath !== '/login' ? to.fullPath : undefined,
        expired: 'true',
      },
    }
  }

  // 2. Non-public routes require active valid authentication
  if (!to.meta.public && !auth.isAuthenticated) {
    return {
      name: 'Login',
      query: {
        redirect: to.fullPath !== '/login' ? to.fullPath : undefined,
        ...(to.query.expired ? { expired: 'true' } : {}),
      },
    }
  }

  // 3. Prevent logged-in user with valid session from returning to Login or Register
  if ((to.name === 'Login' || to.name === 'Register') && auth.isAuthenticated) {
    return auth.hasEmployeeProfile ? { name: 'Dashboard' } : { name: 'Profile' }
  }

  // 4. Lock user to Profile page until employee profile exists
  if (!to.meta.public && auth.isAuthenticated && !auth.hasEmployeeProfile && to.name !== 'Profile') {
    return { name: 'Profile' }
  }
})

export default router

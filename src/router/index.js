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
        path: 'tasks',
        name: 'Tasks',
        component: () => import('@/views/TasksView.vue'),
      },
      {
        path: 'tasks/create',
        name: 'TaskCreate',
        component: () => import('@/views/TaskCreateView.vue'),
      },
      {
        path: 'tasks/available',
        name: 'AvailableTasks',
        component: () => import('@/views/AvailableTasksView.vue'),
      },
      {
        path: 'tasks/:id',
        name: 'TaskDetail',
        component: () => import('@/views/TaskDetailView.vue'),
        props: true,
      },
      {
        path: 'task-requests',
        name: 'TaskRequests',
        component: () => import('@/views/TaskRequestsView.vue'),
      },
      {
        path: 'problems/:id',
        name: 'ProblemDetail',
        component: () => import('@/views/ProblemDetailView.vue'),
        props: true,
      },
      {
        path: 'employees',
        name: 'Employees',
        component: () => import('@/views/EmployeesView.vue'),
      },
      {
        path: 'statistics',
        name: 'Statistics',
        component: () => import('@/views/StatisticsView.vue'),
      },
      {
        path: 'reports',
        redirect: { name: 'Statistics' },
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
  if (!to.meta.public && !auth.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'Login' && auth.isAuthenticated) {
    return { name: 'Dashboard' }
  }
})

export default router

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
        path: 'testing-queue',
        name: 'TestingQueue',
        component: () => import('@/views/TestingQueueView.vue'),
      },
      {
        path: 'supervision',
        name: 'Supervision',
        component: () => import('@/views/SupervisionView.vue'),
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
        path: 'employees/create',
        name: 'EmployeeCreate',
        component: () => import('@/views/EmployeeCreateView.vue'),
      },
      {
        path: 'departments',
        name: 'Departments',
        component: () => import('@/views/DepartmentsView.vue'),
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/ProjectsView.vue'),
      },
      {
        path: 'departments-projects',
        redirect: '/departments',
      },
      {
        path: 'departments-projects/assign',
        name: 'DepartmentAssign',
        component: () => import('@/views/DepartmentAssignView.vue'),
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
    return { name: 'Dashboard' }
  }
})

export default router

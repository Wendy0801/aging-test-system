import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Dashboard from '../components/Dashboard.vue'
import MyTasks from '../components/MyTasks.vue'
import History from '../components/History.vue'
import AdminPanel from '../components/AdminPanel.vue'
import Container from '../components/Container.vue'
import Overview from '../components/Overview.vue'
import Information from '../components/Information.vue'
import Publicdashboard from '../components/Publicdashboard.vue'
import PublicHistory from '../components/PublicHistory.vue'

const routes = [
  { path: '/login', component: Login },
  // { path: '/', redirect: '/container' },
  { path: '/', redirect: '/public' },
  { path: '/public', component: Publicdashboard },
  { path: '/history', component: PublicHistory },
  { path: '/container', component: Container, meta: { requiresAuth: true } },
  { path: '/overview', component: Overview, meta: { requiresAuth: true } },
  { path: '/information', component: Information, meta: { requiresAuth: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/my-tasks', component: MyTasks, meta: { requiresAuth: true } },
  // { path: '/history', component: History, meta: { requiresAuth: true } },
  { path: '/admin', component: AdminPanel, meta: { requiresAuth: true, requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('user')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresAdmin) {
    const user = JSON.parse(token || '{}')
    if (user.role !== 'admin') {
      next('/container') // Redirect non-admin users to the container page
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
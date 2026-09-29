import { createRouter, createWebHistory } from 'vue-router'
import LoginInterface from '../views/LoginInterface.vue'
import KeyComponentLibrary from '../views/KeyComponentLibrary.vue'
import MaterialSelectionLibrary from '../views/MaterialSelectionLibrary.vue'
import UserManagement from '../views/UserManagement.vue'
import RolePermissions from '../views/RolePermissions.vue'
import FieldPermissions from '../views/FieldPermissions.vue'


const routes = [
  {
    path: '/',
    redirect: '/LoginInterface',
  },
  {
    path: '/LoginInterface',
    name: 'LoginInterface',
    component: LoginInterface,
  },
  {
    path: '/KeyComponentLibrary',
    name: 'KeyComponentLibrary',
    component: KeyComponentLibrary,
  },
  {
    path: '/MaterialSelectionLibrary',
    name: 'MaterialSelectionLibrary',
    component: MaterialSelectionLibrary,
  },
  {
	path: '/UserManagement',
	name: 'UserManagement',
	component: UserManagement,
  },
  {
  	path: '/RolePermissions',
  	name: 'RolePermissions',
  	component: RolePermissions,
  },
  {
  	path: '/FieldPermissions',
  	name: 'FieldPermissions',
  	component: FieldPermissions,
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

function getUserRole() {
  try {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
    return String(userInfo?.role || '').trim()
  } catch {
    return ''
  }
}

router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  let role = ''
  try {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}')
    role = String(userInfo?.role || '').trim()
  } catch {
    role = ''
  }
  const isAdmin = role === '管理员'

  const publicRoutes = ['/LoginInterface']
  const adminRoutes  = ['/UserManagement', '/RolePermissions', '/FieldPermissions']
  const userRoutes   = ['/MaterialSelectionLibrary', '/KeyComponentLibrary']
  const protectedRoutes = [...adminRoutes, ...userRoutes]

  // 未登入 → 訪問保護頁面 → 回登入頁
  if (!isLoggedIn && protectedRoutes.includes(to.path)) {
    return next('/LoginInterface')
  }

  // ───────────── 登入後重定向的核心邏輯 ─────────────
  if (isLoggedIn) {

    // 情況1：還在登入頁 → 根據角色跳對應首頁
    if (to.path === '/LoginInterface') {
      return next(isAdmin ? '/UserManagement' : '/MaterialSelectionLibrary')
    }

    // 情況2：訪問根路徑（或自訂的 /home、/redirect-after-login）
    if (to.path === '/' || to.path === '/home' || to.path === '/redirect-after-login') {
      return next(isAdmin ? '/UserManagement' : '/MaterialSelectionLibrary')
    }

    // （可選）加強權限控制：普通用戶不能進後台頁面
    if (!isAdmin && adminRoutes.includes(to.path)) {
      return next('/MaterialSelectionLibrary')   // 或 '/403' 如果你有403頁
    }

    // （可選）管理員不能進業務頁面
    if (isAdmin && userRoutes.includes(to.path)) {
      return next('/UserManagement')
    }
  }

  next()
})
export default router

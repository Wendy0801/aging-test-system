
import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Record from '../views/Record.vue';
import Serialport from '../views/Serialport.vue';
import AutomatedTestTool from '../views/AutomatedTestTool.vue';
import AutomatedWritingTool from '../views/AutomatedWritingTool.vue';
import ElectronicTagManagement from '../views/ElectronicTagManagement.vue';

// 定义路由表
const routes = [
  {
    path: '/',
    redirect: '/login', // 根路径重定向到登录页
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: true, permissions: ['1'] }, // 仅权限 1 可访问
  },
  {
    path: '/record',
    name: 'Record',
    component: Record,
    meta: { requiresAuth: true, permissions: ['1'] }, // 仅权限 1 可访问
  },
  {
    path: '/Serialport',
    name: 'Serialport',
    component: Serialport,
    meta: { requiresAuth: true, permissions: ['1'] }, // 仅权限 1 可访问
  },
  {
    path: '/AutomatedTestTool',
    name: 'AutomatedTestTool',
    component: AutomatedTestTool,
    meta: { requiresAuth: true, permissions: ['1'] }, // 仅权限 1 可访问
  },
  {
    path: '/AutomatedWritingTool',
    name: 'AutomatedWritingTool',
    component: AutomatedWritingTool,
    meta: { requiresAuth: true, permissions: ['1', '2'] }, // 权限 1 和 2 可访问
  },
  {
    path: '/ElectronicTagManagement',
    name: 'ElectronicTagManagement',
    component: ElectronicTagManagement,
    meta: { requiresAuth: true, permissions: ['3'] }, // 仅权限 3 可访问
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/', // 通配符路由重定向到根路径
  },
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

// 全局前置路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const permission = localStorage.getItem('permission') || '2';

  // 如果目标路由需要认证且用户未登录，重定向到登录页面
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login');
  }
  // 如果用户已登录但尝试访问登录页面，重定向到允许的页面
  else if (isLoggedIn && to.path === '/login') {
    next(permission === '1' ? '/home' : '/AutomatedWritingTool'); // 权限 1 跳首页，权限 2 跳自动编写工具
  }
  // 检查权限等级
  else if (to.meta.requiresAuth && to.meta.permissions && !to.meta.permissions.includes(permission)) {
    next('/login'); // 无权限时重定向到登录页面
  }
  // 其他情况正常放行
  else {
    next();
  }
});

export default router;


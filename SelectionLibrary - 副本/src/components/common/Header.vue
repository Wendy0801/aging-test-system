<template>
  <el-header height="7vh" style="background-color: #409eff; display: flex; align-items: center; padding: 0 4vh;">
    <!-- Logo -->
    <div class="brandLogo">
      <img src="/src/assets/seesheenLogo.png" style="width: 7vw; height: 2vh;" />
    </div>
    <!-- 导航栏 -->
    <el-menu
      :default-active="activeMenu"
      class="el-menu-demo"
      mode="horizontal"
      background-color="transparent"
      text-color="#fff"
      active-text-color="#ffd04b"
      style="margin-left: 6vh; flex-grow: 1;"
      @select="handleMenuSelect"
    >
      <el-menu-item
        v-for="item in filteredMenuItems"
        :key="item.index"
        :index="item.index"
        style="width: 10vw; height: 6; font-size: 1.18rem;"
      >
        {{ item.name }}
      </el-menu-item>
    </el-menu>
    <!-- 用户信息和退出登录 -->
    <div class="user-info" v-if="isLoggedIn">
      <img src="/src/assets/mine.png" style="width: 1.55rem;height: 1.6rem;margin-right: 0.5rem;" />
      <span style="color: #fff; font-size: 1.1rem; margin-right: 0.5rem;">{{ userName }}✨</span>
      <el-button type="text" @click="handleLogout" style="color: #fff; font-size: 1rem;">退出登录</el-button>
    </div>
  </el-header>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: "Header",
  setup() {
    const router = useRouter()
    const route = useRoute()

    const isLoggedIn = computed(() => localStorage.getItem('isLoggedIn') === 'true')

    const userInfo = computed(() => {
      route.path // 依赖路由变化，强制刷新
      try {
        return JSON.parse(localStorage.getItem('user_info') || '{}')
      } catch {
        return {}
      }
    })

    const userName = computed(() => userInfo.value?.name || '用户')

    // 统一做 trim，防止空格导致判断失败
    const role = computed(() => String(userInfo.value?.role || '').trim())

    const isAdmin = computed(() => role.value === '管理员')

    const menuItems = [
      { index: '/MaterialSelectionLibrary', name: '物料选型库', userOnly: true },
      { index: '/KeyComponentLibrary',     name: '关键元器件清单库', userOnly: true },
      { index: '/UserManagement',          name: '后台管理',         adminOnly: true },
      // 如果你后面会加 RolePermissions、FieldPermissions 的菜单项，也可以加在这里
      // { index: '/RolePermissions',      name: '角色权限管理',     adminOnly: true },
      // { index: '/FieldPermissions',     name: '字段权限管理',     adminOnly: true },
    ]

    const filteredMenuItems = computed(() => {
      return menuItems.filter(item => {
        if (isAdmin.value) {
          // 管理员只看 adminOnly 的菜单
          return item.adminOnly === true
        } else {
          // 普通用户只看 userOnly 的菜单
          return item.userOnly === true
        }
      })
    })

    const handleMenuSelect = (index) => router.push(index)

    const handleLogout = () => {
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('user_info')
      localStorage.removeItem('user_name')
      localStorage.removeItem('role')
      localStorage.removeItem('account')
      localStorage.removeItem('permissions')
      router.push('/LoginInterface')
    }

    const adminGroupRoutes = ['/UserManagement', '/RolePermissions', '/FieldPermissions']

    const activeMenu = computed(() => {
      if (adminGroupRoutes.includes(route.path)) return '/UserManagement'
      return route.path
    })

    return {
      activeMenu,
      isLoggedIn,
      userName,
      filteredMenuItems,
      handleMenuSelect,
      handleLogout,
    }
  },
}
</script>

<style scoped>
/* 样式保持不变 */
.el-menu-demo {
  font-size: 1.04vw;
  width: 100%;
  height: 7.2vh;
}

.el-menu-item {
  font-size: 0.9vw !important;
}

.brandLogo img {
  width: 7vw;
  height: auto;
  max-height: 5vh;
}

.user-info {
  display: flex;
  justify-content: space-evenly;
  flex-wrap: nowrap;
  align-items: center;
  width: 16vw;
}

.user-info img {
  width: 1.55vw;
  height: auto;
}

.user-info span {
  font-size: 1.1vw;
}

.user-info .el-button {
  font-size: 1vw;
}
</style>

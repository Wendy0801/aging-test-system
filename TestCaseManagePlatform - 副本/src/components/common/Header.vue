
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
    <div class="user-info" v-if="isLoggedIn">	  <img src="/src/assets/mine.png" style="width: 1.55rem;height: 1.6rem;margin-right: 0.5rem;" />      <span style="color: #fff; font-size: 1.1rem; margin-right: 1rem;">{{ userName }}✨</span>      <el-button type="text" @click="handleLogout" style="color: #fff; font-size: 1rem;">退出登录</el-button>    </div>
  </el-header>
</template>

<script>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: "Header",
  setup() {
    const router = useRouter();
    const route = useRoute();

    // 计算属性：检查是否登录
    const isLoggedIn = computed(() => localStorage.getItem('isLoggedIn') === 'true');

    // 计算属性：获取用户名
    const userName = computed(() => localStorage.getItem('user_name') || '用户');

    // 计算属性：获取权限等级
    const permission = computed(() => localStorage.getItem('permission') || '2');

    // 菜单配置
    const menuItems = [
      { index: '/home', name: '测试用例库', permissions: ['1'] },
      { index: '/record', name: '导出用例记录', permissions: ['1'] },
      { index: '/AutomatedTestTool', name: '串口测试工具', permissions: ['1'] },
      { index: '/AutomatedWritingTool', name: '自动写入电子标签工具', permissions: ['1', '2'] },
	  { index: '/ElectronicTagManagement', name: '电子标签管理', permissions: ['3'] },
    ];

    // 根据权限等级过滤菜单项
    const filteredMenuItems = computed(() => {
      return menuItems.filter(item => item.permissions.includes(permission.value));
    });

    // 处理菜单选择
    const handleMenuSelect = (index) => {
      router.push(index); // 跳转到对应的路由
    };

    // 退出登录
    const handleLogout = () => {
      // 清除 localStorage
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user_name');
      localStorage.removeItem('permission');
      // 跳转到登录页面
      router.push('/login');
    };

    return {
      activeMenu: computed(() => route.path), // 动态绑定当前路由
      isLoggedIn,
      userName,
      filteredMenuItems,
      handleMenuSelect,
      handleLogout,
    };
  },
};
</script>

<style scoped>
.el-menu-demo {
  font-size: 1.04vw;      /* 20px ≈ 1.04vw */
  width: 100%;
  height: 7.2vh;
}

.el-menu-item {
  font-size: 0.9vw !important;  /* 保持菜单文字大小一致 */
}

.brandLogo img {
  width: 7vw;
  height: auto;
  max-height: 5vh;
}

.user-info{
	display: flex;
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


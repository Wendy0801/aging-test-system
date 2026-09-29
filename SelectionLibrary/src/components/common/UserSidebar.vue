<template>
  <div class="user-sidebar">
    <el-scrollbar height="93vh">
      <el-menu
        class="el-menu-vertical-demo"
        :default-active="activeMenu"
        background-color="#f4f6fb"
        text-color="#303133"
        active-text-color="#409eff"
        @select="handleSelect"
      >
        <!-- 一级目录 -->
        <el-sub-menu index="user-management">
          <template #title>
            <img class="dir-icon" src="/src/assets/management.png" />
            <span class="menu-title">用户管理</span>
          </template>

          <!-- 二级菜单项（添加图标） -->
          <el-menu-item index="/UserManagement">
            <img class="menu-item-icon" src="/src/assets/userlist.png" />
            <span>用户列表</span>
          </el-menu-item>
          
          <el-menu-item index="/RolePermissions">
            <img class="menu-item-icon" src="/src/assets/permission.png" />
            <span>操作权限</span>
          </el-menu-item>
          
          <el-menu-item index="/FieldPermissions">
            <img class="menu-item-icon" src="/src/assets/permission.png" />
            <span>字段权限</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const route = useRoute()

// 当前激活菜单
const activeMenu = computed(() => route.path)

const handleSelect = (index) => {
  router.push(index)
}
</script>

<style scoped>
.user-sidebar {
  width: 300px;
  background-color: #f4f5f4;
  padding: 5px;
  border-right: 1px solid #e0e0e0;
  height: calc(100vh - 7vh); /* Header 高度约 7vh */
}

.el-menu-vertical-demo {
  border-right: none;
}

.menu-title {
  font-weight: 600;
  font-size: 0.98rem;
  color: #3f4044;
}

.dir-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
  margin-right: 8px;
}

/* 新增二级菜单图标样式 */
.menu-item-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  margin-right: 8px;        /* 图标和文字之间的间距 */
  flex-shrink: 0;
}

/* 可选：让图标和文字垂直居中对齐更好看 */
.el-menu-item {
  display: flex;
  align-items: center;
}
</style>

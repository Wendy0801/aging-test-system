<template>
  <div class="common-layout">
     <!-- <el-container v-if="isLoggedIn"></el-container> -->
    <el-container>
      <el-header>
        <el-menu mode="horizontal" router>
            <el-menu-item index="/dashboard">总览</el-menu-item>
            <el-menu-item index="/my-tasks">箱子1</el-menu-item>
            <el-menu-item index="/my-tasks">箱子2</el-menu-item>
            <el-menu-item index="/my-tasks">箱子3</el-menu-item>
            <el-menu-item index="/history">历史记录</el-menu-item>
            <el-menu-item index="/history">历史记录</el-menu-item>
            <el-menu-item index="/admin" v-if="isAdmin">管理任务</el-menu-item>
            <div style="flex-grow: 1"></div>
            <el-sub-menu index="user">
                <template #title>{{ username }}</template>
                <el-menu-item @click="logout">退出登录</el-menu-item>
            </el-sub-menu>
        </el-menu>
    </el-header>
      <el-container>
        <el-aside width="200px">
          <information />
        </el-aside>
        <el-main> 
            <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import Information from './Information.vue'
export default {
  name: 'Container'
}
</script>



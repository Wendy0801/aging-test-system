<template>
    <!-- <el-container v-if="isLoggedIn"></el-container> -->
    <el-container>
        <el-header>
        <el-menu mode="horizontal" router>
          <el-menu-item index="/dashboard">测试箱状态</el-menu-item>
          <el-menu-item index="/my-tasks">我的任务</el-menu-item>
          <el-menu-item index="/history">历史记录</el-menu-item>
          <el-menu-item index="/admin" v-if="isAdmin">管理任务</el-menu-item>
          <div style="flex-grow: 1"></div>
          <el-sub-menu index="user">
            <template #title>{{ username }}</template>
            <el-menu-item @click="logout">退出登录</el-menu-item>
          </el-sub-menu>
        </el-menu>
    </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
</template>

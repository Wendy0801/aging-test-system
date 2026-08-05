<!-- <template> -->
<!-- <el-container v-if="isLoggedIn"></el-container> -->

<!-- <el-header>
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
      </el-header> -->
<!-- <router-view v-else /> -->
<!-- </template> -->

<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <div>
          <span type="primary" @click="$router.push('/public')">老化测试箱总览</span>
          <span type="primary" @click="$router.push('/history')">历史测试记录</span>
        </div>
        <span class="login-button" @click="$router.push('/login')"> 登录 </span>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>


<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

export default {
  setup() {
    const router = useRouter()
    const isLoggedIn = ref(false)
    const username = ref('')
    const isAdmin = ref(false)




    const checkAuth = () => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        isLoggedIn.value = true
        username.value = user.username
        isAdmin.value = user.role === 'admin'
        axios.defaults.headers.common['Authorization'] = `Bearer ${user.id}`
      } else {
        isLoggedIn.value = false
      }
    }

    const logout = async () => {
      await axios.post('/api/logout')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      // router.push('/login')
      useRouter().push('/login')
    }

    onMounted(() => {
      checkAuth()
    })

    return { isLoggedIn, username, isAdmin, logout }
  }
}
</script>

<style>
* {
  padding: 0;
  margin: 0;
}

.el-header {
  background-color: #409EFF;
  color: white;
  padding: 0;
}

.el-menu--horizontal {
  border-bottom: none;
}

.common-layout .el-header {
  display: inline-flex;
  justify-content: space-between;
}

.common-layout .el-header span {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  padding: 0 20px;
}

.common-layout .el-header .login-button {
  width: 80px;
  padding: 0;
}
</style>
<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <!-- <h2>老化测试箱管理系统</h2> -->
        <h2>管理系统</h2>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" @submit.prevent="handleLogin">
            <el-form-item label="用户名">
              <el-input v-model="loginForm.username" />
            </el-form-item>
            <el-form-item label="密码">
              <el-input type="password" placeholder="请输入密码" show-password v-model="loginForm.password" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin">登录</el-button>
              <el-button @click="activeTab = 'register'">注册账号</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" @submit.prevent="handleRegister">
            <el-form-item label="用户名" class="reset-w">
              <el-input v-model="registerForm.username" />
            </el-form-item>
            <el-form-item label="密码"  class="reset-w">
              <el-input type="password" v-model="registerForm.password" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleRegister">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'

export default {
  setup() {
    const router = useRouter()
    const activeTab = ref('login')
    const loginForm = ref({ username: '', password: '' })
    const registerForm = ref({ username: '', password: '' })

    const handleLogin = async () => {
      try {
        const res = await axios.post('/api/login', loginForm.value)
        localStorage.setItem('user', JSON.stringify(res.data))
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.id}`
        ElMessage.success('登录成功')
        router.push('/container')
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '登录失败')
      }
    }

    const handleRegister = async () => {
      try {
        await axios.post('/api/register', registerForm.value)
        ElMessage.success('注册成功，请登录')
        activeTab.value = 'login'
        loginForm.value = { username: registerForm.value.username, password: '' }
      } catch (error) {
        ElMessage.error(error.response?.data?.error || '注册失败')
      }
    }

    return { activeTab, loginForm, registerForm, handleLogin, handleRegister }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* background-color: #f0f2f5; */
}
.login-card {
  width: 400px;
  border-radius:8px;
}

.login-card ::v-deep .el-form-item__label{
  display: inline-block;
  padding-right: 20px;
  width: 80px;
  text-align: justify ;
  text-align-last: justify;   
}


</style>

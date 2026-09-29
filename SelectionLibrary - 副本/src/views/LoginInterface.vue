<template>
  <div class="login-page">
    <div class="background"></div>

    <div class="login-container">
      <el-card class="login-card" shadow="hover">
        <h2 class="login-title">视新选型库与关键元器件</h2>
		<h2 class="login-title1">标准化平台</h2>
        <el-form :model="loginForm" ref="loginFormRef" label-width="0" @submit.prevent>
          <el-form-item>
            <el-input v-model="loginForm.account" placeholder="请输入用户名" clearable>
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-input
              v-model="loginForm.password"
              placeholder="请输入密码"
              show-password
              clearable
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" block class="loginDiv" :loading="loading" @click="handleLogin">
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import api from '../api' // 你的 api/index.js 默认导出

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  account: '',
  password: '',
})

const handleLogin = async () => {
  if (!loginForm.account || !loginForm.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    const res = await api.auth.login(loginForm.account, loginForm.password)
    const payload = res?.data

    if (payload?.code !== 200) {
      ElMessage.error(payload?.msg || '登录失败')
      return
    }

    const userInfo = payload?.data?.user_info
    if (!userInfo) {
      ElMessage.error('登录成功但未返回用户信息')
      return
    }

    // ✅ 统一把“登录态 + 用户信息”存起来，其他页面直接取
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('user_info', JSON.stringify(userInfo))
    localStorage.setItem('user_name', userInfo.name || '') 
    localStorage.setItem('role', userInfo.role || '')
    localStorage.setItem('account', userInfo.account || '')
    localStorage.setItem('permissions', userInfo.permissions || '') // 返回的是字符串形式

    ElMessage.success(payload?.msg || '登录成功')
	console.log(localStorage.getItem('user_info'))


    // ✅ 登录后默认跳到物料选型库（你也可以改成别的）
    router.push('/redirect-after-login') 
  } catch (e) {
    ElMessage.error(e?.response?.data?.msg || e?.message || '登录请求失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 你原来的样式保持不变 */
.login-page {
  position: relative;
  width: 99.2vw;
  height: 98.4vh;
  overflow: hidden;
}
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('../assets/Login.jpg');
  background-size: cover;
  background-position: center;
  z-index: -1;
}
.login-container {
  position: absolute;
  top: 50%;
  right: 15%;
  transform: translateY(-50%);
  width: 300px;
}
.login-card {
  width: 17vw;
  height: 35vh;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: float 3s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
.login-title {
  text-align: center;
  margin-top: 2vh;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
.login-title1 {
  text-align: center;
  margin-bottom: 4vh;
  font-size: 20px;
  font-weight: bold;
  color: #333;
}
::v-deep(.el-input__inner) {
  font-size: 14px;
  height: 36px;
  padding: 10px 10px;
}
::v-deep(.el-input__inner::placeholder) {
  font-size: 14px;
  color: #aaa;
}
::v-deep(.el-input__suffix) {
  font-size: 14px;
}
.loginDiv {
  width: 4vw;
  height: 3.5vh;
  margin-top: 2vh;
  font-size: 18px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.loginDiv:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
::v-deep .el-form-item__content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 14vw;
  height: 4vh;
}
</style>

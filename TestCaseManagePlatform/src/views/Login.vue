<template>
  <div class="login-page">
    <!-- 背景图 -->
    <div class="background"></div>

    <!-- 登录窗口 -->
    <div class="login-container">
      <el-card class="login-card" shadow="hover">
        <h2 class="login-title">视新软件管理平台</h2>

        <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-width="0">
          <!-- 用户名输入框 -->
          <el-form-item prop="user_name">
            <el-input v-model="loginForm.user_name" placeholder="请输入用户名" clearable>
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 密码输入框 -->
          <el-form-item prop="user_password">
            <el-input v-model="loginForm.user_password" @keyup.enter="handleLogin" placeholder="请输入密码" show-password clearable>
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <!-- 登录按钮 -->
          <el-form-item>
            <el-button type="primary" block @click="handleLogin" class="loginDiv">登录</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue';
import { User, Lock } from '@element-plus/icons-vue';
import { login } from '../api'; // 引入 login API 方法
import { useRouter } from 'vue-router'; // 引入 Vue Router
import { ElMessage } from 'element-plus'; // 引入 Element Plus 的消息提示组件

export default {
  name: 'LoginPage',
  components: {
    User,
    Lock,
  },
  setup() {
    const router = useRouter(); // 获取 Vue Router 实例
    // 登录表单数据
    const loginForm = reactive({
      user_name: '',
      user_password: '',
    });

    // 表单验证规则
    const rules = {
      user_name: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
      ],
      user_password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
      ],
    };

    const loginFormRef = ref(null);

    // 登录处理逻辑
    const handleLogin = async () => {
      try {
        const valid = await loginFormRef.value.validate();
        if (!valid) {
          return;
        }
    
        const formData = new FormData();
        formData.append('user_name', loginForm.user_name);
        formData.append('user_password', loginForm.user_password);
    
        const response = await login(formData);
    
        if ([1, 2, 3].includes(response.data)) {
          // 登录成功，存储登录状态、用户信息和权限等级
          ElMessage.success('登录成功'); // Move success message here
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('user_name', loginForm.user_name);
          localStorage.setItem('permission', response.data.toString());
    
          // 根据权限等级跳转到对应页面
          let target = '/home';
          if (response.data === 1) {
            target = '/home';
          } else if (response.data === 2) {
            target = '/AutomatedWritingTool';
          } else if (response.data === 3) {
            target = '/ElectronicTagManagement';
          }
    
          await router.push(target);
        } else {
          ElMessage.error('用户名或密码错误');
        }
      } catch (error) {
        ElMessage.error('网络错误，请稍后再试');
      }
    };

    return {
      loginForm,
      rules,
      loginFormRef,
      handleLogin,
    };
  },
};
</script>

<style scoped>
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
  background-image: url('../assets/Login1.jpeg'); /* 在这里加入背景图的地址 */
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
  width: 16vw;
  height: 35vh;
  padding: 20px;
  border-radius: 10px;
  display: flex; /* 使用 Flexbox */
  flex-direction: column; /* 垂直排列 */
  align-items: center; /* 水平方向居中 */
}

.login-title {
  text-align: center;
  margin-bottom: 4vh;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}
.loginDiv {
  width: 4vw;
  height: 3.5vh;
  margin-top: 2vh;
}
::v-deep .el-form-item__content {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  width: 14vw;
  height: 4vh;
}
</style>

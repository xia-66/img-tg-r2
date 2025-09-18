<template>
  <div class="login-page">
    <div class="login-container">
      <el-card class="login-card" shadow="always">
        <template #header>
          <div class="login-header">
            <el-icon size="32" color="#409eff"><User /></el-icon>
            <h2>管理员登录</h2>
          </div>
        </template>

        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input v-model="loginForm.username" placeholder="用户名" size="large" :prefix-icon="User" clearable />
          </el-form-item>

          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="密码" size="large" :prefix-icon="Lock" show-password clearable @keyup.enter="handleLogin" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" :loading="loading" @click="handleLogin" class="login-button">
              <span v-if="!loading">登录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { adminAPI } from '../utils/api'

const router = useRouter()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) return

    loading.value = true

    const response = await adminAPI.login(loginForm.username, loginForm.password)

    if (response.success) {
      // 保存token
      localStorage.setItem('admin_token', response.data.token)

      ElMessage.success('登录成功')

      // 跳转到管理页面
      router.push('/admin')
    }
  } catch (error) {
    console.error('登录失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 60px);
  background: #fafbfc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-card {
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.login-header {
  text-align: center;
  margin-bottom: 20px;
}

.login-header h2 {
  margin: 12px 0 0 0;
  color: #409eff;
  font-weight: 600;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-page {
    padding: 10px;
  }

  .login-container {
    max-width: 100%;
  }
}
</style>

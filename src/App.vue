<template>
  <div id="app">
    <el-config-provider :locale="zhCn">
      <!-- 导航栏 -->
      <el-header class="navbar">
        <div class="nav-container">
          <div class="nav-left">
            <router-link to="/" class="logo">
              <el-icon size="24"><Picture /></el-icon>
              <span>Vue 图床</span>
            </router-link>
          </div>
          <div class="nav-right">
            <el-menu mode="horizontal" :default-active="activeIndex" router>
              <el-menu-item index="/">
                <el-icon><House /></el-icon>
                <span>首页</span>
              </el-menu-item>
              <el-menu-item v-if="!isAdmin" index="/login">
                <el-icon><Setting /></el-icon>
                <span>后台管理</span>
              </el-menu-item>
              <el-menu-item v-if="isAdmin" index="/admin">
                <el-icon><Setting /></el-icon>
                <span>后台管理</span>
              </el-menu-item>
              <el-menu-item v-if="isAdmin" @click="logout">
                <el-icon><SwitchButton /></el-icon>
                <span>退出登录</span>
              </el-menu-item>
            </el-menu>
          </div>
        </div>
      </el-header>

      <!-- 主要内容区域 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-config-provider>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElConfigProvider } from 'element-plus'
import { House, Picture, Setting, SwitchButton } from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { adminAPI } from './utils/api'

const router = useRouter()
const route = useRoute()

const isAdmin = ref(false)

const activeIndex = computed(() => route.path)

// 检查管理员登录状态
const checkAdminStatus = async () => {
  const token = localStorage.getItem('admin_token')
  if (token) {
    try {
      await adminAPI.verifyToken()
      isAdmin.value = true
    } catch (error) {
      localStorage.removeItem('admin_token')
      isAdmin.value = false
    }
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('admin_token')
  isAdmin.value = false
  ElMessage.success('已退出登录')
  router.push('/')
}

onMounted(() => {
  checkAdminStatus()
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 0;
  height: 60px !important;
  line-height: 60px;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.nav-left .logo {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #409eff;
  text-decoration: none;
  font-size: 20px;
  font-weight: bold;
  transition: color 0.3s ease;
}

.nav-left .logo:hover {
  color: #337ecc;
}

.nav-right :deep(.el-menu) {
  background: transparent;
  border: none;
}

.nav-right :deep(.el-menu-item) {
  color: #606266;
  border-bottom: 2px solid transparent;
  transition: all 0.3s ease;
}

.nav-right :deep(.el-menu-item:hover),
.nav-right :deep(.el-menu-item.is-active) {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.08);
  border-bottom-color: #409eff;
}

.main-content {
  flex: 1;
  padding: 0;
  background: #fafbfc;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .nav-container {
    padding: 0 10px;
  }

  .nav-left .logo span {
    display: none;
  }

  .nav-right :deep(.el-menu-item) span {
    display: none;
  }
}
</style>

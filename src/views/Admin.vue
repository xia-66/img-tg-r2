<template>
  <div class="admin-page">
    <div class="admin-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>
          <el-icon size="28"><Setting /></el-icon>
          后台管理
        </h1>
        <p>图床系统管理控制台</p>
      </div>

      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="8">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon total-images">
                  <el-icon size="32"><PictureRounded /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ stats.totalImages || 0 }}</div>
                  <div class="stat-label">总图片数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon total-size">
                  <el-icon size="32"><FolderOpened /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ formatFileSize(stats.totalSize || 0) }}</div>
                  <div class="stat-label">总存储空间</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon server-status">
                  <el-icon size="32"><Monitor /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">运行中</div>
                  <div class="stat-label">服务状态</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 管理操作 -->
      <div class="management-section">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon size="20"><Tools /></el-icon>
              <span>系统管理</span>
            </div>
          </template>

          <div class="management-actions">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <el-button type="primary" :icon="Refresh" @click="refreshStats" :loading="statsLoading" class="action-button"> 刷新统计 </el-button>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-button type="success" :icon="Download" @click="exportData" class="action-button"> 导出数据 </el-button>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-button type="warning" :icon="DocumentCopy" @click="showSystemInfo" class="action-button"> 系统信息 </el-button>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-popconfirm title="确定要清空所有图片吗？此操作无法撤销！" @confirm="clearAllImages" confirm-button-text="确认清空" cancel-button-text="取消" confirm-button-type="danger" popper-class="admin-popconfirm">
                  <template #reference>
                    <el-button type="danger" :icon="Delete" :loading="clearLoading" class="action-button"> 清空图片 </el-button>
                  </template>
                </el-popconfirm>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>

      <!-- 图片管理 -->
      <div class="images-management">
        <AdminImageGallery @stats-updated="loadStats" />
      </div>
    </div>

    <!-- 系统信息对话框 -->
    <el-dialog v-model="systemInfoVisible" title="系统信息" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="上传目录">
          {{ stats.uploadDir || '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="总图片数"> {{ stats.totalImages || 0 }} 张 </el-descriptions-item>
        <el-descriptions-item label="总存储空间">
          {{ formatFileSize(stats.totalSize || 0) }}
        </el-descriptions-item>
        <el-descriptions-item label="平均文件大小">
          {{ stats.totalImages ? formatFileSize((stats.totalSize || 0) / stats.totalImages) : '0 B' }}
        </el-descriptions-item>
        <el-descriptions-item label="服务器时间">
          {{ new Date().toLocaleString('zh-CN') }}
        </el-descriptions-item>
        <el-descriptions-item label="版本信息"> Vue Image Host v2.0.0 </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Setting, PictureRounded, FolderOpened, Monitor, Tools, Refresh, Download, DocumentCopy, Delete } from '@element-plus/icons-vue'
import { adminAPI } from '../utils/api'
import AdminImageGallery from '../components/AdminImageGallery.vue'

const stats = ref({})
const statsLoading = ref(false)
const clearLoading = ref(false)
const systemInfoVisible = ref(false)

// 加载统计信息
const loadStats = async () => {
  statsLoading.value = true
  try {
    const response = await adminAPI.getStats()
    if (response.success) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('加载统计信息失败:', error)
  } finally {
    statsLoading.value = false
  }
}

// 刷新统计
const refreshStats = () => {
  loadStats()
  ElMessage.success('统计信息已刷新')
}

// 导出数据
const exportData = () => {
  try {
    const data = {
      exportTime: new Date().toISOString(),
      stats: stats.value,
      version: 'Vue Image Host v2.0.0'
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `image-host-data-${new Date().toLocaleDateString()}.json`
    link.click()

    URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    console.error('导出数据失败:', error)
    ElMessage.error('导出数据失败')
  }
}

// 显示系统信息
const showSystemInfo = () => {
  systemInfoVisible.value = true
}

// 清空所有图片
const clearAllImages = async () => {
  clearLoading.value = true
  try {
    const response = await adminAPI.clearAllImages()
    if (response.success) {
      ElMessage.success(response.message)
      loadStats()
    }
  } catch (error) {
    console.error('清空图片失败:', error)
  } finally {
    clearLoading.value = false
  }
}

// 格式化文件大小
const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-page {
  min-height: calc(100vh - 60px);
  background: #fafbfc;
  padding: 20px;
}

.admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
  padding: 40px 20px;
  background: #ffffff;
  color: #303133;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.page-header h1 {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 2.5rem;
  margin-bottom: 10px;
  color: #409eff;
}

.page-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

.stats-section {
  margin-bottom: 30px;
}

.stat-card {
  height: 120px;
  display: flex;
  align-items: center;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.total-images {
  background: #409eff;
}

.stat-icon.total-size {
  background: #67c23a;
}

.stat-icon.server-status {
  background: #e6a23c;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #909399;
}

.management-section {
  margin-bottom: 30px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.management-actions {
  padding: 20px 0;
}

.action-button {
  width: 100%;
  height: 48px;
  font-size: 14px;
  margin-bottom: 10px;
}

.images-management {
  margin-bottom: 30px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-page {
    padding: 10px;
  }

  .page-header {
    padding: 30px 15px;
  }

  .page-header h1 {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
  }

  .stat-card {
    margin-bottom: 15px;
    height: 100px;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .action-button {
    margin-bottom: 10px;
  }
}

/* 全局样式 - 提高弹出框层级 */
:deep(.admin-popconfirm) {
  z-index: 9999 !important;
}

:deep(.el-popper) {
  z-index: 9999 !important;
}
</style>

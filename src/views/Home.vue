<template>
  <div class="home">
    <div class="content-container">
      <!-- 页面标题 -->
      <div class="page-title">
        <h1 class="title">
          <el-icon size="32"><Picture /></el-icon>
          图床上传
        </h1>
      </div>
      <!-- 上传区域 -->
      <UploadArea @uploaded="handleUploadSuccess" />

      <!-- 最近上传提示 -->
      <div v-if="recentUploads.length > 0" class="recent-uploads">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon size="20"><Clock /></el-icon>
              <span>最近上传</span>
              <el-button size="small" text @click="clearRecent">清空</el-button>
            </div>
          </template>

          <div class="recent-list">
            <div v-for="upload in recentUploads" :key="upload.filename" class="recent-item">
              <el-image :src="upload.url" :alt="upload.originalName" fit="cover" class="recent-image" />
              <div class="recent-info">
                <div class="recent-name">{{ upload.originalName }}</div>
                <div class="recent-time">{{ upload.uploadTime }}</div>
              </div>
              <div class="recent-actions">
                <el-button size="small" :icon="CopyDocument" @click="copyUrl(upload.url)"> 复制链接 </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture, Clock, CopyDocument } from '@element-plus/icons-vue'
import UploadArea from '../components/UploadArea.vue'

const recentUploads = ref([])

// 处理上传成功
const handleUploadSuccess = uploadData => {
  // 如果有上传数据，添加到最近上传列表
  if (uploadData) {
    ElMessage.success(`上传成功！文件：${uploadData.originalName}`)
    recentUploads.value.unshift(uploadData)
    // 只保留最近5个
    if (recentUploads.value.length > 5) {
      recentUploads.value = recentUploads.value.slice(0, 5)
    }
  } else {
    ElMessage.success('上传成功！')
  }
}

// 复制链接
const copyUrl = async url => {
  try {
    // 优先使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url)
      ElMessage.success('链接已复制到剪贴板')
      return
    }

    // fallback: 使用传统方法
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      const successful = document.execCommand('copy')
      if (successful) {
        ElMessage.success('链接已复制到剪贴板')
      } else {
        throw new Error('execCommand failed')
      }
    } catch (err) {
      // 最终fallback: 显示链接让用户手动复制
      ElMessage({
        message: `复制失败，请手动复制链接：${url}`,
        type: 'warning',
        duration: 0,
        showClose: true
      })
    } finally {
      document.body.removeChild(textArea)
    }
  } catch (error) {
    // 显示链接让用户手动复制
    ElMessage({
      message: `复制失败，请手动复制链接：${url}`,
      type: 'warning',
      duration: 0,
      showClose: true
    })
  }
}

// 清空最近上传
const clearRecent = () => {
  recentUploads.value = []
  ElMessage.success('已清空最近上传记录')
}
</script>

<style scoped>
.home {
  min-height: calc(100vh - 60px);
}

.content-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 20px;
}

.page-title {
  text-align: center;
  margin-bottom: 40px;
}

.title {
  font-size: 2rem;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-weight: 600;
  color: #409eff;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.recent-uploads {
  margin-top: 40px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.recent-item:hover {
  background: #f5f7fa;
  border-color: #409eff;
}

.recent-image {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  flex-shrink: 0;
}

.recent-info {
  flex: 1;
}

.recent-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  word-break: break-all;
}

.recent-time {
  font-size: 12px;
  color: #909399;
}

.recent-actions {
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-container {
    padding: 20px 10px;
  }

  .page-title {
    margin-bottom: 30px;
  }

  .title {
    font-size: 1.5rem;
    gap: 8px;
  }

  .recent-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .recent-info {
    order: 2;
  }

  .recent-actions {
    order: 3;
  }
}
</style>

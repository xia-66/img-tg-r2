<template>
  <div class="upload-section">
    <el-card class="upload-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <el-icon size="20"><Upload /></el-icon>
          <span>图片上传</span>
        </div>
      </template>

      <!-- 拖拽上传区域 -->
      <div class="upload-area" :class="{ 'is-dragover': isDragover }" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop" @click="selectFiles">
        <div class="upload-content">
          <el-icon size="64" class="upload-icon">
            <UploadFilled />
          </el-icon>
          <div class="upload-text">
            <p class="primary-text">点击或拖拽图片到此区域上传</p>
            <p class="hint-text">支持 JPG、PNG、GIF、WebP、BMP 格式，单个文件最大 10MB</p>
          </div>
        </div>

        <input ref="fileInput" type="file" accept="image/*" multiple style="display: none" @change="handleFileSelect" />
      </div>

      <!-- 上传进度 -->
      <div v-if="uploading" class="upload-progress">
        <el-progress :percentage="uploadProgress" :status="uploadStatus" :stroke-width="8" />
        <p class="progress-text">{{ progressText }}</p>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <el-button type="primary" :icon="Upload" @click="selectFiles" :loading="uploading"> 选择图片 </el-button>
        <el-button :icon="FolderOpened" @click="selectFiles" :disabled="uploading"> 批量上传 </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, UploadFilled, FolderOpened } from '@element-plus/icons-vue'
import { imageAPI } from '../utils/api'

const emit = defineEmits(['uploaded'])

const fileInput = ref()
const isDragover = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const progressText = ref('')

// 选择文件
const selectFiles = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileSelect = event => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    uploadFiles(files)
  }
}

// 拖拽相关事件
const handleDragOver = () => {
  isDragover.value = true
}

const handleDragLeave = () => {
  isDragover.value = false
}

const handleDrop = event => {
  isDragover.value = false
  const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'))
  if (files.length > 0) {
    uploadFiles(files)
  } else {
    ElMessage.warning('请拖拽图片文件')
  }
}

// 上传文件
const uploadFiles = async files => {
  if (uploading.value) return

  uploading.value = true
  uploadProgress.value = 0
  uploadStatus.value = ''

  const totalFiles = files.length
  let uploadedFiles = 0
  let successCount = 0
  const uploadedImages = []

  progressText.value = `准备上传 ${totalFiles} 个文件...`

  for (const file of files) {
    try {
      // 验证文件
      if (!file.type.startsWith('image/')) {
        ElMessage.warning(`文件 "${file.name}" 不是图片格式`)
        continue
      }

      if (file.size > 10 * 1024 * 1024) {
        ElMessage.warning(`文件 "${file.name}" 大小超过 10MB 限制`)
        continue
      }

      progressText.value = `正在上传: ${file.name}`

      const response = await imageAPI.uploadImage(file)

      if (response.success) {
        successCount++
        uploadedImages.push(response.data)
      }
    } catch (error) {
      console.error('上传失败:', error)
      ElMessage.error(`${file.name} 上传失败`)
    }

    uploadedFiles++
    uploadProgress.value = Math.round((uploadedFiles / totalFiles) * 100)
  }

  // 上传完成
  setTimeout(() => {
    uploading.value = false
    uploadProgress.value = 0
    progressText.value = ''

    if (successCount > 0) {
      // 发送最后一张成功上传的图片数据
      if (uploadedImages.length > 0) {
        emit('uploaded', uploadedImages[uploadedImages.length - 1])
      }
    }

    // 清空文件选择
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }, 500)
}
</script>

<style scoped>
.upload-section {
  margin-bottom: 30px;
}

.upload-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.upload-area {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  background: #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 20px;
}

.upload-area:hover,
.upload-area.is-dragover {
  border-color: #409eff;
  background: #f0f9ff;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.upload-icon {
  color: #c0c4cc;
  transition: color 0.3s ease;
}

.upload-area:hover .upload-icon,
.upload-area.is-dragover .upload-icon {
  color: #409eff;
}

.upload-text .primary-text {
  font-size: 16px;
  color: #606266;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.upload-text .hint-text {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.upload-progress {
  margin-bottom: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #606266;
}

.quick-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .upload-area {
    padding: 30px 15px;
  }

  .upload-icon {
    font-size: 48px !important;
  }

  .upload-text .primary-text {
    font-size: 14px;
  }

  .upload-text .hint-text {
    font-size: 12px;
  }

  .quick-actions {
    flex-direction: column;
    align-items: center;
  }

  .quick-actions .el-button {
    width: 200px;
  }
}
</style>

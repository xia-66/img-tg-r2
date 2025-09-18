<template>
  <div class="gallery-section">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon size="20"><PictureRounded /></el-icon>
            <span>图片列表</span>
            <el-tag v-if="images.length > 0" type="info" size="small"> {{ images.length }} 张 </el-tag>
          </div>
          <div class="header-right">
            <el-button :icon="Refresh" @click="loadImages" :loading="loading" size="small"> 刷新 </el-button>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading && images.length === 0" class="loading-state">
        <el-skeleton :rows="3" animated />
        <div class="loading-text">加载中...</div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!loading && images.length === 0" class="empty-state">
        <el-empty image-size="120" description="还没有上传任何图片">
          <template #image>
            <el-icon size="120" color="#c0c4cc">
              <PictureRounded />
            </el-icon>
          </template>
          <el-button type="primary" @click="$emit('upload-click')"> 开始上传 </el-button>
        </el-empty>
      </div>

      <!-- 图片网格 -->
      <div v-else class="image-grid">
        <div v-for="image in images" :key="image.filename" class="image-card">
          <div class="image-wrapper" @click="previewImage(image)">
            <el-image :src="image.url" :alt="image.filename" fit="cover" class="image-preview" loading="lazy" :preview-src-list="[image.url]" :initial-index="0" preview-teleported>
              <template #error>
                <div class="image-error">
                  <el-icon size="32"><PictureFilled /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </el-image>
            <div class="image-overlay">
              <el-button :icon="View" circle size="small" @click.stop="previewImage(image)" />
            </div>
          </div>

          <div class="image-info">
            <div class="image-filename" :title="image.filename">
              {{ truncateFilename(image.filename) }}
            </div>
            <div class="image-meta">
              <span class="file-size">{{ formatFileSize(image.size) }}</span>
              <span class="upload-time">{{ formatTime(image.uploadTime) }}</span>
            </div>
            <div class="image-actions">
              <el-button-group size="small">
                <el-button :icon="CopyDocument" @click="copyUrl(image.url)" title="复制链接" />
                <el-button :icon="Download" @click="downloadImage(image)" title="下载图片" />
                <el-popconfirm title="确定要删除这张图片吗？" @confirm="deleteImage(image.filename)" confirm-button-text="删除" cancel-button-text="取消" confirm-button-type="danger">
                  <template #reference>
                    <el-button :icon="Delete" type="danger" title="删除图片" />
                  </template>
                </el-popconfirm>
              </el-button-group>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 图片预览对话框 -->
    <el-dialog v-model="previewVisible" :title="currentImage?.filename" width="80%" top="5vh" append-to-body>
      <div v-if="currentImage" class="preview-content">
        <el-image :src="currentImage.url" :alt="currentImage.filename" fit="contain" class="preview-image" />
        <div class="preview-info">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="文件名">
              {{ currentImage.filename }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(currentImage.size) }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              {{ currentImage.uploadTime }}
            </el-descriptions-item>
            <el-descriptions-item label="图片链接">
              <el-link :href="currentImage.url" target="_blank">
                {{ currentImage.url }}
              </el-link>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <div class="preview-actions">
          <el-button @click="copyUrl(currentImage?.url)">
            <el-icon><CopyDocument /></el-icon>
            复制链接
          </el-button>
          <el-button @click="downloadImage(currentImage)">
            <el-icon><Download /></el-icon>
            下载
          </el-button>
          <el-button type="danger" @click="deleteImage(currentImage?.filename)">
            <el-icon><Delete /></el-icon>
            删除
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { PictureRounded, PictureFilled, Refresh, View, CopyDocument, Download, Delete } from '@element-plus/icons-vue'
import { imageAPI } from '../utils/api'

defineEmits(['upload-click'])

const images = ref([])
const loading = ref(false)
const previewVisible = ref(false)
const currentImage = ref(null)

// 加载图片列表
const loadImages = async () => {
  loading.value = true
  try {
    const response = await imageAPI.getImages()
    if (response.success) {
      images.value = response.data
    }
  } catch (error) {
    console.error('加载图片列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 预览图片
const previewImage = image => {
  currentImage.value = image
  previewVisible.value = true
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

// 下载图片
const downloadImage = image => {
  const link = document.createElement('a')
  link.href = image.url
  link.download = image.filename
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 删除图片
const deleteImage = async filename => {
  try {
    const response = await imageAPI.deleteImage(filename)
    if (response.success) {
      ElMessage.success('图片删除成功')
      loadImages()
      previewVisible.value = false
    }
  } catch (error) {
    console.error('删除图片失败:', error)
  }
}

// 工具函数
const truncateFilename = (filename, maxLength = 20) => {
  if (filename.length <= maxLength) return filename
  const ext = filename.split('.').pop()
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf('.'))
  const truncated = nameWithoutExt.slice(0, maxLength - ext.length - 4) + '...'
  return truncated + '.' + ext
}

const formatFileSize = bytes => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = timeStr => {
  return timeStr.replace(/\//g, '-')
}

// 暴露方法给父组件
defineExpose({
  loadImages
})

onMounted(() => {
  loadImages()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
}

.loading-state {
  text-align: center;
  padding: 40px;
}

.loading-text {
  margin-top: 16px;
  color: #909399;
}

.empty-state {
  padding: 40px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  padding: 20px 0;
}

.image-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.image-wrapper {
  position: relative;
  cursor: pointer;
}

.image-preview {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #f5f7fa;
  color: #c0c4cc;
  gap: 8px;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-wrapper:hover .image-overlay {
  opacity: 1;
}

.image-info {
  padding: 16px;
}

.image-filename {
  font-weight: 600;
  margin-bottom: 8px;
  color: #303133;
  word-break: break-all;
}

.image-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
}

.image-actions {
  display: flex;
  justify-content: center;
}

.preview-content {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  margin-bottom: 20px;
}

.preview-info {
  margin-top: 20px;
}

.preview-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 15px;
  }

  .image-preview {
    height: 150px;
  }

  .image-error {
    height: 150px;
  }

  .card-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .preview-actions {
    flex-direction: column;
  }
}
</style>

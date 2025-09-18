<template>
  <div class="admin-gallery">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon size="20"><PictureRounded /></el-icon>
            <span>图片管理</span>
            <el-tag v-if="images.length > 0" type="info" size="small"> {{ images.length }} 张 </el-tag>
          </div>
          <div class="header-right">
            <el-button-group>
              <el-button :icon="Refresh" @click="loadImages" :loading="loading" size="small"> 刷新 </el-button>
              <el-button :icon="View" @click="toggleViewMode" size="small" :type="viewMode === 'grid' ? 'primary' : 'default'">
                {{ viewMode === 'grid' ? '网格' : '列表' }}
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8">
            <el-input v-model="searchText" placeholder="搜索图片名称..." :prefix-icon="Search" clearable @input="filterImages" />
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-select v-model="sortBy" placeholder="排序方式" @change="sortImages" style="width: 100%">
              <el-option label="上传时间（新到旧）" value="time-desc" />
              <el-option label="上传时间（旧到新）" value="time-asc" />
              <el-option label="文件大小（大到小）" value="size-desc" />
              <el-option label="文件大小（小到大）" value="size-asc" />
              <el-option label="文件名（A-Z）" value="name-asc" />
              <el-option label="文件名（Z-A）" value="name-desc" />
            </el-select>
          </el-col>
          <el-col :xs="24" :sm="24" :md="8">
            <el-button-group style="width: 100%">
              <el-popconfirm title="确定要删除选中的图片吗？" @confirm="deleteSelectedImages" :disabled="selectedImages.length === 0" popper-class="admin-popconfirm">
                <template #reference>
                  <el-button type="danger" :icon="Delete" :disabled="selectedImages.length === 0"> 删除选中 ({{ selectedImages.length }}) </el-button>
                </template>
              </el-popconfirm>
              <el-button @click="selectAll" :disabled="filteredImages.length === 0">
                {{ selectedImages.length === filteredImages.length ? '取消全选' : '全选' }}
              </el-button>
            </el-button-group>
          </el-col>
        </el-row>
      </div>

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
        </el-empty>
      </div>

      <!-- 网格视图 -->
      <div v-else-if="viewMode === 'grid'" class="grid-view">
        <div class="image-grid">
          <div v-for="image in filteredImages" :key="image.filename" class="image-card" :class="{ selected: selectedImages.includes(image.filename) }">
            <div class="image-wrapper">
              <el-checkbox v-model="selectedImages" :label="image.filename" class="image-checkbox" />
              <el-image :src="image.url" :alt="image.filename" fit="cover" class="image-preview" loading="lazy" @click="previewImage(image)">
                <template #error>
                  <div class="image-error">
                    <el-icon size="32"><PictureFilled /></el-icon>
                    <span>加载失败</span>
                  </div>
                </template>
              </el-image>
              <div class="image-overlay">
                <el-button-group>
                  <el-button :icon="View" circle size="small" @click.stop="previewImage(image)" />
                  <el-button :icon="Download" circle size="small" @click.stop="downloadImage(image)" />
                  <el-popconfirm title="确定要删除这张图片吗？" @confirm="deleteImage(image.filename)" popper-class="admin-popconfirm">
                    <template #reference>
                      <el-button :icon="Delete" circle size="small" type="danger" @click.stop />
                    </template>
                  </el-popconfirm>
                </el-button-group>
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
            </div>
          </div>
        </div>
      </div>

      <!-- 列表视图 -->
      <div v-else class="list-view">
        <el-table :data="filteredImages" @selection-change="handleSelectionChange" style="width: 100%">
          <el-table-column type="selection" width="55" />
          <el-table-column label="预览" width="80">
            <template #default="{ row }">
              <el-image :src="row.url" :alt="row.filename" fit="cover" style="width: 50px; height: 50px; border-radius: 4px" @click="previewImage(row)" class="table-preview" />
            </template>
          </el-table-column>
          <el-table-column prop="filename" label="文件名" min-width="200">
            <template #default="{ row }">
              <el-link @click="previewImage(row)" :underline="false">
                {{ row.filename }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="100">
            <template #default="{ row }">
              {{ formatFileSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="uploadTime" label="上传时间" width="150" />
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button-group size="small">
                <el-button :icon="View" @click="previewImage(row)">预览</el-button>
                <el-button :icon="Download" @click="downloadImage(row)">下载</el-button>
                <el-popconfirm title="确定要删除吗？" @confirm="deleteImage(row.filename)" popper-class="admin-popconfirm">
                  <template #reference>
                    <el-button type="danger" :icon="Delete">删除</el-button>
                  </template>
                </el-popconfirm>
              </el-button-group>
            </template>
          </el-table-column>
        </el-table>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { PictureRounded, PictureFilled, Refresh, View, Search, Delete, Download, CopyDocument } from '@element-plus/icons-vue'
import { imageAPI, adminAPI } from '../utils/api'

const emit = defineEmits(['stats-updated'])

const images = ref([])
const loading = ref(false)
const previewVisible = ref(false)
const currentImage = ref(null)
const viewMode = ref('grid')
const searchText = ref('')
const sortBy = ref('time-desc')
const selectedImages = ref([])

// 筛选后的图片列表
const filteredImages = computed(() => {
  let result = [...images.value]

  // 搜索过滤
  if (searchText.value) {
    result = result.filter(image => image.filename.toLowerCase().includes(searchText.value.toLowerCase()))
  }

  // 排序
  switch (sortBy.value) {
    case 'time-desc':
      result.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))
      break
    case 'time-asc':
      result.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime))
      break
    case 'size-desc':
      result.sort((a, b) => b.size - a.size)
      break
    case 'size-asc':
      result.sort((a, b) => a.size - b.size)
      break
    case 'name-asc':
      result.sort((a, b) => a.filename.localeCompare(b.filename))
      break
    case 'name-desc':
      result.sort((a, b) => b.filename.localeCompare(a.filename))
      break
  }

  return result
})

// 加载图片列表
const loadImages = async () => {
  loading.value = true
  try {
    const response = await imageAPI.getImages()
    if (response.success) {
      images.value = response.data
      selectedImages.value = []
    }
  } catch (error) {
    console.error('加载图片列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

// 筛选图片
const filterImages = () => {
  // 清空选择
  selectedImages.value = []
}

// 排序图片
const sortImages = () => {
  // 清空选择
  selectedImages.value = []
}

// 全选/取消全选
const selectAll = () => {
  if (selectedImages.value.length === filteredImages.value.length) {
    selectedImages.value = []
  } else {
    selectedImages.value = filteredImages.value.map(img => img.filename)
  }
}

// 处理表格选择变化
const handleSelectionChange = selection => {
  selectedImages.value = selection.map(item => item.filename)
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

// 删除单张图片
const deleteImage = async filename => {
  try {
    const response = await adminAPI.deleteImage(filename)
    if (response.success) {
      ElMessage.success('图片删除成功')
      loadImages()
      emit('stats-updated')
      previewVisible.value = false

      // 从选中列表中移除
      const index = selectedImages.value.indexOf(filename)
      if (index > -1) {
        selectedImages.value.splice(index, 1)
      }
    }
  } catch (error) {
    console.error('删除图片失败:', error)
  }
}

// 删除选中的图片
const deleteSelectedImages = async () => {
  if (selectedImages.value.length === 0) return

  const deletePromises = selectedImages.value.map(filename => adminAPI.deleteImage(filename))

  try {
    await Promise.all(deletePromises)
    ElMessage.success(`成功删除 ${selectedImages.value.length} 张图片`)
    selectedImages.value = []
    loadImages()
    emit('stats-updated')
  } catch (error) {
    console.error('批量删除失败:', error)
    ElMessage.error('部分图片删除失败')
    loadImages()
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

.filter-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
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

/* 网格视图样式 */
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
  position: relative;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.image-card.selected {
  box-shadow: 0 0 0 2px #409eff;
}

.image-wrapper {
  position: relative;
  cursor: pointer;
}

.image-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 2px;
  border-radius: 4px;
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
  z-index: 5;
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
}

/* 列表视图样式 */
.list-view {
  margin-top: 20px;
}

.table-preview {
  cursor: pointer;
  border-radius: 4px;
}

.table-preview:hover {
  opacity: 0.8;
}

/* 预览对话框样式 */
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

  .filter-section .el-col {
    margin-bottom: 12px;
  }

  .preview-actions {
    flex-direction: column;
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

import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'


// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// 固定端口配置
const PORT = 33000

// 自动生成JWT密钥（每次启动时生成随机密钥）
const JWT_SECRET = crypto.randomBytes(64).toString('hex')

// 支持的图片格式
const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
const SUPPORTED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp|bmp/

// 通用错误响应函数
const sendError = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message: message
  })
}

// 生成基础URL（根据请求动态获取）
function getBaseUrl(req) {
  // 如果有请求对象，从请求头中获取实际访问的URL
  if (req) {
    const protocol = req.protocol || 'http'
    const host = req.get('host')
    if (host) {
      return `${protocol}://${host}`
    }
  }

  // 默认使用localhost
  return `http://localhost:${PORT}`
}

// 简单的用户数据存储（生产环境请使用数据库）
let adminUser = null

// 初始化管理员用户
async function initAdmin() {
  adminUser = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10)
  }
}

// 中间件
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// 在生产环境中，Vue应用会被构建到dist目录
app.use(express.static('dist'))

// 确保上传目录存在（固定为uploads目录）
const uploadDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return sendError(res, 401, '未提供访问令牌')
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return sendError(res, 403, '无效的访问令牌')
    }
    req.user = user
    next()
  })
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // 将原始文件名正确解码
    try {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8')
    } catch (error) {
      console.log('文件名编码转换失败，使用原始文件名')
    }

    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const timestamp = Date.now()
    const random = Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `${timestamp}_${random}${ext}`)
  }
})

// 文件过滤器，只允许图片
const fileFilter = (req, file, cb) => {
  const extname = SUPPORTED_IMAGE_TYPES.test(path.extname(file.originalname).toLowerCase())
  const mimetype = SUPPORTED_IMAGE_TYPES.test(file.mimetype)

  if (mimetype && extname) {
    cb(null, true)
  } else {
    cb(new Error('只支持图片文件格式 (jpeg, jpg, png, gif, webp, bmp)'))
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE || 10485760 // 10MB 默认限制
  },
  fileFilter: fileFilter
})

// 静态文件服务 - 提供上传的图片访问
app.use('/uploads', express.static(uploadDir))

// 管理员登录接口
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return sendError(res, 400, '请提供用户名和密码')
    }

    if (username !== adminUser.username) {
      return sendError(res, 401, '用户名或密码错误')
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password)
    if (!isPasswordValid) {
      return sendError(res, 401, '用户名或密码错误')
    }

    const token = jwt.sign({ username: adminUser.username }, JWT_SECRET, { expiresIn: '2h' })

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        username: adminUser.username
      }
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 验证token接口
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '令牌有效',
    data: {
      username: req.user.username
    }
  })
})

// 上传图片接口
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, '请选择要上传的图片文件')
    }

    const baseUrl = getBaseUrl(req)
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`

    res.json({
      success: true,
      message: '图片上传成功',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: imageUrl,
        uploadTime: new Date().toLocaleString('zh-CN')
      }
    })
  } catch (error) {
    console.error('上传错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 获取所有已上传的图片列表
app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir)
    const baseUrl = getBaseUrl(req)

    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase()
        return SUPPORTED_IMAGE_EXTENSIONS.includes(ext)
      })
      .map(file => {
        const filePath = path.join(uploadDir, file)
        const stats = fs.statSync(filePath)
        return {
          filename: file,
          url: `${baseUrl}/uploads/${file}`,
          size: stats.size,
          uploadTime: stats.mtime.toLocaleString('zh-CN')
        }
      })
      .sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime))

    res.json({
      success: true,
      data: images
    })
  } catch (error) {
    console.error('获取图片列表错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 管理员获取图片统计信息
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir)
    const images = files.filter(file => {
      const ext = path.extname(file).toLowerCase()
      return SUPPORTED_IMAGE_EXTENSIONS.includes(ext)
    })

    let totalSize = 0
    images.forEach(file => {
      const filePath = path.join(uploadDir, file)
      const stats = fs.statSync(filePath)
      totalSize += stats.size
    })

    res.json({
      success: true,
      data: {
        totalImages: images.length,
        totalSize: totalSize,
        uploadDir: uploadDir
      }
    })
  } catch (error) {
    console.error('获取统计信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 删除图片接口（需要管理员权限）
app.delete('/api/admin/images/:filename', authenticateToken, (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(uploadDir, filename)

    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, '文件不存在')
    }

    fs.unlinkSync(filePath)
    res.json({
      success: true,
      message: '图片删除成功'
    })
  } catch (error) {
    console.error('删除图片错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 普通用户删除图片接口（不需要认证，但建议在生产环境中添加限制）
app.delete('/api/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(uploadDir, filename)

    if (!fs.existsSync(filePath)) {
      return sendError(res, 404, '文件不存在')
    }

    fs.unlinkSync(filePath)
    res.json({
      success: true,
      message: '图片删除成功'
    })
  } catch (error) {
    console.error('删除图片错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 清空所有图片（管理员功能）
app.delete('/api/admin/images', authenticateToken, (req, res) => {
  try {
    const files = fs.readdirSync(uploadDir)
    let deletedCount = 0

    files.forEach(file => {
      const ext = path.extname(file).toLowerCase()
      if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
        const filePath = path.join(uploadDir, file)
        fs.unlinkSync(filePath)
        deletedCount++
      }
    })

    res.json({
      success: true,
      message: `成功删除 ${deletedCount} 张图片`
    })
  } catch (error) {
    console.error('清空图片错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    })
  }
})

// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超过限制 (最大 10MB)'
      })
    }
  }

  res.status(500).json({
    success: false,
    message: error.message || '服务器内部错误'
  })
})

// SPA 支持 - 所有其他路由都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// 启动服务器
async function startServer() {
  await initAdmin()

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 图床服务器已启动`)
    console.log(`🔗 访问地址: http://localhost:${PORT}`)
    console.log(`📁 上传目录: ${uploadDir}`)
    console.log(`👤 管理员账号已初始化`)
    console.log(`🔑 JWT密钥已自动生成`)
    console.log(`🌐 服务器监听: 0.0.0.0:${PORT}`)
    console.log(`📝 图片URL将根据访问地址动态生成`)
  })
}

startServer().catch(console.error)

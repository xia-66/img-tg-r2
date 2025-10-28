import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Admin from '../views/Admin.vue'
import Login from '../views/Login.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '图床首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '管理员登录' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { title: '后台管理', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Vue 图床` : 'Vue 图床'

  const token = localStorage.getItem('admin_token')

  // 如果访问登录页且已有token，验证token是否有效
  if (to.path === '/login' && token) {
    try {
      // 验证token是否有效
      const response = await fetch('/api/admin/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        // token有效，直接跳转到管理页面
        next('/admin')
        return
      } else {
        // token无效，清除并继续到登录页
        localStorage.removeItem('admin_token')
      }
    } catch (error) {
      // 验证失败，清除token
      localStorage.removeItem('admin_token')
    }
  }

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!token) {
      next('/login')
      return
    }

    // 验证token是否有效
    try {
      const response = await fetch('/api/admin/verify', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // token无效，跳转到登录页
        localStorage.removeItem('admin_token')
        next('/login')
        return
      }
    } catch (error) {
      // 验证失败，跳转到登录页
      localStorage.removeItem('admin_token')
      next('/login')
      return
    }
  }

  next()
})

export default router

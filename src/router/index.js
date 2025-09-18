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
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - Vue 图床` : 'Vue 图床'

  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      next('/login')
      return
    }
  }

  next()
})

export default router

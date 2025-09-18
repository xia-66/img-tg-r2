# 生产环境多阶段构建 Dockerfile
# 第一阶段：构建前端应用
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# 复制前端相关文件
COPY package*.json ./
COPY vite.config.js ./
COPY index.html ./
COPY auto-imports.d.ts ./
COPY components.d.ts ./
COPY src/ ./src/
COPY public/ ./public/

# 安装依赖并构建前端
RUN npm ci && \
    npm run client:build

# 第二阶段：构建生产镜像
FROM node:22-alpine AS production

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=33000

# 安装必要的系统依赖
RUN apk add --no-cache \
    dumb-init \
    curl \
    && rm -rf /var/cache/apk/*

# 创建应用目录
WORKDIR /app

# 复制package.json和安装生产依赖
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# 复制服务器文件
COPY server.js ./

# 从构建阶段复制前端构建文件
COPY --from=frontend-builder /app/dist ./dist

# 创建必要的目录
RUN mkdir -p uploads logs

# 暴露端口
EXPOSE 33000

# 使用dumb-init作为PID 1
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "server.js"]

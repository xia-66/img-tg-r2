# 🐳 Docker 部署指南

## 快速开始

### 方法 1：使用 docker-compose（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd img-tg-r2

# 2. 复制环境变量配置文件
copy env.example .env  # Windows
# cp env.example .env  # Linux/Mac

# 3. 编辑 .env 文件，配置管理员账号和存储信息
# 使用记事本或其他编辑器打开 .env

# 4. 构建并启动
docker-compose up -d

# 5. 查看日志
docker-compose logs -f

# 6. 访问应用
# http://localhost:33000
```

### 方法 2：直接使用 Docker

```bash
# 构建镜像
docker build -t img-tg-r2:latest .

# 运行容器
docker run -d \
  --name img-tg-r2 \
  -p 33000:33000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your_password \
  -e TG_BOT_TOKEN=your_token \
  -e TG_CHAT_ID=@your_channel \
  -v $(pwd)/telegraph-index.json:/app/telegraph-index.json \
  -v $(pwd)/r2-index.json:/app/r2-index.json \
  -v $(pwd)/storage-config.json:/app/storage-config.json \
  img-tg-r2:latest

# 查看日志
docker logs -f img-tg-r2
```

## 🔧 环境变量配置

### 必需配置

```bash
# 管理员账号
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_strong_password
```

### Telegraph 存储配置

```bash
TG_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TG_CHAT_ID=@your_channel  # 或 -1001234567890
```

### Cloudflare R2 存储配置

```bash
R2_ACCOUNT_ID=bc1fd7fbb26dfd2cc6b342193feae2d4
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=img
R2_PUBLIC_DOMAIN=  # 可选，留空使用服务器代理
```

## 📋 Docker 命令

### 启动服务

```bash
docker-compose up -d
```

### 停止服务

```bash
docker-compose down
```

### 重启服务

```bash
docker-compose restart
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看最近 100 行
docker-compose logs --tail=100
```

### 更新镜像

```bash
# 拉取最新代码
git pull

# 重新构建
docker-compose build

# 重启服务
docker-compose up -d
```

### 清理容器

```bash
# 停止并删除容器
docker-compose down

# 删除所有数据（包括卷）
docker-compose down -v
```

## 🔍 故障排除

### 问题：容器无法启动

```bash
# 查看详细日志
docker-compose logs img-tg-r2

# 检查容器状态
docker-compose ps

# 进入容器调试
docker-compose exec img-tg-r2 sh
```

### 问题：端口已被占用

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8080:33000"  # 将本地端口改为 8080
```

### 问题：环境变量不生效

```bash
# 确认 .env 文件存在
ls -la .env

# 重新构建（强制不使用缓存）
docker-compose build --no-cache

# 重启容器
docker-compose up -d
```

### 问题：索引文件丢失

确保在 `docker-compose.yml` 中配置了卷挂载：

```yaml
volumes:
  - ./telegraph-index.json:/app/telegraph-index.json
  - ./r2-index.json:/app/r2-index.json
  - ./storage-config.json:/app/storage-config.json
```

## 📊 监控和维护

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats img-tg-r2

# 查看容器详细信息
docker inspect img-tg-r2
```

### 备份数据

```bash
# 备份索引文件
cp telegraph-index.json telegraph-index.json.bak
cp r2-index.json r2-index.json.bak
cp storage-config.json storage-config.json.bak
```

### 恢复数据

```bash
# 恢复索引文件
cp telegraph-index.json.bak telegraph-index.json
cp r2-index.json.bak r2-index.json
cp storage-config.json.bak storage-config.json

# 重启服务
docker-compose restart
```

## 🌐 反向代理配置

### 使用 Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:33000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 处理大文件上传
        client_max_body_size 50M;
    }
}
```

### 使用 Caddy

```caddyfile
your-domain.com {
    reverse_proxy localhost:33000
    
    # 自动 HTTPS
    encode gzip
}
```

## 📦 生产环境优化

### 1. 修改 Dockerfile（优化构建）

在 `Dockerfile` 最后添加：

```dockerfile
# 使用非 root 用户运行
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

### 2. 限制资源使用

在 `docker-compose.yml` 中添加：

```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.5'
      memory: 256M
```

### 3. 添加健康检查

已在 `docker-compose.yml` 中配置！

## 🔐 安全建议

1. ✅ 使用强密码
2. ✅ 不要将 `.env` 文件提交到 Git
3. ✅ 定期备份索引文件
4. ✅ 配置 HTTPS（使用 Nginx/Caddy）
5. ✅ 限制容器资源使用

## 📝 常见问题

### Q: 如何查看管理员密码？

A: 密码使用 bcrypt 加密存储，无法直接查看。修改 `.env` 文件中的 `ADMIN_PASSWORD` 后重启容器。

### Q: 索引文件在哪里？

A: 在项目根目录：
- `telegraph-index.json` - Telegraph 图片索引
- `r2-index.json` - R2 图片索引
- `storage-config.json` - 存储配置

### Q: 如何更新版本？

A:
```bash
git pull
docker-compose build
docker-compose up -d
```

### Q: 数据会丢失吗？

A: 不会！索引文件通过 volumes 挂载到主机，容器删除后数据仍保留。

---

✅ **部署完成后访问：** http://your-server-ip:33000


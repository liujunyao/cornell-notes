# 前端 Dockerfile - 多阶段构建
# 阶段 1: 构建前端
FROM node:18-alpine AS builder

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
COPY frontend/apps ./apps
COPY frontend/packages ./packages

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建 Web 应用
RUN pnpm build:web

# 阶段 2: 生产环境
FROM nginx:alpine

# 复制自定义 nginx 配置
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建产物
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 8100

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]

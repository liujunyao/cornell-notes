#!/bin/bash
# Docker 镜像构建脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 镜像仓库配置
REGISTRY="c8n.io"
PROJECT="liujunyao"
VERSION="${VERSION:-latest}"

# 镜像名称
BACKEND_IMAGE="${REGISTRY}/${PROJECT}/cornell-notes-backend:${VERSION}"
FRONTEND_IMAGE="${REGISTRY}/${PROJECT}/cornell-notes-frontend:${VERSION}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}康奈尔笔记 Docker 镜像构建${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否在项目根目录
if [ ! -f "docker/backend.Dockerfile" ]; then
    echo -e "${RED}错误: 请在项目根目录下运行此脚本${NC}"
    exit 1
fi

# 构建后端镜像
echo -e "${YELLOW}[1/2] 构建后端镜像...${NC}"
docker build -f docker/backend.Dockerfile -t ${BACKEND_IMAGE} .
echo -e "${GREEN}✓ 后端镜像构建成功: ${BACKEND_IMAGE}${NC}"
echo ""

# 构建前端镜像
echo -e "${YELLOW}[2/2] 构建前端镜像...${NC}"
docker build -f docker/frontend.Dockerfile -t ${FRONTEND_IMAGE} .
echo -e "${GREEN}✓ 前端镜像构建成功: ${FRONTEND_IMAGE}${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}镜像构建完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "后端镜像: ${BACKEND_IMAGE}"
echo "前端镜像: ${FRONTEND_IMAGE}"
echo ""
echo -e "${YELLOW}提示: 使用 ./docker/push.sh 推送镜像到仓库${NC}"

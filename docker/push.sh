#!/bin/bash
# Docker 镜像推送脚本

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
echo -e "${GREEN}康奈尔笔记 Docker 镜像推送${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查镜像是否存在
if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "${BACKEND_IMAGE}"; then
    echo -e "${RED}错误: 后端镜像不存在，请先运行 ./docker/build.sh 构建镜像${NC}"
    exit 1
fi

if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "${FRONTEND_IMAGE}"; then
    echo -e "${RED}错误: 前端镜像不存在，请先运行 ./docker/build.sh 构建镜像${NC}"
    exit 1
fi

# 登录到镜像仓库
echo -e "${YELLOW}登录到 ${REGISTRY}...${NC}"
docker login ${REGISTRY}

# 推送后端镜像
echo ""
echo -e "${YELLOW}[1/2] 推送后端镜像...${NC}"
docker push ${BACKEND_IMAGE}
echo -e "${GREEN}✓ 后端镜像推送成功: ${BACKEND_IMAGE}${NC}"

# 推送前端镜像
echo ""
echo -e "${YELLOW}[2/2] 推送前端镜像...${NC}"
docker push ${FRONTEND_IMAGE}
echo -e "${GREEN}✓ 前端镜像推送成功: ${FRONTEND_IMAGE}${NC}"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}镜像推送完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "后端镜像: ${BACKEND_IMAGE}"
echo "前端镜像: ${FRONTEND_IMAGE}"
echo ""
echo -e "${YELLOW}提示: 可以使用 docker-compose 部署应用${NC}"

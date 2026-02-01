#!/bin/bash
# 一键部署脚本：构建并推送镜像

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}康奈尔笔记 - 一键部署${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 检查是否在项目根目录
if [ ! -f "docker/backend.Dockerfile" ]; then
    echo "错误: 请在项目根目录下运行此脚本"
    exit 1
fi

# 1. 构建镜像
echo -e "${YELLOW}步骤 1: 构建 Docker 镜像${NC}"
./docker/build.sh
echo ""

# 2. 推送镜像
echo -e "${YELLOW}步骤 2: 推送镜像到仓库${NC}"
./docker/push.sh
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "镜像已成功推送到 c8n.io 仓库"
echo "可以使用以下命令在服务器上部署："
echo ""
echo "  cd docker"
echo "  docker-compose pull"
echo "  docker-compose up -d"

@echo off
chcp 65001 >nul
REM 一键部署脚本：构建并推送镜像 (Windows)

setlocal

echo ========================================
echo 康奈尔笔记 - 一键部署
echo ========================================
echo.

REM 检查是否在项目根目录
if not exist "docker\backend.Dockerfile" (
    echo 错误: 请在项目根目录下运行此脚本
    exit /b 1
)

REM 1. 构建镜像
echo 步骤 1: 构建 Docker 镜像
call docker\build.bat
if %errorlevel% neq 0 (
    echo 构建失败
    exit /b 1
)
echo.

REM 2. 推送镜像
echo 步骤 2: 推送镜像到仓库
call docker\push.bat
if %errorlevel% neq 0 (
    echo 推送失败
    exit /b 1
)
echo.

echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 镜像已成功推送到 c8n.io 仓库
echo 可以使用以下命令在服务器上部署：
echo.
echo   cd docker
echo   docker-compose pull
echo   docker-compose up -d

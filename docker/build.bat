@echo off
chcp 65001 >nul
REM Docker 镜像构建脚本 (Windows)

setlocal

REM 镜像仓库配置
set REGISTRY=c8n.io
set PROJECT=liujunyao
if "%VERSION%"=="" set VERSION=latest

REM 镜像名称
set BACKEND_IMAGE=%REGISTRY%/%PROJECT%/cornell-notes-backend:%VERSION%
set FRONTEND_IMAGE=%REGISTRY%/%PROJECT%/cornell-notes-frontend:%VERSION%

echo ========================================
echo 康奈尔笔记 Docker 镜像构建
echo ========================================
echo.

REM 检查是否在项目根目录
if not exist "docker\backend.Dockerfile" (
    echo 错误: 请在项目根目录下运行此脚本
    exit /b 1
)

REM 构建后端镜像
echo [1/2] 构建后端镜像...
docker build -f docker\backend.Dockerfile -t %BACKEND_IMAGE% .
if %errorlevel% neq 0 (
    echo 后端镜像构建失败
    exit /b 1
)
echo ✓ 后端镜像构建成功: %BACKEND_IMAGE%
echo.

REM 构建前端镜像
echo [2/2] 构建前端镜像...
docker build -f docker\frontend.Dockerfile -t %FRONTEND_IMAGE% .
if %errorlevel% neq 0 (
    echo 前端镜像构建失败
    exit /b 1
)
echo ✓ 前端镜像构建成功: %FRONTEND_IMAGE%
echo.

echo ========================================
echo 镜像构建完成！
echo ========================================
echo.
echo 后端镜像: %BACKEND_IMAGE%
echo 前端镜像: %FRONTEND_IMAGE%
echo.
echo 提示: 使用 docker\push.bat 推送镜像到仓库

@echo off
chcp 65001 >nul
REM Docker 镜像推送脚本 (Windows)

setlocal

REM 镜像仓库配置
set REGISTRY=c8n.io
set PROJECT=liujunyao
if "%VERSION%"=="" set VERSION=latest

REM 镜像名称
set BACKEND_IMAGE=%REGISTRY%/%PROJECT%/cornell-notes-backend:%VERSION%
set FRONTEND_IMAGE=%REGISTRY%/%PROJECT%/cornell-notes-frontend:%VERSION%

echo ========================================
echo 康奈尔笔记 Docker 镜像推送
echo ========================================
echo.

REM 登录到镜像仓库
echo 登录到 %REGISTRY%...
docker login %REGISTRY%
if %errorlevel% neq 0 (
    echo 登录失败
    exit /b 1
)

REM 推送后端镜像
echo.
echo [1/2] 推送后端镜像...
docker push %BACKEND_IMAGE%
if %errorlevel% neq 0 (
    echo 后端镜像推送失败
    exit /b 1
)
echo ✓ 后端镜像推送成功: %BACKEND_IMAGE%

REM 推送前端镜像
echo.
echo [2/2] 推送前端镜像...
docker push %FRONTEND_IMAGE%
if %errorlevel% neq 0 (
    echo 前端镜像推送失败
    exit /b 1
)
echo ✓ 前端镜像推送成功: %FRONTEND_IMAGE%

echo.
echo ========================================
echo 镜像推送完成！
echo ========================================
echo.
echo 后端镜像: %BACKEND_IMAGE%
echo 前端镜像: %FRONTEND_IMAGE%
echo.
echo 提示: 可以使用 docker-compose 部署应用

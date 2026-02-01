@echo off
chcp 65001 >nul
echo ========================================
echo   康奈尔笔记应用 - 前端启动脚本
echo ========================================
echo.

cd /d "%~dp0..\.."
cd frontend

echo [1/3] 检查 pnpm...
where pnpm >nul 2>&1
if errorlevel 1 (
    echo    错误: 未找到 pnpm，请先安装 pnpm
    echo    安装命令: npm install -g pnpm
    pause
    exit /b 1
)

echo [2/3] 安装/更新依赖...
if not exist "node_modules\" (
    echo    首次安装依赖，可能需要几分钟...
    pnpm install
) else (
    echo    依赖已存在，跳过安装
)

echo [3/3] 启动前端服务...
echo.
echo ========================================
echo   前端服务启动中...
echo ========================================
echo   Web 应用:  http://localhost:3000
echo ========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

pnpm dev:web

pause

@echo off
chcp 65001 >nul
echo ========================================
echo   康奈尔笔记应用 - 后端启动脚本
echo ========================================
echo.

cd /d "%~dp0..\.."
cd backend

echo [1/4] 检查虚拟环境...
if not exist ".venv\" (
    echo    创建虚拟环境...
    python -m venv .venv
    if errorlevel 1 (
        echo    错误: 虚拟环境创建失败
        pause
        exit /b 1
    )
)

echo [2/4] 激活虚拟环境...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo    错误: 虚拟环境激活失败
    pause
    exit /b 1
)

echo [3/4] 安装/更新依赖...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo    警告: 部分依赖安装失败，尝试继续...
)

echo [4/4] 启动后端服务...
echo.
echo ========================================
echo   后端服务启动成功！
echo ========================================
echo   API 服务:  http://localhost:8000
echo   API 文档:  http://localhost:8000/docs
echo   健康检查:  http://localhost:8000/health
echo ========================================
echo.
echo 按 Ctrl+C 停止服务
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause

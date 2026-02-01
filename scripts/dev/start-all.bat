@echo off
chcp 65001 >nul
echo ========================================
echo   康奈尔笔记应用 - 一键启动
echo ========================================
echo.
echo 此脚本将在两个新窗口中分别启动后端和前端服务
echo.
echo 启动后：
echo   - 后端 API:  http://localhost:8000
echo   - 前端应用:  http://localhost:3000
echo   - API 文档:  http://localhost:8000/docs
echo.
pause

echo 启动后端服务...
start "康奈尔笔记 - 后端" cmd /k "%~dp0start-backend.bat"

timeout /t 3 /nobreak >nul

echo 启动前端服务...
start "康奈尔笔记 - 前端" cmd /k "%~dp0start-frontend.bat"

echo.
echo ========================================
echo   启动完成！
echo ========================================
echo   已在新窗口中启动前后端服务
echo   关闭服务窗口即可停止服务
echo ========================================
echo.
pause

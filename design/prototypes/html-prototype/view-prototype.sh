#!/bin/bash

# 康奈尔笔记应用 - HTML 原型查看脚本

echo "=================================="
echo "康奈尔笔记应用 - HTML 原型预览"
echo "=================================="
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HTML_DIR="$SCRIPT_DIR/pages"

echo "📂 原型文件目录: $HTML_DIR"
echo ""

# 检查文件是否存在
echo "✅ 检查文件..."
if [ -f "$HTML_DIR/index.html" ]; then
    echo "  ✓ 首页 (index.html)"
else
    echo "  ✗ 首页未找到"
fi

if [ -f "$HTML_DIR/note-editor.html" ]; then
    echo "  ✓ 笔记编辑页 (note-editor.html)"
else
    echo "  ✗ 笔记编辑页未找到"
fi

echo ""
echo "🚀 选择要查看的页面:"
echo "  1) 首页 (index.html)"
echo "  2) 笔记编辑页 (note-editor.html)"
echo "  3) 复习页面 (review.html)"
echo "  4) 个人中心 (profile.html)"
echo "  5) 启动本地服务器（所有页面）"
echo "  q) 退出"
echo ""

read -p "请输入选项 [1-5/q]: " choice

case $choice in
    1)
        echo "正在打开首页..."
        if command -v open &> /dev/null; then
            open "$HTML_DIR/index.html"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$HTML_DIR/index.html"
        else
            echo "请手动打开: $HTML_DIR/index.html"
        fi
        ;;
    2)
        echo "正在打开笔记编辑页..."
        if command -v open &> /dev/null; then
            open "$HTML_DIR/note-editor.html"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$HTML_DIR/note-editor.html"
        else
            echo "请手动打开: $HTML_DIR/note-editor.html"
        fi
        ;;
    3)
        echo "正在打开复习页面..."
        if command -v open &> /dev/null; then
            open "$HTML_DIR/review.html"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$HTML_DIR/review.html"
        else
            echo "请手动打开: $HTML_DIR/review.html"
        fi
        ;;
    4)
        echo "正在打开个人中心..."
        if command -v open &> /dev/null; then
            open "$HTML_DIR/profile.html"
        elif command -v xdg-open &> /dev/null; then
            xdg-open "$HTML_DIR/profile.html"
        else
            echo "请手动打开: $HTML_DIR/profile.html"
        fi
        ;;
    5)
        echo "正在启动本地服务器..."
        echo "访问地址: http://localhost:8080/pages/"
        echo "按 Ctrl+C 停止服务器"
        echo ""
        cd "$SCRIPT_DIR" && python3 -m http.server 8080
        ;;
    q|Q)
        echo "退出"
        exit 0
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

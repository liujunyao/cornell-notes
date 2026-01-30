# 康奈尔笔记 - 后端服务

基于 FastAPI 的后端 API 服务。

## 目录结构

```
backend/
├── app/                    # 应用程序主目录
│   ├── api/               # API 路由
│   │   ├── deps.py       # 依赖注入
│   │   └── v1/           # API v1 版本
│   │       ├── endpoints/ # 端点实现
│   │       └── schemas/  # Pydantic 模型
│   ├── core/             # 核心配置
│   │   ├── config.py     # 配置管理
│   │   └── security.py   # 安全相关
│   ├── models/           # SQLAlchemy 模型
│   ├── services/         # 业务逻辑层
│   └── utils/            # 工具函数
├── tests/                # 测试代码
└── scripts/              # 脚本工具
```

## 开发环境设置

### 1. 创建虚拟环境

```bash
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 运行开发服务器

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 测试

```bash
# 运行所有测试
pytest

# 运行测试并生成覆盖率报告
pytest --cov=app --cov-report=html

# 运行特定测试文件
pytest tests/test_api.py
```

## 代码质量

```bash
# 代码格式化
black app/ tests/

# 代码检查
ruff check app/ tests/

# 类型检查
mypy app/
```

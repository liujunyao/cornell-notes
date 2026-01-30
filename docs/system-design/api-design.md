# 康奈尔笔记应用 - API 设计规范

本文档定义康奈尔笔记应用的 RESTful API 设计规范、端点集合、认证方案和错误处理规范。

## 一、API 基础信息

### 1.1 基本配置

```
基础 URL: http://localhost:8000/api/v1  (开发环境)
          https://api.cornellnotes.com/api/v1  (生产环境)

版本控制: v1
协议: HTTP/HTTPS
数据格式: JSON
字符编码: UTF-8
时区: UTC
```

### 1.2 请求头规范

```
必需：
  Content-Type: application/json
  Accept: application/json

认证相关：
  Authorization: Bearer <JWT_TOKEN>

可选：
  X-Request-ID: <UUID>  (用于追踪请求)
  Accept-Language: zh-CN | en-US
```

### 1.3 响应格式规范

```json
{
  "code": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-01-20T10:30:00Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 二、认证与授权

### 2.1 JWT 认证流程

```
1. 用户登录
   POST /auth/login
   ├─ 验证用户名/密码
   ├─ 生成 JWT Token
   └─ 返回 access_token + refresh_token

2. 请求需要认证的 API
   Header: Authorization: Bearer <access_token>
   ├─ 中间件验证 Token 有效性
   ├─ 提取 Token 中的 user_id
   └─ 继续处理请求

3. Token 过期处理
   POST /auth/refresh
   ├─ 使用 refresh_token 获取新 access_token
   └─ 返回新的 token 对

4. 登出
   POST /auth/logout
   ├─ 将 Token 加入黑名单
   └─ 清除 refresh_token
```

### 2.2 Token 格式

```
Access Token:
  - 类型: JWT (HS256)
  - 有效期: 30分钟
  - Payload:
    {
      "sub": "user_id",
      "username": "john_doe",
      "user_type": "student",
      "iat": 1674046800,
      "exp": 1674048600
    }

Refresh Token:
  - 类型: JWT
  - 有效期: 7天
  - 存储位置: HttpOnly Cookie
```

### 2.3 权限控制

```
权限矩阵：
┌──────────────────┬────────────┬────────┬────────┬─────────┐
│ 操作             │ 自己笔记   │ 共享笔记 │ 教师角色 │ 管理员  │
├──────────────────┼────────────┼────────┼────────┼─────────┤
│ 创建笔记         │ ✓          │ ✗      │ ✓      │ ✓       │
│ 编辑笔记         │ ✓          │ 条件✓  │ ✓      │ ✓       │
│ 删除笔记         │ ✓          │ ✗      │ ✗      │ ✓       │
│ 查看笔记         │ ✓          │ ✓      │ ✓      │ ✓       │
│ 分享笔记         │ ✓          │ ✗      │ ✓      │ ✓       │
│ 批注笔记         │ ✓          │ ✓      │ ✓      │ ✓       │
│ 查看复习计划     │ ✓          │ ✗      │ ✓*     │ ✓       │
│ 创建班级         │ ✗          │ ✗      │ ✓      │ ✓       │
│ 管理班级学生     │ ✗          │ ✗      │ ✓      │ ✓       │
└──────────────────┴────────────┴────────┴────────┴─────────┘

条件✓: 只能编辑自己的批注，不能修改原笔记
✓*: 教师可查看其班级学生的复习进度
```

---

## 三、核心 API 端点

### 3.1 认证相关

#### 用户注册
```http
POST /auth/register

Request:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe",
  "user_type": "student",
  "phone": "13800000000"
}

Response (201 Created):
{
  "code": 201,
  "message": "User registered successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "john_doe",
    "email": "john@example.com",
    "user_type": "student",
    "created_at": "2024-01-20T10:30:00Z"
  }
}

Errors:
  - 409: 用户名/邮箱已存在
  - 400: 密码不符合要求
  - 422: 参数验证失败
```

#### 用户登录
```http
POST /auth/login

Request:
{
  "username": "john_doe",
  "password": "SecurePassword123!"
}

Response (200):
{
  "code": 200,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "john_doe",
      "user_type": "student"
    },
    "expires_in": 1800
  }
}

Errors:
  - 401: 用户名或密码错误
  - 403: 账号被禁用
```

#### 刷新令牌
```http
POST /auth/refresh

Request:
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200):
{
  "code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 1800
  }
}

Errors:
  - 401: Refresh token 已过期或无效
```

---

### 3.2 笔记相关

#### 获取笔记列表
```http
GET /notes?notebook_id=xxx&page=1&page_size=20&sort=-updated_at

Query Parameters:
  notebook_id: 笔记本 ID (可选，不指定则返回所有笔记)
  page: 页码，默认 1
  page_size: 每页数量，默认 20，最大 100
  sort: 排序字段 (updated_at|created_at|title)，-表示倒序
  is_starred: 是否仅返回星标笔记 (true|false)
  search: 搜索关键词 (可选)

Response (200):
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "康奈尔笔记法介绍",
        "notebook_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "owner_id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        "is_starred": true,
        "word_count": 2450,
        "created_at": "2024-01-20T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z"
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "page_size": 20,
      "total_pages": 8
    }
  }
}
```

#### 创建笔记
```http
POST /notes

Request:
{
  "notebook_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "title": "新笔记",
  "access_level": "private"
}

Response (201 Created):
{
  "code": 201,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "新笔记",
    "notebook_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "created_at": "2024-01-20T15:00:00Z"
  }
}
```

#### 获取笔记详情
```http
GET /notes/{note_id}

Path Parameters:
  note_id: 笔记 ID

Response (200):
{
  "code": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "康奈尔笔记法介绍",
    "notebook_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "content": {
      "cue_column": "什么是康奈尔笔记法？",
      "note_column": "康奈尔笔记法是...",
      "summary_row": "核心提炼：..."
    },
    "highlights": [
      {
        "id": "7ce9141c-7d8e-4035-929c-7d20e3fbfef1",
        "content": "康奈尔笔记法",
        "highlight_type": "core_knowledge",
        "color_code": "#FFFF00"
      }
    ],
    "is_starred": true,
    "access_level": "private",
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  }
}

Errors:
  - 404: 笔记不存在
  - 403: 无权访问该笔记
```

#### 更新笔记内容
```http
PUT /notes/{note_id}

Request:
{
  "title": "更新后的标题",
  "content": {
    "cue_column": "更新的关键词",
    "note_column": "更新的笔记内容",
    "summary_row": "更新的总结"
  }
}

Response (200):
{
  "code": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "updated_at": "2024-01-20T15:30:00Z"
  }
}
```

#### 删除笔记
```http
DELETE /notes/{note_id}

Response (204 No Content)

Errors:
  - 404: 笔记不存在
  - 403: 无权删除该笔记
```

---

### 3.3 高亮相关

#### 创建高亮
```http
POST /notes/{note_id}/highlights

Request:
{
  "content": "康奈尔笔记法",
  "highlight_type": "core_knowledge",
  "section": "cue",
  "start_position": 0,
  "end_position": 8
}

Response (201 Created):
{
  "code": 201,
  "data": {
    "id": "7ce9141c-7d8e-4035-929c-7d20e3fbfef1",
    "content": "康奈尔笔记法",
    "highlight_type": "core_knowledge",
    "color_code": "#FFFF00",
    "created_at": "2024-01-20T15:30:00Z"
  }
}
```

#### 更新高亮
```http
PUT /highlights/{highlight_id}

Request:
{
  "highlight_type": "problem"
}

Response (200):
{
  "code": 200,
  "data": {
    "id": "7ce9141c-7d8e-4035-929c-7d20e3fbfef1",
    "highlight_type": "problem",
    "color_code": "#FF9900"
  }
}
```

#### 删除高亮
```http
DELETE /highlights/{highlight_id}

Response (204 No Content)
```

---

### 3.4 复习相关

#### 获取复习计划
```http
GET /reviews/schedule?date=2024-01-20&status=pending

Query Parameters:
  date: 查询日期 (YYYY-MM-DD)，默认今天
  status: pending|completed|skipped，默认 pending

Response (200):
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "8de9141c-7d8e-4035-929c-7d20e3fbfef1",
        "note_id": "550e8400-e29b-41d4-a716-446655440000",
        "note_title": "康奈尔笔记法介绍",
        "scheduled_date": "2024-01-20",
        "review_level": 2,
        "status": "pending",
        "estimated_minutes": 15
      }
    ],
    "total_count": 5
  }
}
```

#### 获取复习详情
```http
GET /reviews/{schedule_id}

Response (200):
{
  "code": 200,
  "data": {
    "id": "8de9141c-7d8e-4035-929c-7d20e3fbfef1",
    "note": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "康奈尔笔记法介绍",
      "content": { ... }
    },
    "review_level": 2,
    "previous_records": [
      {
        "id": "9ef0252d-8e9f-5146-a0d1-8e31f4gcgf92",
        "completed_at": "2024-01-13T10:30:00Z",
        "accuracy_rate": 0.85,
        "time_spent_seconds": 900
      }
    ]
  }
}
```

#### 提交复习记录
```http
POST /reviews/{schedule_id}/submit

Request:
{
  "review_mode": "basic",
  "time_spent_seconds": 1245,
  "responses": [
    {
      "line_number": 1,
      "user_answer": "用户的答案"
    }
  ],
  "marked_weak_points": [1, 3, 5],
  "is_mastered": true
}

Response (201 Created):
{
  "code": 201,
  "data": {
    "id": "9ef0252d-8e9f-5146-a0d1-8e31f4gcgf92",
    "accuracy_rate": 0.92,
    "accuracy_score": 9.2,
    "next_review_date": "2024-02-03",
    "is_mastered": true,
    "report": {
      "total_questions": 10,
      "correct_answers": 9,
      "weak_points": [1, 3],
      "ai_feedback": "很好的复习表现，第1题和第3题需要加强..."
    }
  }
}

Errors:
  - 404: 复习计划不存在
  - 400: 复习模式不支持
```

#### AI 生成复习问题
```http
POST /notes/{note_id}/ai/generate-questions

Request:
{
  "question_count": 5,
  "difficulty": "medium"
}

Response (200):
{
  "code": 200,
  "data": {
    "questions": [
      {
        "question": "什么是康奈尔笔记法的5R流程？",
        "expected_answer": "5R流程是Record, Reduce, Recite, Reflect, Review"
      }
    ]
  }
}
```

---

### 3.5 协作相关

#### 创建协作小组
```http
POST /notes/{note_id}/collaboration

Request:
{
  "group_name": "小组1",
  "description": "和朋友们一起编辑笔记",
  "max_members": 10
}

Response (201 Created):
{
  "code": 201,
  "data": {
    "id": "9ef0252d-8e9f-5146-a0d1-8e31f4gcgf92",
    "group_name": "小组1",
    "invite_code": "a3k9mL2pQ8xN",
    "invite_url": "https://cornellnotes.com/invite/a3k9mL2pQ8xN",
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

#### 加入协作小组
```http
POST /collaboration/join

Request:
{
  "invite_code": "a3k9mL2pQ8xN"
}

Response (200):
{
  "code": 200,
  "data": {
    "group_id": "9ef0252d-8e9f-5146-a0d1-8e31f4gcgf92",
    "note_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}

Errors:
  - 404: 邀请码无效
  - 409: 已加入该小组
  - 410: 邀请已过期
```

#### 获取小组成员
```http
GET /collaboration/{group_id}/members

Response (200):
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
        "username": "john_doe",
        "role": "owner",
        "color_code": "#3A6EA5",
        "joined_at": "2024-01-20T15:00:00Z"
      }
    ]
  }
}
```

#### 实时编辑同步（WebSocket）
```javascript
// 客户端连接 WebSocket
ws://localhost:8000/api/v1/notes/{note_id}/ws?token=JWT_TOKEN

// 发送编辑事件
{
  "type": "edit",
  "section": "note_column",
  "changes": [
    {
      "type": "insert",
      "position": 100,
      "content": "新增内容"
    }
  ]
}

// 接收其他成员的编辑事件
{
  "type": "edit",
  "user_id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  "username": "john_doe",
  "changes": [ ... ]
}
```

---

### 3.6 分享相关

#### 创建分享链接
```http
POST /notes/{note_id}/share

Request:
{
  "access_level": "view",
  "expires_in_days": 7
}

Response (201 Created):
{
  "code": 201,
  "data": {
    "id": "afe1363c-9e9f-6257-b1e2-9f42g5hdgh03",
    "share_token": "a3k9mL2pQ8xN7vJ5tY6bR4cF8gH2jK1w",
    "share_url": "https://cornellnotes.com/share/a3k9mL2pQ8xN7vJ5tY6bR4cF8gH2jK1w",
    "access_level": "view",
    "expires_at": "2024-01-27T16:00:00Z",
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

#### 访问分享的笔记
```http
GET /share/{share_token}

Response (200):
{
  "code": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "康奈尔笔记法介绍",
    "owner": {
      "username": "john_doe",
      "avatar_url": "https://..."
    },
    "content": { ... }
  }
}

Errors:
  - 404: 分享链接不存在或已过期
  - 403: 分享链接已禁用
```

---

### 3.7 导出相关

#### 请求导出
```http
POST /notes/{note_id}/export

Request:
{
  "format": "pdf|word|image|mindmap",
  "options": {
    "include_highlights": true,
    "include_annotations": true,
    "include_review_history": false
  }
}

Response (202 Accepted):
{
  "code": 202,
  "data": {
    "export_id": "bge2474d-af0g-7368-c2f3-ag53h6ihhi14",
    "status": "processing",
    "format": "pdf",
    "estimated_seconds": 30
  }
}
```

#### 获取导出状态
```http
GET /exports/{export_id}

Response (200):
{
  "code": 200,
  "data": {
    "export_id": "bge2474d-af0g-7368-c2f3-ag53h6ihhi14",
    "status": "completed",
    "download_url": "https://downloads.cornellnotes.com/...",
    "expires_at": "2024-01-22T16:00:00Z",
    "file_size": 2048576
  }
}
```

---

## 四、错误处理规范

### 4.1 HTTP 状态码

```
2xx Success:
  200 OK                - 成功的 GET/PUT 请求
  201 Created           - 成功创建资源
  202 Accepted          - 异步请求已接受
  204 No Content        - 成功删除

4xx Client Error:
  400 Bad Request       - 请求参数错误
  401 Unauthorized      - 未授权（缺少 Token）
  403 Forbidden         - 禁止访问
  404 Not Found         - 资源不存在
  409 Conflict          - 资源冲突（如用户名已存在）
  422 Unprocessable     - 参数验证失败
  429 Too Many Requests - 请求过于频繁

5xx Server Error:
  500 Internal Error    - 服务器错误
  503 Unavailable       - 服务暂停
```

### 4.2 错误响应格式

```json
{
  "code": 400,
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "title",
      "message": "Title must be between 1 and 300 characters"
    },
    {
      "field": "notebook_id",
      "message": "Notebook not found"
    }
  ],
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 4.3 常见错误码

| 错误码 | 消息 | 描述 |
|--------|------|------|
| 10001 | Authentication Failed | 认证失败 |
| 10002 | Token Expired | Token 已过期 |
| 10003 | Permission Denied | 权限不足 |
| 20001 | Note Not Found | 笔记不存在 |
| 20002 | Notebook Not Found | 笔记本不存在 |
| 20003 | Invalid Access Level | 无效的访问级别 |
| 30001 | Review Schedule Not Found | 复习计划不存在 |
| 40001 | Collaboration Group Not Found | 小组不存在 |

---

## 五、速率限制

### 5.1 限流规则

```
免费用户：
  - 100 请求/小时
  - 10 请求/秒（突增允许20个请求）

付费用户：
  - 1000 请求/小时
  - 100 请求/秒

教师用户：
  - 不受限制
```

### 5.2 限流响应头

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1674046800
```

---

## 六、分页规范

### 6.1 分页参数

```
page: 页码（默认1）
page_size: 每页数量（默认20，最大100）

Response 中的 pagination 字段：
{
  "total": 150,        // 总记录数
  "page": 1,           // 当前页
  "page_size": 20,     // 每页数量
  "total_pages": 8     // 总页数
}
```

### 6.2 游标分页（可选）

```
GET /notes?cursor=abc123&limit=20

适用于大数据集和实时数据流
```

---

## 七、版本管理与废弃策略

```
版本号：/api/v1, /api/v2, ...

废弃流程：
1. 发布新版本，旧版本进入 Deprecated 状态（1个月）
2. 发送通知给所有开发者
3. 1个月后停用旧版本
4. 3个月后删除旧版本的代码
```

---

## 八、API 文档生成

本 API 使用 OpenAPI 3.0 规范文档，可通过以下方式访问：

```
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
OpenAPI JSON: http://localhost:8000/openapi.json
```

---

**最后更新**: 2024-01-29
**版本**: 1.0
**维护者**: 后端团队

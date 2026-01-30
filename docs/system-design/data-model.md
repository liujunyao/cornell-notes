# 康奈尔笔记应用 - 数据模型设计

本文档定义康奈尔笔记应用的核心数据结构、表关系和存储设计。

## 一、核心实体与关系

### 1.1 用户模型（User）

```
┌─────────────────────────────────────┐
│ users                               │
├─────────────────────────────────────┤
│ id: UUID (PK)                       │
│ username: String(50) UNIQUE NOT NULL│
│ email: String(255) UNIQUE NOT NULL  │
│ password_hash: String NOT NULL      │
│ full_name: String(100)              │
│ avatar_url: String(500)             │
│ user_type: Enum('student','teacher',│
│            'parent','admin')         │
│ bio: Text                           │
│ phone: String(20)                   │
│ location: String(100)               │
│ verified: Boolean DEFAULT False     │
│ is_active: Boolean DEFAULT True     │
│ created_at: DateTime DEFAULT now()  │
│ updated_at: DateTime DEFAULT now()  │
│ last_login: DateTime                │
└─────────────────────────────────────┘
```

**索引**:
- `idx_username`: 用户名查询
- `idx_email`: 邮箱查询
- `idx_user_type`: 用户类型过滤

**约束**:
- username: 3-50字符，仅含字母/数字/下划线
- email: 有效的邮箱格式
- password_hash: bcrypt 256字符

---

### 1.2 笔记本模型（Notebook）

```
┌─────────────────────────────────────┐
│ notebooks                           │
├─────────────────────────────────────┤
│ id: UUID (PK)                       │
│ owner_id: UUID (FK) NOT NULL        │
│ title: String(200) NOT NULL         │
│ description: Text                   │
│ color: String(7) DEFAULT '#3A6EA5' │
│ icon: String(100)                   │
│ is_archived: Boolean DEFAULT False  │
│ is_public: Boolean DEFAULT False    │
│ created_at: DateTime DEFAULT now()  │
│ updated_at: DateTime DEFAULT now()  │
│ deleted_at: DateTime (软删除)        │
└─────────────────────────────────────┘

Foreign Key:
  owner_id → users.id (ON DELETE CASCADE)
```

**索引**:
- `idx_owner_id`: 用户笔记本查询
- `idx_created_at`: 时间排序
- `idx_is_archived`: 归档过滤

**特殊字段说明**:
- `color`: 16进制颜色值，对应设计系统色板
- `is_public`: 控制笔记本是否可公开分享
- `deleted_at`: 支持软删除，30天后自动清理

---

### 1.3 笔记模型（CornellNote）- 核心

```
┌─────────────────────────────────────────────┐
│ cornell_notes                               │
├─────────────────────────────────────────────┤
│ id: UUID (PK)                               │
│ notebook_id: UUID (FK) NOT NULL             │
│ owner_id: UUID (FK) NOT NULL                │
│ title: String(300) NOT NULL                 │
│ created_at: DateTime DEFAULT now()          │
│ updated_at: DateTime DEFAULT now()          │
│ last_edited_by: UUID (FK)                   │
│ is_archived: Boolean DEFAULT False          │
│ is_starred: Boolean DEFAULT False           │
│ access_level: Enum('private','shared',      │
│               'public') DEFAULT 'private'   │
│ view_count: Integer DEFAULT 0               │
│ deleted_at: DateTime (软删除)                │
│ ai_generated_at: DateTime                   │
│ word_count: Integer DEFAULT 0               │
│ estimated_review_minutes: Integer           │
└─────────────────────────────────────────────┘

Foreign Keys:
  notebook_id → notebooks.id (ON DELETE CASCADE)
  owner_id → users.id (ON DELETE CASCADE)
  last_edited_by → users.id (ON DELETE SET NULL)
```

**索引**:
- `idx_notebook_id`: 笔记本内笔记查询
- `idx_owner_id`: 用户笔记查询
- `idx_updated_at`: 最新优先排序
- `idx_is_starred`: 星标笔记快速查询
- `composite_idx_notebook_owner`: 笔记本内的用户笔记

**特殊字段说明**:
- `access_level`: private (仅本人)、shared (小组成员)、public (所有人)
- `ai_generated_at`: 追踪AI生成操作时间，用于AI功能审计
- `estimated_review_minutes`: 根据内容长度估计的复习时间

---

### 1.4 笔记内容模型（NoteContent）- 三分栏内容

```
┌──────────────────────────────────────────┐
│ note_contents                            │
├──────────────────────────────────────────┤
│ id: UUID (PK)                            │
│ note_id: UUID (FK) NOT NULL UNIQUE       │
│ cue_column: Text                         │
│ note_column: Text (Rich Text)            │
│ summary_row: Text                        │
│ version: Integer DEFAULT 1               │
│ created_at: DateTime DEFAULT now()       │
│ updated_at: DateTime DEFAULT now()       │
│ is_synced: Boolean DEFAULT True          │
│ sync_error: String                       │
└──────────────────────────────────────────┘

Foreign Key:
  note_id → cornell_notes.id (ON DELETE CASCADE)
```

**特殊字段说明**:
- `cue_column`: 关键词和问题，纯文本格式
- `note_column`: 富文本内容（支持Markdown + 自定义扩展）
- `summary_row`: 总结区内容，支持两列（核心提炼|待解决问题）
- `version`: 版本号，用于实时协作冲突检测
- `is_synced`: 同步状态标志，用于离线编辑支持

---

### 1.5 高亮信息模型（Highlight）

```
┌───────────────────────────────────────────┐
│ highlights                                │
├───────────────────────────────────────────┤
│ id: UUID (PK)                             │
│ note_id: UUID (FK) NOT NULL               │
│ content: String NOT NULL                  │
│ highlight_type: Enum(                     │
│   'core_knowledge',                       │
│   'problem',                              │
│   'case',                                 │
│   'reflection',                           │
│   'warning'                               │
│ ) NOT NULL                                │
│ color_code: String(7)                     │
│ start_position: Integer NOT NULL          │
│ end_position: Integer NOT NULL            │
│ section: Enum('cue','note','summary')     │
│ created_at: DateTime DEFAULT now()        │
│ created_by: UUID (FK) NOT NULL            │
│ is_ai_generated: Boolean DEFAULT False    │
│ ai_confidence: Float                      │
│ note_index: Integer                       │
└───────────────────────────────────────────┘

Foreign Keys:
  note_id → cornell_notes.id (ON DELETE CASCADE)
  created_by → users.id (ON DELETE SET NULL)
```

**索引**:
- `idx_note_id`: 笔记高亮查询
- `idx_highlight_type`: 类型过滤
- `composite_idx_note_section`: 按区域查询高亮

**颜色映射表**:
```
core_knowledge:  #FFFF00 (黄色)
problem:         #FF9900 (橙色)
case:            #00FF99 (青色)
reflection:      #9900FF (紫色)
warning:         #FF3333 (红色)
```

---

### 1.6 复习计划模型（ReviewSchedule）

```
┌────────────────────────────────────────────┐
│ review_schedules                           │
├────────────────────────────────────────────┤
│ id: UUID (PK)                              │
│ note_id: UUID (FK) NOT NULL                │
│ user_id: UUID (FK) NOT NULL                │
│ scheduled_date: Date NOT NULL              │
│ scheduled_time: Time DEFAULT '09:00:00'    │
│ review_level: Integer DEFAULT 1            │
│ status: Enum('pending','completed',        │
│         'skipped') DEFAULT 'pending'       │
│ completed_at: DateTime                     │
│ is_mastered: Boolean DEFAULT False         │
│ accuracy_rate: Float                       │
│ time_spent_seconds: Integer                │
│ weak_points: Text (JSON Array)             │
│ created_at: DateTime DEFAULT now()         │
│ updated_at: DateTime DEFAULT now()         │
│ next_review_date: Date                     │
│ ebbinghaus_interval: Integer               │
└────────────────────────────────────────────┘

Foreign Keys:
  note_id → cornell_notes.id (ON DELETE CASCADE)
  user_id → users.id (ON DELETE CASCADE)
```

**索引**:
- `idx_user_scheduled_date`: 用户的待复习笔记查询
- `idx_note_id`: 笔记的复习历史
- `idx_status_scheduled_date`: 待复习笔记的快速查询
- `composite_idx_user_date_status`: 用户在指定日期的复习任务

**艾宾浩斯间隔表**:
```
level 1: 当天（1日）
level 2: 2日后
level 3: 7日后
level 4: 15日后
level 5: 30日后

根据是_mastered状态：
- True: 延长下一个间隔
- False: 重置为level 1，加入明日待复习
```

---

### 1.7 复习记录模型（ReviewRecord）

```
┌────────────────────────────────────────────┐
│ review_records                             │
├────────────────────────────────────────────┤
│ id: UUID (PK)                              │
│ review_schedule_id: UUID (FK) NOT NULL     │
│ user_id: UUID (FK) NOT NULL                │
│ note_id: UUID (FK) NOT NULL                │
│ review_mode: Enum('basic','advanced',      │
│              'high_level') NOT NULL        │
│ started_at: DateTime NOT NULL              │
│ completed_at: DateTime                     │
│ time_spent_seconds: Integer                │
│ responses: JSON                            │
│ accuracy_score: Float                      │
│ marked_weak_points: Text (JSON Array)      │
│ ai_feedback: Text                          │
│ is_mastered: Boolean                       │
│ created_at: DateTime DEFAULT now()         │
└────────────────────────────────────────────┘

Foreign Keys:
  review_schedule_id → review_schedules.id
  user_id → users.id (ON DELETE CASCADE)
  note_id → cornell_notes.id (ON DELETE CASCADE)
```

**responses JSON 结构**:
```json
{
  "mode": "basic|advanced|high_level",
  "answers": [
    {
      "line_number": 1,
      "user_answer": "用户回答内容",
      "expected_answer": "预期答案",
      "is_correct": true,
      "similarity_score": 0.92
    }
  ]
}
```

---

### 1.8 媒体文件模型（MediaFile）

```
┌──────────────────────────────────────────┐
│ media_files                              │
├──────────────────────────────────────────┤
│ id: UUID (PK)                            │
│ note_id: UUID (FK) NOT NULL              │
│ uploaded_by: UUID (FK) NOT NULL          │
│ file_type: Enum('image','video','audio', │
│            'pdf','formula')              │
│ file_name: String(255) NOT NULL          │
│ file_size: Integer NOT NULL              │
│ file_url: String(1000) NOT NULL          │
│ thumbnail_url: String(1000)              │
│ duration_seconds: Integer                │
│ metadata: JSON                           │
│ created_at: DateTime DEFAULT now()       │
└──────────────────────────────────────────┘

Foreign Keys:
  note_id → cornell_notes.id (ON DELETE CASCADE)
  uploaded_by → users.id (ON DELETE SET NULL)
```

**metadata 字段结构**:
```json
{
  "image": {
    "width": 1920,
    "height": 1080,
    "format": "png|jpg|webp"
  },
  "video": {
    "duration": 120,
    "codec": "h264|vp9",
    "resolution": "1080p"
  },
  "audio": {
    "duration": 300,
    "codec": "aac|mp3",
    "sample_rate": 44100
  }
}
```

---

### 1.9 协作小组模型（CollaborationGroup）

```
┌─────────────────────────────────────────┐
│ collaboration_groups                    │
├─────────────────────────────────────────┤
│ id: UUID (PK)                           │
│ note_id: UUID (FK) NOT NULL             │
│ created_by: UUID (FK) NOT NULL          │
│ group_name: String(100) NOT NULL        │
│ description: Text                       │
│ invite_code: String(16) UNIQUE          │
│ max_members: Integer DEFAULT 10         │
│ created_at: DateTime DEFAULT now()      │
│ expires_at: DateTime                    │
└─────────────────────────────────────────┘

Foreign Keys:
  note_id → cornell_notes.id (ON DELETE CASCADE)
  created_by → users.id (ON DELETE CASCADE)
```

---

### 1.10 小组成员模型（GroupMember）

```
┌────────────────────────────────────────┐
│ group_members                          │
├────────────────────────────────────────┤
│ id: UUID (PK)                          │
│ group_id: UUID (FK) NOT NULL           │
│ user_id: UUID (FK) NOT NULL            │
│ role: Enum('owner','editor','viewer')  │
│       DEFAULT 'viewer'                 │
│ joined_at: DateTime DEFAULT now()      │
│ color_code: String(7)                  │
│ last_edited_at: DateTime               │
└────────────────────────────────────────┘

Foreign Keys:
  group_id → collaboration_groups.id
    (ON DELETE CASCADE)
  user_id → users.id (ON DELETE CASCADE)

Unique: (group_id, user_id)
```

---

### 1.11 评论和批注模型（Annotation）

```
┌────────────────────────────────────────┐
│ annotations                            │
├────────────────────────────────────────┤
│ id: UUID (PK)                          │
│ note_id: UUID (FK) NOT NULL            │
│ created_by: UUID (FK) NOT NULL         │
│ content: Text NOT NULL                 │
│ target_text: String(500)               │
│ start_position: Integer                │
│ end_position: Integer                  │
│ annotation_type: Enum('comment',       │
│   'suggestion','question') NOT NULL    │
│ is_resolved: Boolean DEFAULT False     │
│ resolved_by: UUID (FK)                 │
│ resolved_at: DateTime                  │
│ created_at: DateTime DEFAULT now()     │
│ updated_at: DateTime DEFAULT now()     │
└────────────────────────────────────────┘

Foreign Keys:
  note_id → cornell_notes.id (ON DELETE CASCADE)
  created_by → users.id (ON DELETE SET NULL)
  resolved_by → users.id (ON DELETE SET NULL)
```

---

### 1.12 分享链接模型（ShareLink）

```
┌────────────────────────────────────────┐
│ share_links                            │
├────────────────────────────────────────┤
│ id: UUID (PK)                          │
│ note_id: UUID (FK) NOT NULL            │
│ created_by: UUID (FK) NOT NULL         │
│ share_token: String(64) UNIQUE         │
│ access_level: Enum('view','edit',      │
│              'admin')                  │
│ is_active: Boolean DEFAULT True        │
│ expires_at: DateTime                   │
│ max_uses: Integer                      │
│ use_count: Integer DEFAULT 0           │
│ created_at: DateTime DEFAULT now()     │
│ updated_at: DateTime DEFAULT now()     │
└────────────────────────────────────────┘

Foreign Keys:
  note_id → cornell_notes.id (ON DELETE CASCADE)
  created_by → users.id (ON DELETE SET NULL)
```

**share_token 生成**:
- 使用 URL-safe Base64 编码的随机32字节数据
- 示例: `a3k9mL2pQ8xN7vJ5tY6bR4cF8gH2jK1w`

---

## 二、数据库约束与规范

### 2.1 全局约束

```sql
-- 软删除查询
WHERE deleted_at IS NULL

-- 时间戳自动更新
DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

-- UUID 生成
DEFAULT UUID()

-- 关键字段非空
NOT NULL 约束应用于业务关键字段
```

### 2.2 数据一致性规则

| 操作 | 约束 |
|------|------|
| 删除笔记本 | 级联删除其中所有笔记及关联数据 |
| 删除笔记 | 级联删除高亮、复习计划、媒体、评论 |
| 删除用户 | 用户笔记转移至备份账号或标记孤立 |
| 用户禁用 | 其分享的笔记变为不可访问 |
| 复习标记完成 | 自动生成下一个复习计划 |

### 2.3 字段长度规范

| 字段类型 | 长度 | 说明 |
|---------|------|------|
| username | 50 | 用户名 |
| email | 255 | 邮箱 |
| title | 200-300 | 标题 |
| description | Text | 描述 |
| content | Text/LongText | 笔记内容 |
| color_code | 7 | HEX颜色 |
| file_url | 1000 | URL地址 |

---

## 三、关键业务流程与数据变化

### 3.1 笔记创建流程

```
1. User 新建笔记
   ├─ cornell_notes 创建记录 (status: draft)
   ├─ note_contents 创建空行记录
   └─ 实时保存本地副本

2. User 编辑内容
   ├─ 每30秒同步一次 note_contents
   ├─ 版本号递增
   └─ 更新 updated_at

3. User 添加高亮
   ├─ highlights 表插入记录
   ├─ 标记 is_ai_generated = False
   └─ 记录 created_by = 当前用户

4. User 保存笔记
   ├─ cornell_notes.status = 'published'
   ├─ 自动生成 review_schedules (5条基于艾宾浩斯)
   └─ 推送提醒给用户
```

### 3.2 复习流程

```
1. 复习提醒触发
   ├─ review_schedules 查询 status='pending'
   │ 且 scheduled_date = 今日
   └─ 推送APP通知

2. 进入复习页面
   ├─ 加载 cornell_notes + note_contents
   ├─ 加载该笔记的所有 highlights
   └─ 选择复习模式（基础/进阶/高阶）

3. 完成复习
   ├─ 创建 review_records 记录
   ├─ 更新 review_schedules
   │ ├─ status = 'completed'
   │ ├─ completed_at = now()
   │ ├─ is_mastered = 用户标记
   │ └─ next_review_date = 根据艾宾浩斯计算
   ├─ 若未掌握: 重置 review_level = 1
   └─ 若已掌握: 递增 review_level, 延长间隔

4. 计算准确率
   ├─ 对比 user_answer vs expected_answer
   ├─ 计算相似度分数 (基于编辑距离)
   └─ accuracy_score = 正确答案数 / 总答案数
```

### 3.3 协作编辑流程

```
1. 创建小组
   ├─ collaboration_groups 创建记录
   ├─ group_members 添加创建者 (role='owner')
   └─ 生成邀请链接

2. 成员加入
   ├─ 验证 invite_code 有效性
   ├─ group_members 添加新成员
   └─ 推送通知给其他成员

3. 实时同步编辑
   ├─ WebSocket 连接建立
   ├─ 编辑操作广播给其他成员
   ├─ 版本号冲突检测 (Operational Transform)
   └─ note_contents.version 递增

4. 离线处理
   ├─ 本地存储编辑操作队列
   ├─ 网络恢复时批量同步
   └─ 冲突自动合并或提示用户
```

---

## 四、性能优化建议

### 4.1 索引策略

```sql
-- 复合索引（常见查询组合）
CREATE INDEX idx_user_notebook_updated
  ON cornell_notes(owner_id, notebook_id, updated_at DESC);

CREATE INDEX idx_review_user_date
  ON review_schedules(user_id, scheduled_date, status);

-- 部分索引（特定条件）
CREATE INDEX idx_active_shares
  ON share_links(share_token)
  WHERE is_active = true AND expires_at > NOW();

CREATE INDEX idx_pending_reviews
  ON review_schedules(user_id, scheduled_date)
  WHERE status = 'pending' AND scheduled_date <= CURDATE();
```

### 4.2 查询优化

- 使用连接池管理数据库连接
- 实现查询结果缓存（Redis）
- 分页查询限制每页100条记录
- 定期清理软删除记录（>30天）

### 4.3 数据归档策略

```
笔记存档规则：
- 超过6个月未编辑的笔记自动标记 is_archived = true
- 已完成的复习记录保留1年
- 删除的笔记保留30天后彻底删除
- 媒体文件超过2GB自动压缩或删除
```

---

## 五、数据库迁移脚本示例

### 使用 Alembic

```bash
# 生成新迁移
alembic revision --autogenerate -m "Add highlights table"

# 应用迁移
alembic upgrade head

# 回滚迁移
alembic downgrade -1
```

### 初始化脚本

```python
# scripts/init_db.py
from sqlalchemy import create_engine
from app.models import Base

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(bind=engine)

# 插入初始数据（如默认分类）
session = SessionLocal()
session.add(DefaultNotebook(...))
session.commit()
```

---

## 六、API 响应数据模型

### 6.1 笔记查询响应

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "康奈尔笔记法介绍",
  "notebook_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "owner": {
    "id": "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
    "username": "john_doe",
    "avatar_url": "https://..."
  },
  "content": {
    "cue_column": "什么是康奈尔笔记法？\n5R流程是什么？",
    "note_column": "康奈尔笔记法将笔记分为...",
    "summary_row": "核心提炼：...\n待解决：..."
  },
  "highlights": [
    {
      "id": "7ce9141c-7d8e-4035-929c-7d20e3fbfef1",
      "content": "康奈尔笔记法",
      "type": "core_knowledge",
      "color": "#FFFF00",
      "section": "cue"
    }
  ],
  "access_level": "private",
  "is_starred": true,
  "created_at": "2024-01-20T10:30:00Z",
  "updated_at": "2024-01-20T14:45:00Z",
  "word_count": 2450,
  "estimated_review_minutes": 15
}
```

---

本文档与系统设计文档配套，定义了所有核心数据结构。
前端开发应参考此文档理解数据流向，后端开发应按此规范实现数据库层。

**最后更新**: 2024-01-29
**维护者**: 系统设计团队

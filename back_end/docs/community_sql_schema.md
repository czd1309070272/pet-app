# 社群模块 SQL 表结构说明

根据后端 `api_CommunityView` 和 `api_CommunityHistoryView` 的实现整理。

---

## 1. posts（帖子表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK, AUTO_INCREMENT | 帖子 ID |
| user_id | INT, NOT NULL, FK→users.id | 发布者用户 ID |
| content | TEXT/VARCHAR | 正文内容 |
| full_content | TEXT | 完整内容（可与 content 相同） |
| created_at | DATETIME | 创建时间 |
| likes_count | INT, DEFAULT 0 | 点赞数缓存（与 user_likes 同步更新） |

**业务说明**：帖子正文 + 媒体（图片/视频）通过 `post_images` 表存储，标签通过 `post_tags` 表存储。

---

## 2. post_images（帖子媒体表）

存储帖子的图片、视频 URL，`sort_order` 决定展示顺序（支持图片视频混合排序）。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK, AUTO_INCREMENT | 主键 |
| post_id | INT, NOT NULL, FK→posts.id | 所属帖子 ID |
| image_url | VARCHAR(512), NOT NULL | 媒体 URL（图片或视频，通过扩展名区分） |
| sort_order | INT, NOT NULL, DEFAULT 0 | 排序序号，越小越靠前 |

**媒体区分**：视频扩展名如 `.mp4`、`.mov`、`.webm` 等，其余视为图片。

---

## 3. post_tags（帖子标签表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK, AUTO_INCREMENT | 主键 |
| post_id | INT, NOT NULL, FK→posts.id | 所属帖子 ID |
| tag_name | VARCHAR(64), NOT NULL | 标签名（如 #飲食、#健康） |

---

## 4. comments（评论表）

支持两级评论：顶级评论 + 回复；通过 `parent_id`、`root_id`、`reply_to_uid` 组织关系。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK, AUTO_INCREMENT | 评论 ID |
| post_id | INT, NOT NULL, FK→posts.id | 所属帖子 ID |
| user_id | INT, NOT NULL, FK→users.id | 评论者用户 ID |
| parent_id | INT, NULL, FK→comments.id | 父评论 ID，顶级评论为 NULL |
| reply_to_uid | INT, NULL, FK→users.id | 被回复者用户 ID |
| root_id | INT, NULL, FK→comments.id | 顶级评论 ID（方便按楼分组） |
| content | TEXT, NOT NULL | 评论内容 |
| created_at | DATETIME | 创建时间 |
| likes_count | INT, DEFAULT 0 | 点赞数缓存（与 user_likes 同步更新） |

**关系说明**：
- 顶级评论：`parent_id` 为 NULL
- 回复：`parent_id` 为被回复评论 ID，`reply_to_uid` 为被回复者，`root_id` 为该楼顶级评论 ID

---

## 5. user_likes（用户点赞表）

用于帖子、评论的点赞记录及是否已点赞判断；`target_type` 区分目标类型。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK, AUTO_INCREMENT | 主键 |
| user_id | INT, NOT NULL, FK→users.id | 点赞用户 ID |
| target_id | INT, NOT NULL | 目标 ID（帖子 ID 或评论 ID） |
| target_type | VARCHAR(16), NOT NULL | 目标类型：`'POST'` 或 `'COMMENT'` |
| created_at | DATETIME | 点赞时间 |

**约定**：点赞/取消时需同时更新 `posts.likes_count` 或 `comments.likes_count`。

---

## 6. users（用户表 - 社群依赖字段）

社群模块主要依赖以下字段，需与登录/用户模块对齐：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT, PK | 用户 ID |
| username | VARCHAR | 用户名/登录名 |
| nickname | VARCHAR | 昵称（帖子作者显示） |
| avatar_url | VARCHAR | 头像 URL |
| vip_level | VARCHAR | VIP 等级，如 `'NONE'`、`'VIP'`、`'SVIP'` |
| token_version | INT | 用于登录态校验 |

---

## 建表 SQL 示例（MySQL）

```sql
-- 帖子表
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  content TEXT,
  full_content TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  likes_count INT DEFAULT 0,
  INDEX idx_user_created (user_id, created_at DESC)
);

-- 帖子媒体表（图片+视频，按 sort_order 排序）
CREATE TABLE post_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  image_url VARCHAR(512) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  INDEX idx_post_order (post_id, sort_order)
);

-- 帖子标签表
CREATE TABLE post_tags (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  tag_name VARCHAR(64) NOT NULL,
  INDEX idx_post (post_id)
);

-- 评论表
CREATE TABLE comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  parent_id INT NULL,
  reply_to_uid INT NULL,
  root_id INT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  likes_count INT DEFAULT 0,
  INDEX idx_post_created (post_id, created_at),
  INDEX idx_parent (parent_id),
  INDEX idx_root (root_id)
);

-- 用户点赞表
CREATE TABLE user_likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  target_id INT NOT NULL,
  target_type VARCHAR(16) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_target (user_id, target_id, target_type),
  INDEX idx_target (target_id, target_type)
);
```

---

## 表关系示意

```
users ──┬──< posts ──┬──< post_images
        │            └──< post_tags
        │
        ├──< comments (post_id → posts, user_id → users)
        └──< user_likes (user_id → users, target_id → posts | comments)
```

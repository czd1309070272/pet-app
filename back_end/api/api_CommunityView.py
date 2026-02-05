from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Form, File, UploadFile
from pydantic import BaseModel
import uuid
import os
from datetime import datetime
from .schemas import CommunityCommentRequest, CommunityDetail, CommunityRequestComment, CommunityRequestComment2, JsonTool, commentPost, likePost, newPost
from .schemas import CommunityRequest, Comment
from sql.mysql_DB import db
from .tools.TokenTools import decode_token_for_auth

# 创建API路由器
router = APIRouter()


def build_comment_tree_for_post(post_id: str, current_user_id: str, db) -> List[Comment]:
    """
    构建帖子的完整评论树（支持任意嵌套，前端扁平展示）
    返回: List[Comment] —— 每个是顶级评论，其 replies 包含所有子孙（按时间排序）
    """
    # 1. 查询该帖子的所有评论
    all_comments = db.query_all(
        """
        SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count,root_id
        FROM comments 
        WHERE post_id = %s 
        ORDER BY created_at ASC
        """,
        (post_id,)
    )
    if not all_comments:
        return []
    # 2. 建立 id -> comment 映射
    comment_map = {c["id"]: c for c in all_comments}
    # 3. 找到每条评论的顶级祖先（直接使用 root_id）
    root_ancestor = {}      # comment_id -> top_level_id
    top_level_ids = set()
    for cmt in all_comments:
        current_id = cmt["id"]
        root_id = cmt["root_id"]
        
        # 如果 root_id 为 None，说明数据异常；按逻辑应 fallback 到自己（仅当是顶级评论时）
        if root_id is None:
            if cmt["parent_id"] is None:
                root_id = current_id  # 顶级评论：root_id 应等于自身 id
            else:
                continue  # 非顶级评论但 root_id 为空，跳过（或可记录日志）
        
        root_ancestor[current_id] = root_id
        if cmt["parent_id"] is None:  # 只有 parent_id 为 None 的才是顶级评论
            top_level_ids.add(current_id)
    # # 3. 找到每条评论的顶级祖先
    # root_ancestor = {}      # comment_id -> top_level_id
    # top_level_ids = set()
    # for cmt in all_comments:
    #     current_id = cmt["id"]
    #     ancestor_id = current_id
    #     visited = set()  # 防止循环引用
    #     while True:
    #         if ancestor_id in visited:
    #             break  # 循环引用，跳出
    #         visited.add(ancestor_id)
    #         current_cmt = comment_map.get(ancestor_id)
    #         if not current_cmt:
    #             break
    #         if current_cmt["parent_id"] is None:
    #             root_ancestor[current_id] = ancestor_id
    #             top_level_ids.add(ancestor_id)
    #             break
    #         else:
    #             ancestor_id = current_cmt["parent_id"]
    # 4. 收集所有相关用户 ID（作者 + 被 @ 的人）
    user_ids = set()
    for cmt in all_comments:
        user_ids.add(cmt["user_id"])
        if cmt["reply_to_uid"]:
            user_ids.add(cmt["reply_to_uid"])
    # 5. 批量查用户信息
    user_map = {}
    if user_ids:
        placeholders = ','.join(['%s'] * len(user_ids))
        users = db.query_all(
            f"SELECT id, username, avatar_url, vip_level FROM users WHERE id IN ({placeholders})",
            list(user_ids)
        )
        user_map = {u["id"]: u for u in users}
    # 6. 按顶级祖先分组
    groups: Dict[str, List[Dict]] = {}
    for cmt_id in comment_map:
        top_id = root_ancestor.get(cmt_id)
        if top_id and top_id in top_level_ids:
            groups.setdefault(top_id, []).append(comment_map[cmt_id])
    # 7. 构建 Comment 对象
    def make_comment_obj(cmt_row: Dict[str, Any]) -> Comment:
        author = user_map.get(cmt_row["user_id"], {})
        reply_to_name = ""
        if cmt_row["reply_to_uid"]:
            replied_user = user_map.get(cmt_row["reply_to_uid"])
            if replied_user:
                reply_to_name = replied_user.get("username", "")
        # TODO: 如需真实点赞状态，可在此查询 user_likes 表
         # ✅ 新增：获取被回复评论的内容（通过 parent_id）
        reply_to_content = ""
        parent_id_raw = cmt_row.get("parent_id")
        # print(f"原始 parent_id (type={type(parent_id_raw)}): {parent_id_raw}")
        if parent_id_raw is None:
            print("→ parent_id 为 None，跳过")
        else:
            # 统一转为字符串（无论原先是 int 还是 str）
            # parent_id_str = str(parent_id_raw).strip()
            # print(f"转换后的 parent_id_str: '{parent_id_str}'")
            # print("coment_map:",comment_map)
            if parent_id_raw in comment_map:
                parent_comment = comment_map[parent_id_raw]
                reply_to_content = parent_comment.get("content", "")[:100]
                # print(f"✅ 成功获取父评论内容: {repr(reply_to_content)}")
            # else:
                # print(f"❌ parent_id '{parent_id_raw}' 不在 comment_map 中！")
                # print(f"   comment_map 包含的 IDs（前10个）: {list(comment_map.keys())[:10]}")
                # 可选：记录异常（用于排查数据问题）
                # logger.warning(f"评论 {cmt_row['id']} 的 parent_id {parent_id_str} 不存在于当前帖子评论中")
        is_liked = False  # 当前简化处理
        return Comment(
            id=str(cmt_row["id"]),
            author=author.get("username", "未知用户"),
            avatar=author.get("avatar_url") or "/default-avatar.png",
            content=cmt_row["content"],
            time=cmt_row["created_at"].strftime('%Y-%m-%d %H:%M:%S') if cmt_row["created_at"] else "未知时间",
            likes=cmt_row.get("likes_count", 0),
            isLiked=is_liked,
            isVIP=author.get("vip_level") != "NONE",
            vipLevel=author.get("vip_level", "NONE"),
            replyToName=reply_to_name,
            replies=[],  # 扁平化，不嵌套多层
            replyToContent=reply_to_content,
            top_comment_id=cmt_row.get("root_id")
        )
    # 8. 构建结果：顶级评论 + 所有子孙（按时间排序）
    result = []
    # 获取顶级评论的创建时间用于排序
    top_time_map = {
        c["id"]: c["created_at"] for c in all_comments if c["id"] in top_level_ids
    }
    sorted_top_ids = sorted(top_level_ids, key=lambda tid: top_time_map.get(tid, datetime.min))
    for top_id in sorted_top_ids:
        group = groups.get(top_id, [])
        top_comment = next((c for c in group if c["id"] == top_id), None)
        if not top_comment:
            continue
        # 子评论：排除自己，按时间排序
        replies = sorted(
            [c for c in group if c["id"] != top_id],
            key=lambda x: x["created_at"]
        )
        top_obj = make_comment_obj(top_comment)
        top_obj.replies = [make_comment_obj(r) for r in replies]
        result.append(top_obj)
    return result
def build_comment_tree_paginated(post_id: str, current_user_id: str, db, top_limit: int, replies_limit: int) -> List[Comment]:
    """
    分页构建评论树（适配 pawpal.sql 表结构）：
    - 仅支持两层：顶级评论 + 子评论
    - 子评论按 B站风格排序（新→旧）
    - replyToContent 通过 parent_id 查询父评论内容实现
    """
    # 1. 查询前 N 条顶级评论（parent_id IS NULL）
    top_comments = db.query_all(
        """
        SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
        FROM comments 
        WHERE post_id = %s AND parent_id IS NULL
        ORDER BY created_at DESC
        LIMIT %s
        """,
        (post_id, top_limit)
    )
    if not top_comments:
        return []

    # 2. 提取顶级评论 ID 列表（作为 root_id）
    top_ids = [c["id"] for c in top_comments]

    # 3. 查询这些顶级评论的所有子评论（parent_id IS NOT NULL）
    placeholders = ','.join(['%s'] * len(top_ids))
    sub_comments = db.query_all(
        f"""
        SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
        FROM comments 
        WHERE post_id = %s AND root_id IN ({placeholders}) AND parent_id IS NOT NULL
        ORDER BY created_at DESC  -- B站风格：新→旧
        """,
        (post_id, *top_ids)
    )

    # 4. 按 root_id 分组子评论，并截断到 replies_limit
    from collections import defaultdict
    sub_groups = defaultdict(list)
    for cmt in sub_comments:
        sub_groups[cmt["root_id"]].append(cmt)

    for root_id in sub_groups:
        sub_groups[root_id] = sub_groups[root_id][:replies_limit]

    # 5. 收集所有需要的用户 ID 和父评论 ID
    user_ids = set()
    parent_comment_ids = set()
    all_comment_ids = set()  # ← 新增：用于查点赞状态

    # 收集顶级评论的 user_id
    for cmt in top_comments:
        user_ids.add(cmt["user_id"])
        all_comment_ids.add(cmt["id"])  # ← 收集顶级评论 ID

    # 收集子评论的 user_id + parent_id（用于查父评论）
    for cmt in sub_comments:
        user_ids.add(cmt["user_id"])
        if cmt["parent_id"] is not None:
            parent_comment_ids.add(cmt["parent_id"])
        all_comment_ids.add(cmt["id"])  # ← 收集子评论 ID

    # 6. 批量查询用户信息
    user_map = {}
    if user_ids:
        placeholders_u = ','.join(['%s'] * len(user_ids))
        users = db.query_all(
            f"SELECT id, username, avatar_url, vip_level FROM users WHERE id IN ({placeholders_u})",
            list(user_ids)
        )
        user_map = {u["id"]: u for u in users}

    # 7. 批量查询父评论（即被回复的评论）的内容和作者
    parent_comment_map = {}  # id -> (user_id, content)
    if parent_comment_ids:
        placeholders_p = ','.join(['%s'] * len(parent_comment_ids))
        parent_rows = db.query_all(
            f"SELECT id, user_id, content FROM comments WHERE id IN ({placeholders_p})",
            list(parent_comment_ids)
        )
        parent_comment_map = {
            row["id"]: (row["user_id"], row["content"]) for row in parent_rows
        }

    # ✅ 8. 【新增】批量查询当前用户的点赞状态
    liked_comment_ids = set()
    if all_comment_ids and current_user_id:
        placeholders_like = ','.join(['%s'] * len(all_comment_ids))
        liked_rows = db.query_all(
            f"SELECT target_id FROM user_likes WHERE user_id = %s AND target_type = 'COMMENT' AND target_id IN ({placeholders_like})",
            [current_user_id] + list(all_comment_ids)
        )
        liked_comment_ids = {row["target_id"] for row in liked_rows}
    # 9. 构建 Comment 对象
    def make_comment_obj(cmt_row: dict) -> Comment:
        author = user_map.get(cmt_row["user_id"], {})
        reply_to_name = ""
        reply_to_content = ""
        # 子评论：通过 parent_id 获取被回复的内容和用户名
        parent_id = cmt_row.get("parent_id")
        if parent_id is not None and parent_id in parent_comment_map:
            parent_user_id, parent_content = parent_comment_map[parent_id]
            parent_author = user_map.get(parent_user_id, {})
            reply_to_name = parent_author.get("username", "[已删除]")
            reply_to_content = parent_content
        # ✅ 关键：判断当前用户是否点赞了这条评论
        is_liked = str(cmt_row["id"]) in liked_comment_ids or cmt_row["id"] in liked_comment_ids
        return Comment(
            id=str(cmt_row["id"]),
            author=author.get("username", "未知用户"),
            avatar=author.get("avatar_url") or "/default-avatar.png",
            content=cmt_row["content"],
            time=cmt_row["created_at"].strftime('%Y-%m-%d %H:%M:%S') if cmt_row["created_at"] else "未知时间",
            likes=cmt_row.get("likes_count", 0),
            isLiked=is_liked,  # ✅ 现在是真实值！
            isVIP=author.get("vip_level") != "NONE",
            vipLevel=author.get("vip_level", "NONE"),
            replyToName=reply_to_name,
            replies=[],
            replyToContent=reply_to_content,
            top_comment_id=cmt_row.get("root_id") or cmt_row["id"]
        )

    # 9. 组装结果
    result = []
    for top_cmt in top_comments:
        top_obj = make_comment_obj(top_cmt)
        replies = [make_comment_obj(c) for c in sub_groups[top_cmt["id"]]]
        top_obj.replies = replies
        result.append(top_obj)

    print("Result: " + str(result))
    return result

def fetch_and_build_comments(
    post_id: str,
    parent_id: Optional[str],
    cursor_time: Optional[str],
    limit: int,
    is_top_level: bool = False,
    current_user_id: str = None  # ← 新增参数
) -> List[Comment]:
    """
    B站风格分页加载评论。
    - 保留所有 content 字段（用于显示当前评论内容）
    - 不查询 reply_to_content（因数据库无此列）
    - replyToContent 通过 parent_id 查询父评论的 content 实现
    """
    params = []
    if is_top_level:
        # 查询顶级评论：有 post_id，无 parent_id
        base_query = """
            SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
            FROM comments 
            WHERE post_id = %s AND parent_id IS NULL
        """
        params = [post_id]
    else:
        # 查询子评论：必须同时指定 post_id 和 parent_id（安全且准确）
        base_query = """
            SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
            FROM comments 
            WHERE post_id = %s AND parent_id = %s
        """
        params = [post_id, parent_id]

    # 游标分页：加载比 cursor_time 更早的评论（B站风格）
    if cursor_time:
        base_query += " AND created_at < %s"
        params.append(cursor_time)

    base_query += " ORDER BY created_at DESC LIMIT %s"
    params.append(limit)

    comments = db.query_all(base_query, tuple(params))
    if not comments:
        return []

    # === 批量收集依赖数据 ===
    user_ids = set()
    parent_comment_ids = set()  # 用于获取 replyToContent
    all_comment_ids = set()  # ← 新增

    for cmt in comments:
        user_ids.add(cmt["user_id"])
        all_comment_ids.add(cmt["id"])  # ← 收集 ID
        if cmt["reply_to_uid"]:
            user_ids.add(cmt["reply_to_uid"])
        if cmt["parent_id"] is not None:
            parent_comment_ids.add(cmt["parent_id"])

    # 批量查用户信息
    user_map = {}
    if user_ids:
        placeholders = ','.join(['%s'] * len(user_ids))
        users = db.query_all(
            f"SELECT id, username, avatar_url, vip_level FROM users WHERE id IN ({placeholders})",
            list(user_ids)
        )
        user_map = {u["id"]: u for u in users}

    # 批量查父评论的 content（即被回复的内容）
    parent_content_map = {}  # id -> content
    if parent_comment_ids:
        placeholders = ','.join(['%s'] * len(parent_comment_ids))
        parent_rows = db.query_all(
            f"SELECT id, content FROM comments WHERE id IN ({placeholders})",
            list(parent_comment_ids)
        )
        parent_content_map = {str(row["id"]): row["content"] for row in parent_rows}

    # ✅ 【新增】查当前用户的点赞状态
    liked_comment_ids = set()
    if all_comment_ids and current_user_id:
        placeholders = ','.join(['%s'] * len(all_comment_ids))
        liked_rows = db.query_all(
            f"SELECT target_id FROM user_likes WHERE user_id = %s AND target_type = 'COMMENT' AND target_id IN ({placeholders})",
            [current_user_id] + list(all_comment_ids)
        )
        liked_comment_ids = {row["target_id"] for row in liked_rows}
    # === 构建 Comment 对象 ===
    def make_comment_obj(cmt_row):
        author = user_map.get(cmt_row["user_id"], {})
        own_content = cmt_row["content"]
        reply_to_name = ""
        if cmt_row["reply_to_uid"]:
            replied_user = user_map.get(cmt_row["reply_to_uid"])
            if replied_user:
                reply_to_name = replied_user.get("username", "")
        reply_to_content = ""
        if cmt_row["parent_id"] is not None:
            reply_to_content = parent_content_map.get(str(cmt_row["parent_id"]), "")
        # ✅ 判断是否点赞
        is_liked = str(cmt_row["id"]) in liked_comment_ids or cmt_row["id"] in liked_comment_ids
        return Comment(
            id=str(cmt_row["id"]),
            author=author.get("username", "未知用户"),
            avatar=author.get("avatar_url") or "/default-avatar.png",
            content=own_content,
            time=cmt_row["created_at"].strftime('%Y-%m-%d %H:%M:%S') if cmt_row["created_at"] else "未知时间",
            likes=cmt_row.get("likes_count", 0),
            isLiked=is_liked,  # ✅
            isVIP=author.get("vip_level") != "NONE",
            vipLevel=author.get("vip_level", "NONE"),
            replyToName=reply_to_name,
            replies=[],
            replyToContent=reply_to_content,
            top_comment_id=cmt_row.get("root_id") or cmt_row["id"]
        )

    return [make_comment_obj(c) for c in comments]

# 创建一个测试的api（无需 token）
@router.get("/api/communityview/test", response_model=JsonTool)
async def test_api():
    sql = "select * from users where id = %s"
    user = db.query_one(sql, (22,))
    print(f"查询到的用户信息: {user}")
    return JsonTool(
        code=200,
        msg="社区视图API测试成功",
        data={"info": "这是一个测试接口"}
    )

# 图片上传（使用 token 验证身份）
@router.post("/api/communityview/upload_images", response_model=JsonTool)
async def upload_images(token: str = Form(...), images: List[UploadFile] = File(...)):
    try:
        # 验证 token 并获取 user_id
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        # 确保上传目录存在
        current_dir = Path(__file__).parent.parent
        upload_dir = current_dir / "pet_images"
        upload_dir.mkdir(exist_ok=True)

        uploaded_urls = []
        for image in images:
            if not image.content_type or not image.content_type.startswith("image/"):
                return JsonTool(code=400, msg=f"文件 {image.filename} 不是有效的图片格式", data=None)

            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            ext = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
            unique_filename = f"{user_id}_{timestamp}_{str(uuid.uuid4())[:8]}{ext}"
            file_path = upload_dir / unique_filename

            with open(file_path, "wb") as buffer:
                buffer.write(await image.read())

            image_url = f"/images/{unique_filename}"
            uploaded_urls.append(image_url)

        return JsonTool(
            code=200,
            msg="图片上传成功",
            data={"image_urls": uploaded_urls}
        )

    except Exception as e:
        traceback.print_exc()
        return JsonTool(
            code=500,
            msg=f"图片上传失败: {str(e)}",
            data=None
        )


# 视频上传（使用 token 验证身份）
@router.post("/api/communityview/upload_videos", response_model=JsonTool)
async def upload_videos(token: str = Form(...), videos: List[UploadFile] = File(...)):
    try:
        # 验证 token 并获取 user_id
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        # 确保上传目录存在
        current_dir = Path(__file__).parent.parent
        upload_dir = current_dir / "pet_videos"
        upload_dir.mkdir(exist_ok=True)

        uploaded_urls = []
        for video in videos:
            if not video.content_type or not video.content_type.startswith("video/"):
                return JsonTool(code=400, msg=f"文件 {video.filename} 不是有效的视频格式", data=None)

            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            ext = os.path.splitext(video.filename)[1] if video.filename else ".mp4"
            unique_filename = f"{user_id}_{timestamp}_{str(uuid.uuid4())[:8]}{ext}"
            file_path = upload_dir / unique_filename

            with open(file_path, "wb") as buffer:
                buffer.write(await video.read())

            video_url = f"/videos/{unique_filename}"
            uploaded_urls.append(video_url)

        return JsonTool(
            code=200,
            msg="视频上传成功",
            data={"video_urls": uploaded_urls}
        )

    except Exception as e:
        traceback.print_exc()
        return JsonTool(
            code=500,
            msg=f"视频上传失败: {str(e)}",
            data=None
        )
# ========================
# 以下接口全部加入 token 验证
# ========================

# 发布新社区信息
@router.post("/api/communityview/add_new_community", response_model=JsonTool)
async def add_community(request_data: CommunityRequest):
    try:
        token = request_data.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        content = request_data.content
        images = request_data.images or []
        tags = request_data.tags or []

        print(f"接收到的社区帖子数据: user_id={user_id}, content={content}, images={images}, tags={tags}")

        sql = "select * from users where id = %s"
        print(f"正在查询用户信息，user_id: {user_id}")
        user = db.query_one(sql, (user_id,))
        print(f"查询到的用户信息: {user}")

        if not user:
            print("用户不存在")
            for img_url in images:
                filename = img_url.split('/')[-1]
                if any(img_url.endswith(ext) for ext in ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv']):
                    video_path = Path(__file__).parent.parent / "pet_videos" / filename
                    if video_path.exists():
                        os.remove(video_path)
                        print(f"已删除视频文件: {filename}")
                elif any(img_url.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
                    image_path = Path(__file__).parent.parent / "pet_images" / filename
                    if image_path.exists():
                        os.remove(image_path)
                        print(f"已删除图片文件: {filename}")
            return JsonTool(code=201, msg="用户不存在", data=None)

        print("用户存在，继续处理")
        datatime = datetime.now()
        print(f"准备插入帖子数据，时间: {datatime}")
        insert_new_post_sql = "INSERT INTO posts (user_id, content, full_content, created_at) VALUES (%s, %s, %s, %s)"
        result = db.execute(insert_new_post_sql, (user_id, content, content, datatime))
        print(f"帖子插入结果: {result}")

        search_post_id_sql = "SELECT id FROM posts WHERE user_id = %s ORDER BY created_at DESC LIMIT 1"
        post_id = db.query_one(search_post_id_sql, (user_id,))
        print(f"获取到的帖子ID: {post_id}")

        if not post_id or len(post_id) == 0:
            print("无法获取新插入的帖子ID")
            return JsonTool(code=500, msg="无法获取帖子ID", data=None)

        print(f"开始处理图片，图片数量: {len(images)}")
        img_sort_order = 0
        for img_url in images:
            print(f"正在插入图片: {img_url}，排序: {img_sort_order}")
            insert_post_image_sql = "INSERT INTO post_images (post_id, image_url, sort_order) VALUES (%s, %s, %s)"
            db.execute(insert_post_image_sql, (post_id['id'], img_url, img_sort_order))
            img_sort_order += 1
            print(f"图片插入完成，当前排序: {img_sort_order}")

        print(f"开始处理标签，标签数量: {len(tags)}")
        for tag in tags:
            print(f"正在插入标签: {tag}")
            insert_post_tag_sql = "INSERT INTO post_tags (post_id, tag_name) VALUES (%s, %s)"
            db.execute(insert_post_tag_sql, (post_id['id'], tag))
            print(f"标签插入完成: {tag}")

        isVIP = False if user.get('vip_level') == "NONE" else True
        print(f"用户VIP状态: {isVIP}")

        print("准备返回成功响应")
        response = JsonTool(
            code=200,
            msg="社区帖子发布成功",
            data={
                "post": newPost(
                    author=user.get('username') if user and len(user) > 0 else 'Unknown',
                    avatar=user.get('avatar_url', '') if user and len(user) > 0 and user.get('avatar_url') else '/default-avatar.png',
                    id=post_id['id'],
                    time=datatime.strftime('%Y-%m-%d %H:%M:%S'),
                    content=content,
                    fullContent=content,
                    images=images,
                    likes=0,
                    comments=0,
                    isLiked=False,
                    isV=isVIP,
                    isVIP=isVIP,
                    vipLevel=user.get('vip_level', '') if user and len(user) > 0 else '',
                    userTags=tags,
                    commentList=[],
                    Level=user.get('level', 0) if user and len(user) > 0 else 0
                ).dict()
            }
        )
        print("响应构建完成，准备返回")
        return response

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"发布失败: {str(e)}", data=None)


# 获取社区帖子
@router.post("/api/communityview/get_community_posts", response_model=JsonTool)
async def get_community_posts(request_data: CommunityRequestComment):
    try:
        token = request_data.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        num = request_data.num
        offset = getattr(request_data, 'offset', 1)
        exclude_post_ids = getattr(request_data, 'exclude_post_ids', []) or []

        if num <= 0:
            return JsonTool(code=400, msg="请求参数无效", data=None)

        user_result = db.query_one("SELECT * FROM users WHERE id = %s", (str(user_id),))
        if not user_result:
            return JsonTool(code=400, msg="用户不存在", data=None)

        posts_query = "SELECT * FROM posts WHERE 1=1"
        params = []
        if exclude_post_ids:
            placeholders = ','.join(['%s'] * len(exclude_post_ids))
            posts_query += f" AND id NOT IN ({placeholders})"
            params.extend(exclude_post_ids)

        posts_query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([num, (offset - 1) * num])

        posts = db.query_all(posts_query, params)
        post_list = []
        for post in posts:
            post_id = post["id"]
            images = db.query_all(
                "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order ASC",
                (post_id,)
            )
            image_urls = [img["image_url"] for img in images]

            tags = db.query_all(
                "SELECT tag_name FROM post_tags WHERE post_id = %s",
                (post_id,)
            )
            tag_names = [tag["tag_name"] for tag in tags]

            like_records = db.query_all(
                "SELECT user_id FROM user_likes WHERE target_id = %s AND target_type = 'POST'",
                (post_id,)
            )
            like_count = len(like_records)
            is_liked = any(like["user_id"] == user_id for like in like_records)

            total_comments = build_comment_tree_for_post(post_id, user_id, db)
            total_comment_count = db.query_one("SELECT COUNT(*) AS cnt FROM comments WHERE post_id = %s", (post_id,))["cnt"]

            author_info = db.query_one(
                "SELECT nickname, avatar_url, vip_level FROM users WHERE id = %s",
                (post["user_id"],)
            )
            if not author_info:
                author_info = {"nickname": "未知用户", "avatar_url": "/default-avatar.png", "vip_level": "NONE"}
            is_vip = author_info.get('vip_level', 'NONE') != "NONE"

            post_list.append(
                newPost(
                    author=author_info.get('nickname'),
                    avatar=author_info.get('avatar_url') or "/default-avatar.png",
                    id=post_id,
                    time=post["created_at"].strftime('%Y-%m-%d %H:%M:%S') if post.get("created_at") else "未知时间",
                    content=post.get('content', ''),
                    fullContent=post.get('content', ''),
                    images=image_urls,
                    likes=like_count,
                    comments=total_comment_count,
                    isLiked=is_liked,
                    isV=is_vip,
                    isVIP=is_vip,
                    vipLevel=author_info.get('vip_level', 'NONE'),
                    userTags=tag_names,
                    commentList=total_comments,
                ).dict()
            )

        return JsonTool(code=200, msg="获取帖子成功", data={"posts": post_list})

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"获取帖子失败: {str(e)}", data=None)


# 根据时间分页获取帖子
@router.post("/api/communityview/get_community_posts_by_time", response_model=JsonTool)
async def get_community_posts_by_time(request_data: CommunityRequestComment2):
    try:
        token = request_data.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        limit = request_data.limit
        timenode = request_data.timenode
        exclude_post_ids = request_data.exclude_post_ids or []
        datatype = request_data.datatype

        if limit <= 0:
            return JsonTool(code=400, msg="请求参数无效", data=None)

        if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
            return JsonTool(code=400, msg="用户不存在", data=None)

        posts_query = "SELECT * FROM posts WHERE 1=1"
        params = []
        if exclude_post_ids:
            placeholders = ','.join(['%s'] * len(exclude_post_ids))
            posts_query += f" AND id NOT IN ({placeholders})"
            params.extend(exclude_post_ids)

        if timenode:
            if datatype == "newer":
                posts_query += " AND created_at > %s ORDER BY created_at ASC"
            else:
                posts_query += " AND created_at < %s ORDER BY created_at DESC"
            params.append(timenode)
        else:
            posts_query += " ORDER BY created_at DESC"

        posts_query += " LIMIT %s"
        params.append(limit)

        posts = db.query_all(posts_query, params)
        if not posts:
            return JsonTool(code=200, msg="无更多帖子", data={"posts": []})

        post_ids = [p["id"] for p in posts]
        author_ids = {p["user_id"] for p in posts}

        # 批量查询关联数据（略，保持原逻辑）
        image_map = {}
        if post_ids:
            images = db.query_all("""
                SELECT post_id, image_url FROM post_images WHERE post_id IN ({}) ORDER BY post_id, sort_order
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for img in images:
                image_map.setdefault(img["post_id"], []).append(img["image_url"])

        tag_map = {}
        if post_ids:
            tags = db.query_all("""
                SELECT post_id, tag_name FROM post_tags WHERE post_id IN ({})
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for tag in tags:
                tag_map.setdefault(tag["post_id"], []).append(tag["tag_name"])

        like_map = {}
        if post_ids:
            likes = db.query_all("""
                SELECT target_id AS post_id, user_id FROM user_likes WHERE target_type = 'POST' AND target_id IN ({})
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for like in likes:
                pid = like["post_id"]
                if pid not in like_map:
                    like_map[pid] = {"count": 0, "is_liked": False}
                like_map[pid]["count"] += 1
                if like["user_id"] == user_id:
                    like_map[pid]["is_liked"] = True

        author_map = {}
        if author_ids:
            authors = db.query_all("""
                SELECT id, nickname, avatar_url, vip_level FROM users WHERE id IN ({})
            """.format(','.join(['%s'] * len(author_ids))), list(author_ids))
            for au in authors:
                author_map[au["id"]] = au

        comment_count_map = {}
        if post_ids:
            counts = db.query_all("""
                SELECT post_id, COUNT(*) AS cnt FROM comments WHERE post_id IN ({}) GROUP BY post_id
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for c in counts:
                comment_count_map[c["post_id"]] = c["cnt"]

        recent_comments_map = {}
        all_comment_user_ids = set()
        if post_ids:
            comments = db.query_all("""
                SELECT c1.id, c1.post_id, c1.user_id, c1.reply_to_uid, c1.content, c1.created_at, c1.likes_count
                FROM comments c1
                WHERE c1.post_id IN ({}) AND (
                    SELECT COUNT(*) FROM comments c2
                    WHERE c2.post_id = c1.post_id AND c2.created_at >= c1.created_at
                ) <= 3
                ORDER BY c1.post_id, c1.created_at DESC
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for cmt in comments:
                post_id = cmt["post_id"]
                recent_comments_map.setdefault(post_id, []).append(cmt)
                all_comment_user_ids.add(cmt["user_id"])
                if cmt["reply_to_uid"]:
                    all_comment_user_ids.add(cmt["reply_to_uid"])
            for pid in recent_comments_map:
                recent_comments_map[pid].sort(key=lambda x: x["created_at"], reverse=True)

        user_map = {}
        if all_comment_user_ids:
            users = db.query_all("""
                SELECT id, username, avatar_url, vip_level FROM users WHERE id IN ({})
            """.format(','.join(['%s'] * len(all_comment_user_ids))), list(all_comment_user_ids))
            user_map = {u["id"]: u for u in users}

        post_list = []
        for post in posts:
            post_id = post["id"]
            author_id = post["user_id"]
            image_urls = image_map.get(post_id, [])
            tag_names = tag_map.get(post_id, [])
            like_info = like_map.get(post_id, {"count": 0, "is_liked": False})
            total_comment_count = comment_count_map.get(post_id, 0)
            author_info = author_map.get(author_id, {
                "nickname": "未知用户",
                "avatar_url": "/default-avatar.png",
                "vip_level": "NONE"
            })
            is_vip = author_info.get('vip_level', 'NONE') != "NONE"

            comment_objs = []
            for cmt in recent_comments_map.get(post_id, []):
                author = user_map.get(cmt["user_id"], {})
                reply_to_name = ""
                if cmt["reply_to_uid"]:
                    replied_user = user_map.get(cmt["reply_to_uid"])
                    if replied_user:
                        reply_to_name = replied_user.get("username", "")
                is_liked = False
                comment_objs.append(
                    Comment(
                        id=str(cmt["id"]),
                        author=author.get("username", "未知用户"),
                        avatar=author.get("avatar_url") or "/default-avatar.png",
                        content=cmt["content"],
                        time=cmt["created_at"].strftime('%Y-%m-%d %H:%M:%S'),
                        likes=cmt.get("likes_count", 0),
                        isLiked=is_liked,
                        isVIP=author.get("vip_level") != "NONE",
                        vipLevel=author.get("vip_level", "NONE"),
                        replyToName=reply_to_name,
                        replies=[],
                        replyToContent="",
                    )
                )

            post_list.append(
                newPost(
                    author=author_info.get('nickname'),
                    avatar=author_info.get('avatar_url') or "/default-avatar.png",
                    id=post_id,
                    time=post["created_at"].strftime('%Y-%m-%d %H:%M:%S') if post.get("created_at") else "未知时间",
                    content=post.get('content', ''),
                    fullContent=post.get('content', ''),
                    images=image_urls,
                    likes=like_info["count"],
                    comments=total_comment_count,
                    isLiked=like_info["is_liked"],
                    isV=is_vip,
                    isVIP=is_vip,
                    vipLevel=author_info.get('vip_level', 'NONE'),
                    userTags=tag_names,
                    commentList=comment_objs,
                ).dict()
            )

        return JsonTool(code=200, msg="获取帖子成功", data={"posts": post_list})

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"获取帖子失败: {str(e)}", data=None)


# 点赞
@router.post("/api/communityview/like_post", response_model=JsonTool)
async def like_post(request: likePost):
    try:
        token = request.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        target_id = request.target_id
        target_type = request.target_type

        print(f"点赞请求 - 用户ID: {user_id}, 目标ID: {target_id}, 类型: {target_type}")

        user_result = db.query_one("SELECT * FROM users WHERE id = %s", (user_id,))
        if not user_result:
            return JsonTool(code=400, msg="用户不存在", data=None)

        target_exists = False
        current_likes = 0
        if target_type == 'POST':
            target_result = db.query_one("SELECT id, likes_count FROM posts WHERE id = %s", (target_id,))
            if target_result:
                target_exists = True
                current_likes = target_result.get('likes_count', 0)
        elif target_type == 'COMMENT':
            target_result = db.query_one("SELECT id, likes_count FROM comments WHERE id = %s", (target_id,))
            if target_result:
                target_exists = True
                current_likes = target_result.get('likes_count', 0)
        else:
            return JsonTool(code=400, msg=f"不支持的目标类型: {target_type}", data=None)

        if not target_exists:
            return JsonTool(code=400, msg=f"{target_type} 不存在", data=None)

        existing_like = db.query_one(
            "SELECT * FROM user_likes WHERE user_id = %s AND target_id = %s AND target_type = %s",
            (user_id, target_id, target_type)
        )

        if existing_like:
            result = db.execute(
                "DELETE FROM user_likes WHERE user_id = %s AND target_id = %s AND target_type = %s",
                (user_id, target_id, target_type)
            )
            if result > 0:
                new_like_count = max(0, current_likes - 1)
                if target_type == 'POST':
                    db.execute("UPDATE posts SET likes_count = %s WHERE id = %s", (new_like_count, target_id))
                elif target_type == 'COMMENT':
                    db.execute("UPDATE comments SET likes_count = %s WHERE id = %s", (new_like_count, target_id))
                return JsonTool(
                    code=200,
                    msg="取消点赞成功",
                    data={
                        "target_id": target_id,
                        "target_type": target_type,
                        "is_liked": False,
                        "like_count": new_like_count
                    }
                )
            else:
                return JsonTool(code=500, msg="取消点赞失败", data=None)
        else:
            result = db.execute(
                "INSERT INTO user_likes (user_id, target_id, target_type, created_at) VALUES (%s, %s, %s, %s)",
                (user_id, target_id, target_type, datetime.now())
            )
            if result > 0:
                new_like_count = current_likes + 1
                if target_type == 'POST':
                    db.execute("UPDATE posts SET likes_count = %s WHERE id = %s", (new_like_count, target_id))
                elif target_type == 'COMMENT':
                    db.execute("UPDATE comments SET likes_count = %s WHERE id = %s", (new_like_count, target_id))
                return JsonTool(
                    code=200,
                    msg="点赞成功",
                    data={
                        "target_id": target_id,
                        "target_type": target_type,
                        "is_liked": True,
                        "like_count": new_like_count
                    }
                )
            else:
                return JsonTool(code=500, msg="点赞失败", data=None)

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"点赞失败: {str(e)}", data=None)


# 评论
@router.post("/api/communityview/comment_post", response_model=JsonTool)
async def comment_post(request: commentPost):
    try:
        token = request.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        post_id = request.post_id
        parent_id = request.parent_id
        reply_to_id = request.reply_to_id
        content = request.content.strip()
        root_id = request.root_id

        print(f"开始处理评论请求 - 帖子ID: {post_id}, 用户ID: {user_id}, 父评论ID: {parent_id}, 回复用户ID: {reply_to_id}")
        print(f"评论内容: {content}, root_id: {root_id}")

        if not post_id or not user_id or not content:
            return JsonTool(code=400, msg="缺少必要参数", data=None)

        if len(content) > 500:
            return JsonTool(code=400, msg="评论内容不能超过500字", data=None)

        if root_id is not None:
            if not isinstance(root_id, str) or not root_id.strip():
                return JsonTool(code=400, msg="root_id 必须为 null 或非空字符串", data=None)
            root_id = root_id.strip()

        user_info = db.query_one("SELECT username, avatar_url, vip_level FROM users WHERE id = %s", (user_id,))
        if not user_info:
            return JsonTool(code=400, msg="用户不存在", data=None)

        if not db.query_one("SELECT 1 FROM posts WHERE id = %s", (post_id,)):
            return JsonTool(code=404, msg="帖子不存在", data=None)

        actual_reply_to_uid = None
        actual_root_id = None

        if parent_id is None:
            if root_id is not None:
                return JsonTool(code=400, msg="顶级评论的 root_id 必须为 null", data=None)
        else:
            if root_id is None:
                return JsonTool(code=400, msg="回复评论时 root_id 不能为空", data=None)

            parent_comment = db.query_one(
                "SELECT user_id FROM comments WHERE id = %s AND post_id = %s",
                (parent_id, post_id)
            )
            if not parent_comment:
                return JsonTool(code=400, msg="父评论不存在或不属于此帖子", data=None)

            valid_root = db.query_one(
                "SELECT 1 FROM comments WHERE id = %s AND post_id = %s AND parent_id IS NULL",
                (root_id, post_id)
            )
            if not valid_root:
                return JsonTool(code=400, msg="无效的 root_id", data=None)

            actual_reply_to_uid = reply_to_id if reply_to_id is not None else parent_comment["user_id"]
            actual_root_id = root_id

        timedata = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        new_comment_id = db.insert_and_get_id("""
            INSERT INTO comments (post_id, user_id, parent_id, reply_to_uid, root_id, content, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (post_id, user_id, parent_id, actual_reply_to_uid, actual_root_id, content, timedata))

        if not new_comment_id:
            return JsonTool(code=500, msg="评论发布失败", data=None)

        reply_to_name = None
        reply_to_content = None
        if parent_id is not None:
            parent_info = db.query_one(
                "SELECT u.username AS author, c.content FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = %s",
                (parent_id,)
            )
            if parent_info:
                reply_to_name = parent_info["author"]
                reply_to_content = parent_info["content"]
            else:
                reply_to_name = "[已删除]"
                reply_to_content = ""

        new_comment_obj = Comment(
            id=str(new_comment_id),
            author=user_info["username"],
            avatar=user_info["avatar_url"] or "/default-avatar.png",
            content=content,
            time=timedata,
            likes=0,
            isLiked=False,
            isVIP=user_info["vip_level"] != "NONE",
            vipLevel=user_info["vip_level"] or "NONE",
            replyToName=reply_to_name or "",
            replies=[],
            replyToContent=reply_to_content or "",
            top_comment_id=actual_root_id
        )

        return JsonTool(code=200, msg="评论成功", data=new_comment_obj.dict())

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"评论失败: {str(e)}", data=None)


# 获取帖子详情
@router.post("/api/communityview/get_post_detail", response_model=JsonTool)
async def get_post_detail(request_data: CommunityDetail):
    try:
        token = request_data.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        post_id = request_data.post_id
        top_limit = request_data.top_limit
        replies_limit = request_data.replies_limit

        if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
            return JsonTool(code=400, msg="用户不存在", data=None)

        post = db.query_one("SELECT * FROM posts WHERE id = %s", (post_id,))
        if not post:
            return JsonTool(code=404, msg="帖子不存在", data=None)

        author_id = post["user_id"]
        author_info = db.query_one(
            "SELECT nickname, avatar_url, vip_level FROM users WHERE id = %s",
            (author_id,)
        )
        if not author_info:
            author_info = {"nickname": "未知用户", "avatar_url": "/default-avatar.png", "vip_level": "NONE"}

        is_vip = author_info.get('vip_level', 'NONE') != "NONE"

        images = db.query_all(
            "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order ASC",
            (post_id,)
        )
        image_urls = [img["image_url"] for img in images]

        tags = db.query_all(
            "SELECT tag_name FROM post_tags WHERE post_id = %s",
            (post_id,)
        )
        tag_names = [tag["tag_name"] for tag in tags]

        like_records = db.query_all(
            "SELECT user_id FROM user_likes WHERE target_id = %s AND target_type = 'POST'",
            (post_id,)
        )
        like_count = len(like_records)
        is_liked = any(like["user_id"] == user_id for like in like_records)

        total_comment_count = db.query_one(
            "SELECT COUNT(*) AS cnt FROM comments WHERE post_id = %s",
            (post_id,)
        )["cnt"]

        comment_list = build_comment_tree_paginated(post_id, user_id, db, top_limit, replies_limit)

        post_detail = newPost(
            id=post_id,
            author=author_info.get('nickname'),
            avatar=author_info.get('avatar_url') or "/default-avatar.png",
            time=post["created_at"].strftime('%Y-%m-%d %H:%M:%S') if post.get("created_at") else "未知时间",
            content=post.get('content', ''),
            fullContent=post.get('content', ''),
            images=image_urls,
            likes=like_count,
            comments=total_comment_count,
            isLiked=is_liked,
            userTags=tag_names,
            commentList=comment_list,
            isV=is_vip,
            isVIP=is_vip,
            vipLevel=author_info.get('vip_level', 'NONE')
        )

        return JsonTool(
            code=200,
            msg="获取帖子详情成功",
            data={"post": post_detail}
        )

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"获取帖子详情失败: {str(e)}", data=None)


# 获取评论树（用于懒加载）
@router.post("/api/communityview/get_comment_tree", response_model=JsonTool)
async def get_comment_tree(request_data: CommunityCommentRequest):
    try:
        token = request_data.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        post_id = request_data.post_id
        page_size = min(50, max(1, request_data.page_size))
        top_comment_id = request_data.top_comment_id
        cursor_time = request_data.timenode

        print(f"获取评论树 - 帖子ID: {post_id}, 父评论ID: {top_comment_id}, 游标时间: {cursor_time}")

        # 验证用户
        if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
            return JsonTool(code=400, msg="用户不存在", data=None)

        # 如果是查顶级评论，验证帖子
        if top_comment_id is None:
            if not db.query_one("SELECT 1 FROM posts WHERE id = %s", (post_id,)):
                return JsonTool(code=404, msg="帖子不存在", data=None)
            actual_post_id = post_id
        else:
            # 🔥 关键修复：通过 top_comment_id 反查 post_id（确保安全）
            comment_info = db.query_one(
                "SELECT post_id FROM comments WHERE id = %s AND parent_id IS NULL",
                (top_comment_id,)
            )
            if not comment_info:
                return JsonTool(code=404, msg="顶级评论不存在", data=None)
            actual_post_id = str(comment_info["post_id"])

        # 调用辅助函数
        if top_comment_id is None:
            comment_objects = fetch_and_build_comments(
                post_id=actual_post_id,
                parent_id=None,
                cursor_time=cursor_time,
                limit=page_size,
                is_top_level=True,
                current_user_id=user_id  # ← 新增参数
            )
        else:
            comment_objects = fetch_and_build_comments(
                post_id=actual_post_id,
                parent_id=top_comment_id,
                cursor_time=cursor_time,
                limit=page_size,
                is_top_level=False,
                current_user_id=user_id  # ← 新增参数
            )

        has_more = len(comment_objects) == page_size
        next_cursor = comment_objects[-1].time if comment_objects else None

        return JsonTool(
            code=200,
            msg="获取评论列表成功",
            data={
                "comments": [c.dict() for c in comment_objects],
                "has_more": has_more,
                "next_cursor": next_cursor
            }
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"获取评论树时发生异常: {str(e)}")
        return JsonTool(code=500, msg=f"服务器错误: {str(e)}", data=None)

# from pathlib import Path
# # from tokenize import Comment
# import traceback
# from typing import Any, Dict, List, Optional
# from fastapi import APIRouter, FastAPI, Form
# from pydantic import BaseModel
# from fastapi import APIRouter, FastAPI, File, UploadFile, Form
# import uuid
# import os
# from datetime import datetime
# from .schemas import CommunityCommentRequest, CommunityDetail, CommunityRequestComment, CommunityRequestComment2, JsonTool, commentPost, likePost, newPost
# from .schemas import CommunityRequest,Comment
# from sql.mysql_DB import db
# from tools.TokenTools import decode_token_for_auth

# # 创建API路由器
# router = APIRouter()  # 使用APIRouter而不是FastAPI()
# # onlinefile_path = "http://192.168.31.70:8000"

# # 创建一个测试的api
# @router.get("/api/communityview/test", response_model=JsonTool)
# async def test_api():
#     sql = "select * from users where id = %s"
#     user = db.query_one(sql, (22,)) 
#     print(f"查询到的用户信息: {user}")
#     return JsonTool(
#         code=200,
#         msg="社区视图API测试成功",
#         data={"info": "这是一个测试接口"}
#     )

# @router.post("/api/communityview/upload_videos", response_model=JsonTool)
# async def upload_videos(user_id: str = Form(...), videos: List[UploadFile] = File(...)):
#     try:
#         # 检查并创建上传目录
#         current_dir = Path(__file__).parent.parent
#         upload_dir = current_dir / "pet_videos"  # 使用单独的视频目录
#         if not os.path.exists(upload_dir):
#             os.makedirs(upload_dir)
        
#         # 存储上传的视频并生成URL
#         uploaded_urls = []
#         for video in videos:
#             # 验证文件类型 - 检查是否为视频格式
#             if not video.content_type.startswith("video/"):
#                 raise Exception(f"文件 {video.filename} 不是有效的视频格式")
            
#             # 生成当前时间戳
#             timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
#             # 使用 user_id + 时间戳 + 随机数确保唯一性
#             unique_filename = f"{user_id}_{timestamp}_{str(uuid.uuid4())[:8]}{os.path.splitext(video.filename)[1]}"
#             file_path = os.path.join(upload_dir, unique_filename)
            
#             # 保存文件
#             with open(file_path, "wb") as buffer:
#                 buffer.write(await video.read())
            
#             # 生成访问URL - 添加完整的服务器地址
#             video_url = f"/videos/{unique_filename}"
#             uploaded_urls.append(video_url)
        
#         return JsonTool(
#             code=200,
#             msg="视频上传成功",
#             data={"video_urls": uploaded_urls}
#         )
#     except Exception as e:
#         return JsonTool(
#             code=500,
#             msg=f"视频上传失败: {str(e)}",
#             data=None
#         )
# # 定义一个图片上传的API，然后返回图片的URL列表
# @router.post("/api/communityview/upload_images", response_model=JsonTool)
# async def upload_images(user_id: str = Form(...), images: List[UploadFile] = File(...)):
#     try:
#         # 检查并创建上传目录
#         current_dir = Path(__file__).parent.parent  # 获取 back_end 目录
#         upload_dir = current_dir / "pet_images"
#         if not os.path.exists(upload_dir):
#             os.makedirs(upload_dir)
        
#         # 存储上传的图片并生成URL
#         uploaded_urls = []
#         for image in images:
#             # 验证文件类型
#             if not image.content_type.startswith("image/"):
#                 raise Exception(f"文件 {image.filename} 不是有效的图片格式")
            
#             # 生成当前时间戳
#             timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
#             # 使用 user_id + 时间戳 + 随机数确保唯一性
#             unique_filename = f"{user_id}_{timestamp}_{str(uuid.uuid4())[:8]}{os.path.splitext(image.filename)[1]}"
#             file_path = os.path.join(upload_dir, unique_filename)
            
#             # 保存文件
#             with open(file_path, "wb") as buffer:
#                 buffer.write(await image.read())
            
#             # 生成访问URL - 添加完整的服务器地址
#             image_url = f"/images/{unique_filename}"
#             uploaded_urls.append(image_url)
#         return JsonTool(
#             code=200,
#             msg="图片上传成功",
#             data={"image_urls": uploaded_urls}
#         )
#     except Exception as e:
#         return JsonTool(
#             code=500,
#             msg=f"图片上传失败: {str(e)}",
#             data=None
#         )

# # 发布新社区信息
# @router.post("/api/communityview/add_new_community", response_model=JsonTool)
# async def add_community(request_data: CommunityRequest):
#     # 获取请求数据
#     user_id = request_data.user_id
#     content = request_data.content
#     images = request_data.images or []  # 确保是列表
#     tags = request_data.tags or []      # 确保是列表
    
#     print(f"接收到的社区帖子数据: user_id={user_id}, content={content}, images={images}, tags={tags}")
    
#     # 使用user_id查询用户信息
#     sql = "select * from users where id = %s"
#     print(f"正在查询用户信息，user_id: {user_id}")
#     user = db.query_one(sql, (user_id,)) 
#     print(f"查询到的用户信息: {user}")
    
#     if not user:
#         print("用户不存在")
#         # 删除已上传的文件
#         for img_url in images:
#             # 从URL中提取文件名
#             filename = img_url.split('/')[-1]
#             # 确定文件类型并删除相应目录中的文件
#             if any(img_url.endswith(ext) for ext in ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv']):
#                 # 视频文件
#                 video_path = Path(__file__).parent.parent / "pet_videos" / filename
#                 if video_path.exists():
#                     os.remove(video_path)
#                     print(f"已删除视频文件: {filename}")
#             elif any(img_url.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
#                 # 图片文件
#                 image_path = Path(__file__).parent.parent / "pet_images" / filename
#                 if image_path.exists():
#                     os.remove(image_path)
#                     print(f"已删除图片文件: {filename}")
#         return JsonTool(code=201, msg="用户不存在", data=None)

    
#     print("用户存在，继续处理")
    
#     # TODO: 添加你的业务逻辑
#     # 1、保存到posts表中
#     datatime = datetime.now()
#     print(f"准备插入帖子数据，时间: {datatime}")
#     insert_new_post_sql = "INSERT INTO posts (user_id, content, full_content, created_at) VALUES (%s, %s, %s, %s)"
#     result = db.execute(insert_new_post_sql, (user_id, content, content, datatime))
#     print(f"帖子插入结果: {result}")
    
#     # 2、获取新插入的post_id，把图片插入到post_images表中，把标签插入到post_tags表中
#     print(f"正在查询新插入的帖子ID")
#     search_post_id_sql = "SELECT id FROM posts WHERE user_id = %s ORDER BY created_at DESC LIMIT 1"
#     post_id = db.query_one(search_post_id_sql, (user_id,))
#     print(f"获取到的帖子ID: {post_id}")
    
#     if not post_id or len(post_id) == 0:
#         print("无法获取新插入的帖子ID")
#         return JsonTool(code=500, msg="无法获取帖子ID", data=None)
    
#     print(f"开始处理图片，图片数量: {len(images)}")
#     img_sort_order = 0
#     for img_url in images:
#         print(f"正在插入图片: {img_url}，排序: {img_sort_order}")
#         insert_post_image_sql = "INSERT INTO post_images (post_id, image_url, sort_order) VALUES (%s, %s, %s)"
#         db.execute(insert_post_image_sql, (post_id['id'], img_url, img_sort_order))
#         img_sort_order += 1
#         print(f"图片插入完成，当前排序: {img_sort_order}")

#     print(f"开始处理标签，标签数量: {len(tags)}")
#     for tag in tags:
#         print(f"正在插入标签: {tag}")
#         insert_post_tag_sql = "INSERT INTO post_tags (post_id, tag_name) VALUES (%s, %s)"
#         db.execute(insert_post_tag_sql, (post_id['id'], tag))
#         print(f"标签插入完成: {tag}")

#     isVIP = False if user.get('vip_level') == "NONE" else True
#     print(f"用户VIP状态: {isVIP}")
    
#     # 返回成功响应
#     print("准备返回成功响应")
#     response = JsonTool(
#         code=200,
#         msg="社区帖子发布成功",
#         data={
#             "post": newPost(
#                 author=user.get('username') if user and len(user) > 0 else 'Unknown',
#                 avatar=user.get('avatar_url', '') if user and len(user) > 0 and user.get('avatar_url') else '/default-avatar.png',
#                 id=post_id['id'],  # 使用实际获取的帖子ID而不是硬编码的1
#                 time=datatime.strftime('%Y-%m-%d %H:%M:%S'),  # 将datetime转换为字符串
#                 content=content,
#                 fullContent=content,
#                 images=images,
#                 likes=0,
#                 comments=0,
#                 isLiked=False,
#                 isV=isVIP,
#                 isVIP=isVIP,
#                 vipLevel=user.get('vip_level', '') if user and len(user) > 0 else '',
#                 userTags=tags,
#                 commentList=[],
#                 Level=user.get('level', 0) if user and len(user) > 0 else 0
#             ).dict()
#         }
#     )
#     print("响应构建完成，准备返回")
#     return response

# def build_comment_tree_for_post(post_id: str, current_user_id: str, db) -> List[Comment]:
#     """
#     构建帖子的完整评论树（支持任意嵌套，前端扁平展示）
#     返回: List[Comment] —— 每个是顶级评论，其 replies 包含所有子孙（按时间排序）
#     """
#     # 1. 查询该帖子的所有评论
#     all_comments = db.query_all(
#         """
#         SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count,root_id
#         FROM comments 
#         WHERE post_id = %s 
#         ORDER BY created_at ASC
#         """,
#         (post_id,)
#     )
#     if not all_comments:
#         return []
#     # 2. 建立 id -> comment 映射
#     comment_map = {c["id"]: c for c in all_comments}
#     # 3. 找到每条评论的顶级祖先（直接使用 root_id）
#     root_ancestor = {}      # comment_id -> top_level_id
#     top_level_ids = set()
#     for cmt in all_comments:
#         current_id = cmt["id"]
#         root_id = cmt["root_id"]
        
#         # 如果 root_id 为 None，说明数据异常；按逻辑应 fallback 到自己（仅当是顶级评论时）
#         if root_id is None:
#             if cmt["parent_id"] is None:
#                 root_id = current_id  # 顶级评论：root_id 应等于自身 id
#             else:
#                 continue  # 非顶级评论但 root_id 为空，跳过（或可记录日志）
        
#         root_ancestor[current_id] = root_id
#         if cmt["parent_id"] is None:  # 只有 parent_id 为 None 的才是顶级评论
#             top_level_ids.add(current_id)
#     # # 3. 找到每条评论的顶级祖先
#     # root_ancestor = {}      # comment_id -> top_level_id
#     # top_level_ids = set()
#     # for cmt in all_comments:
#     #     current_id = cmt["id"]
#     #     ancestor_id = current_id
#     #     visited = set()  # 防止循环引用
#     #     while True:
#     #         if ancestor_id in visited:
#     #             break  # 循环引用，跳出
#     #         visited.add(ancestor_id)
#     #         current_cmt = comment_map.get(ancestor_id)
#     #         if not current_cmt:
#     #             break
#     #         if current_cmt["parent_id"] is None:
#     #             root_ancestor[current_id] = ancestor_id
#     #             top_level_ids.add(ancestor_id)
#     #             break
#     #         else:
#     #             ancestor_id = current_cmt["parent_id"]
#     # 4. 收集所有相关用户 ID（作者 + 被 @ 的人）
#     user_ids = set()
#     for cmt in all_comments:
#         user_ids.add(cmt["user_id"])
#         if cmt["reply_to_uid"]:
#             user_ids.add(cmt["reply_to_uid"])
#     # 5. 批量查用户信息
#     user_map = {}
#     if user_ids:
#         placeholders = ','.join(['%s'] * len(user_ids))
#         users = db.query_all(
#             f"SELECT id, username, avatar_url, vip_level FROM users WHERE id IN ({placeholders})",
#             list(user_ids)
#         )
#         user_map = {u["id"]: u for u in users}
#     # 6. 按顶级祖先分组
#     groups: Dict[str, List[Dict]] = {}
#     for cmt_id in comment_map:
#         top_id = root_ancestor.get(cmt_id)
#         if top_id and top_id in top_level_ids:
#             groups.setdefault(top_id, []).append(comment_map[cmt_id])
#     # 7. 构建 Comment 对象
#     def make_comment_obj(cmt_row: Dict[str, Any]) -> Comment:
#         author = user_map.get(cmt_row["user_id"], {})
#         reply_to_name = ""
#         if cmt_row["reply_to_uid"]:
#             replied_user = user_map.get(cmt_row["reply_to_uid"])
#             if replied_user:
#                 reply_to_name = replied_user.get("username", "")
#         # TODO: 如需真实点赞状态，可在此查询 user_likes 表
#          # ✅ 新增：获取被回复评论的内容（通过 parent_id）
#         reply_to_content = ""
#         parent_id_raw = cmt_row.get("parent_id")
#         # print(f"原始 parent_id (type={type(parent_id_raw)}): {parent_id_raw}")
#         if parent_id_raw is None:
#             print("→ parent_id 为 None，跳过")
#         else:
#             # 统一转为字符串（无论原先是 int 还是 str）
#             # parent_id_str = str(parent_id_raw).strip()
#             # print(f"转换后的 parent_id_str: '{parent_id_str}'")
#             # print("coment_map:",comment_map)
#             if parent_id_raw in comment_map:
#                 parent_comment = comment_map[parent_id_raw]
#                 reply_to_content = parent_comment.get("content", "")[:100]
#                 # print(f"✅ 成功获取父评论内容: {repr(reply_to_content)}")
#             # else:
#                 # print(f"❌ parent_id '{parent_id_raw}' 不在 comment_map 中！")
#                 # print(f"   comment_map 包含的 IDs（前10个）: {list(comment_map.keys())[:10]}")
#                 # 可选：记录异常（用于排查数据问题）
#                 # logger.warning(f"评论 {cmt_row['id']} 的 parent_id {parent_id_str} 不存在于当前帖子评论中")
#         is_liked = False  # 当前简化处理
#         return Comment(
#             id=str(cmt_row["id"]),
#             author=author.get("username", "未知用户"),
#             avatar=author.get("avatar_url") or "/default-avatar.png",
#             content=cmt_row["content"],
#             time=cmt_row["created_at"].strftime('%Y-%m-%d %H:%M:%S') if cmt_row["created_at"] else "未知时间",
#             likes=cmt_row.get("likes_count", 0),
#             isLiked=is_liked,
#             isVIP=author.get("vip_level") != "NONE",
#             vipLevel=author.get("vip_level", "NONE"),
#             replyToName=reply_to_name,
#             replies=[],  # 扁平化，不嵌套多层
#             replyToContent=reply_to_content,
#             top_comment_id=cmt_row.get("root_id")
#         )
#     # 8. 构建结果：顶级评论 + 所有子孙（按时间排序）
#     result = []
#     # 获取顶级评论的创建时间用于排序
#     top_time_map = {
#         c["id"]: c["created_at"] for c in all_comments if c["id"] in top_level_ids
#     }
#     sorted_top_ids = sorted(top_level_ids, key=lambda tid: top_time_map.get(tid, datetime.min))
#     for top_id in sorted_top_ids:
#         group = groups.get(top_id, [])
#         top_comment = next((c for c in group if c["id"] == top_id), None)
#         if not top_comment:
#             continue
#         # 子评论：排除自己，按时间排序
#         replies = sorted(
#             [c for c in group if c["id"] != top_id],
#             key=lambda x: x["created_at"]
#         )
#         top_obj = make_comment_obj(top_comment)
#         top_obj.replies = [make_comment_obj(r) for r in replies]
#         result.append(top_obj)
#     return result

# def build_comment_tree_paginated(post_id: str, current_user_id: str, db, top_limit: int, replies_limit: int) -> List[Comment]:
#     """
#     分页构建评论树（适配 pawpal.sql 表结构）：
#     - 仅支持两层：顶级评论 + 子评论
#     - 子评论按 B站风格排序（新→旧）
#     - replyToContent 通过 parent_id 查询父评论内容实现
#     """
#     # 1. 查询前 N 条顶级评论（parent_id IS NULL）
#     top_comments = db.query_all(
#         """
#         SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
#         FROM comments 
#         WHERE post_id = %s AND parent_id IS NULL
#         ORDER BY created_at DESC
#         LIMIT %s
#         """,
#         (post_id, top_limit)
#     )
#     if not top_comments:
#         return []

#     # 2. 提取顶级评论 ID 列表（作为 root_id）
#     top_ids = [c["id"] for c in top_comments]

#     # 3. 查询这些顶级评论的所有子评论（parent_id IS NOT NULL）
#     placeholders = ','.join(['%s'] * len(top_ids))
#     sub_comments = db.query_all(
#         f"""
#         SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
#         FROM comments 
#         WHERE post_id = %s AND root_id IN ({placeholders}) AND parent_id IS NOT NULL
#         ORDER BY created_at DESC  -- B站风格：新→旧
#         """,
#         (post_id, *top_ids)
#     )

#     # 4. 按 root_id 分组子评论，并截断到 replies_limit
#     from collections import defaultdict
#     sub_groups = defaultdict(list)
#     for cmt in sub_comments:
#         sub_groups[cmt["root_id"]].append(cmt)

#     for root_id in sub_groups:
#         sub_groups[root_id] = sub_groups[root_id][:replies_limit]

#     # 5. 收集所有需要的用户 ID 和父评论 ID
#     user_ids = set()
#     parent_comment_ids = set()
#     all_comment_ids = set()  # ← 新增：用于查点赞状态

#     # 收集顶级评论的 user_id
#     for cmt in top_comments:
#         user_ids.add(cmt["user_id"])
#         all_comment_ids.add(cmt["id"])  # ← 收集顶级评论 ID

#     # 收集子评论的 user_id + parent_id（用于查父评论）
#     for cmt in sub_comments:
#         user_ids.add(cmt["user_id"])
#         if cmt["parent_id"] is not None:
#             parent_comment_ids.add(cmt["parent_id"])
#         all_comment_ids.add(cmt["id"])  # ← 收集子评论 ID

#     # 6. 批量查询用户信息
#     user_map = {}
#     if user_ids:
#         placeholders_u = ','.join(['%s'] * len(user_ids))
#         users = db.query_all(
#             f"SELECT id, username, avatar_url, vip_level FROM users WHERE id IN ({placeholders_u})",
#             list(user_ids)
#         )
#         user_map = {u["id"]: u for u in users}

#     # 7. 批量查询父评论（即被回复的评论）的内容和作者
#     parent_comment_map = {}  # id -> (user_id, content)
#     if parent_comment_ids:
#         placeholders_p = ','.join(['%s'] * len(parent_comment_ids))
#         parent_rows = db.query_all(
#             f"SELECT id, user_id, content FROM comments WHERE id IN ({placeholders_p})",
#             list(parent_comment_ids)
#         )
#         parent_comment_map = {
#             row["id"]: (row["user_id"], row["content"]) for row in parent_rows
#         }

#     # ✅ 8. 【新增】批量查询当前用户的点赞状态
#     liked_comment_ids = set()
#     if all_comment_ids and current_user_id:
#         placeholders_like = ','.join(['%s'] * len(all_comment_ids))
#         liked_rows = db.query_all(
#             f"SELECT target_id FROM user_likes WHERE user_id = %s AND target_type = 'COMMENT' AND target_id IN ({placeholders_like})",
#             [current_user_id] + list(all_comment_ids)
#         )
#         liked_comment_ids = {row["target_id"] for row in liked_rows}
#     # 9. 构建 Comment 对象
#     def make_comment_obj(cmt_row: dict) -> Comment:
#         author = user_map.get(cmt_row["user_id"], {})
#         reply_to_name = ""
#         reply_to_content = ""
#         # 子评论：通过 parent_id 获取被回复的内容和用户名
#         parent_id = cmt_row.get("parent_id")
#         if parent_id is not None and parent_id in parent_comment_map:
#             parent_user_id, parent_content = parent_comment_map[parent_id]
#             parent_author = user_map.get(parent_user_id, {})
#             reply_to_name = parent_author.get("username", "[已删除]")
#             reply_to_content = parent_content
#         # ✅ 关键：判断当前用户是否点赞了这条评论
#         is_liked = str(cmt_row["id"]) in liked_comment_ids or cmt_row["id"] in liked_comment_ids
#         return Comment(
#             id=str(cmt_row["id"]),
#             author=author.get("username", "未知用户"),
#             avatar=author.get("avatar_url") or "/default-avatar.png",
#             content=cmt_row["content"],
#             time=cmt_row["created_at"].strftime('%Y-%m-%d %H:%M:%S') if cmt_row["created_at"] else "未知时间",
#             likes=cmt_row.get("likes_count", 0),
#             isLiked=is_liked,  # ✅ 现在是真实值！
#             isVIP=author.get("vip_level") != "NONE",
#             vipLevel=author.get("vip_level", "NONE"),
#             replyToName=reply_to_name,
#             replies=[],
#             replyToContent=reply_to_content,
#             top_comment_id=cmt_row.get("root_id") or cmt_row["id"]
#         )

#     # 9. 组装结果
#     result = []
#     for top_cmt in top_comments:
#         top_obj = make_comment_obj(top_cmt)
#         replies = [make_comment_obj(c) for c in sub_groups[top_cmt["id"]]]
#         top_obj.replies = replies
#         result.append(top_obj)

#     return result

# def fetch_and_build_comments(
#     post_id: str,
#     parent_id: Optional[str],
#     cursor_time: Optional[str],
#     limit: int,
#     is_top_level: bool = False,
#     current_user_id: str = None  # ← 新增参数
# ) -> List[Comment]:
#     """
#     B站风格分页加载评论。
#     - 保留所有 content 字段（用于显示当前评论内容）
#     - 不查询 reply_to_content（因数据库无此列）
#     - replyToContent 通过 parent_id 查询父评论的 content 实现
#     """
#     params = []
#     if is_top_level:
#         # 查询顶级评论：有 post_id，无 parent_id
#         base_query = """
#             SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
#             FROM comments 
#             WHERE post_id = %s AND parent_id IS NULL
#         """
#         params = [post_id]
#     else:
#         # 查询子评论：必须同时指定 post_id 和 parent_id（安全且准确）
#         base_query = """
#             SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count, root_id
#             FROM comments 
#             WHERE post_id = %s AND parent_id = %s
#         """
#         params = [post_id, parent_id]

#     # 游标分页：加载比 cursor_time 更早的评论（B站风格）
#     if cursor_time:
#         base_query += " AND created_at < %s"
#         params.append(cursor_time)

#     base_query += " ORDER BY created_at DESC LIMIT %s"
#     params.append(limit)

#     comments = db.query_all(base_query, tuple(params))
#     if not comments:
#         return []

#     # === 批量收集依赖数据 ===
#     user_ids = set()
#     parent_comment_ids = set()  # 用于获取 replyToContent
#     all_comment_ids = set()  # ← 新增

#     for cmt in comments:
#         user_ids.add(cmt["user_id"])
#         all_comment_ids.add(cmt["id"])  # ← 收集 ID
#         if cmt["reply_to_uid"]:
#             user_ids.add(cmt["reply_to_uid"])
#         if cmt["parent_id"] is not None:
#             parent_comment_ids.add(cmt["parent_id"])

#     # 批量查用户信息
#     user_map = {}
#     if user_ids:
#         placeholders = ','.join(['%s'] * len(user_ids))
#         users = db.query_all(
#             f"SELECT id, username, avatar_url, vip_level FROM users WHERE id IN ({placeholders})",
#             list(user_ids)
#         )
#         user_map = {u["id"]: u for u in users}

#     # 批量查父评论的 content（即被回复的内容）
#     parent_content_map = {}  # id -> content
#     if parent_comment_ids:
#         placeholders = ','.join(['%s'] * len(parent_comment_ids))
#         parent_rows = db.query_all(
#             f"SELECT id, content FROM comments WHERE id IN ({placeholders})",
#             list(parent_comment_ids)
#         )
#         parent_content_map = {str(row["id"]): row["content"] for row in parent_rows}

#     # ✅ 【新增】查当前用户的点赞状态
#     liked_comment_ids = set()
#     if all_comment_ids and current_user_id:
#         placeholders = ','.join(['%s'] * len(all_comment_ids))
#         liked_rows = db.query_all(
#             f"SELECT target_id FROM user_likes WHERE user_id = %s AND target_type = 'COMMENT' AND target_id IN ({placeholders})",
#             [current_user_id] + list(all_comment_ids)
#         )
#         liked_comment_ids = {row["target_id"] for row in liked_rows}
#     # === 构建 Comment 对象 ===
#     def make_comment_obj(cmt_row):
#         author = user_map.get(cmt_row["user_id"], {})
#         own_content = cmt_row["content"]
#         reply_to_name = ""
#         if cmt_row["reply_to_uid"]:
#             replied_user = user_map.get(cmt_row["reply_to_uid"])
#             if replied_user:
#                 reply_to_name = replied_user.get("username", "")
#         reply_to_content = ""
#         if cmt_row["parent_id"] is not None:
#             reply_to_content = parent_content_map.get(str(cmt_row["parent_id"]), "")
#         # ✅ 判断是否点赞
#         is_liked = str(cmt_row["id"]) in liked_comment_ids or cmt_row["id"] in liked_comment_ids
#         return Comment(
#             id=str(cmt_row["id"]),
#             author=author.get("username", "未知用户"),
#             avatar=author.get("avatar_url") or "/default-avatar.png",
#             content=own_content,
#             time=cmt_row["created_at"].strftime('%Y-%m-%d %H:%M:%S') if cmt_row["created_at"] else "未知时间",
#             likes=cmt_row.get("likes_count", 0),
#             isLiked=is_liked,  # ✅
#             isVIP=author.get("vip_level") != "NONE",
#             vipLevel=author.get("vip_level", "NONE"),
#             replyToName=reply_to_name,
#             replies=[],
#             replyToContent=reply_to_content,
#             top_comment_id=cmt_row.get("root_id") or cmt_row["id"]
#         )

#     return [make_comment_obj(c) for c in comments]

# # 获取社区帖子
# @router.post("/api/communityview/get_community_posts", response_model=JsonTool)
# async def get_community_posts(request_data: CommunityRequestComment):
#     print(f"开始获取社区帖子，用户ID: {request_data.user_id}")
#     try:
#         user_id = request_data.user_id
#         num = request_data.num
#         offset = getattr(request_data, 'offset', 1)  # 注意：这里改为从1开始更符合分页习惯
#         exclude_post_ids = getattr(request_data, 'exclude_post_ids', []) or []
#         if num <= 0 or not user_id:
#             print("参数验证失败，用户ID为空或数量小于等于0")
#             return JsonTool(code=400, msg="请求参数无效", data=None)
#         # 查询用户是否存在
#         print(f"正在查询用户是否存在，用户ID: {user_id}")
#         user_result = db.query_one("SELECT * FROM users WHERE id = %s", (str(user_id),))
#         if not user_result:
#             print("用户不存在")
#             return JsonTool(code=400, msg="用户不存在", data=None)
#         print(f"用户存在，用户信息: {user_result}")
#         # 构建帖子查询 SQL
#         posts_query = "SELECT * FROM posts WHERE 1=1"
#         params = []
#         if exclude_post_ids:
#             placeholders = ','.join(['%s'] * len(exclude_post_ids))
#             posts_query += f" AND id NOT IN ({placeholders})"
#             params.extend(exclude_post_ids)
#         # 分页：offset 通常从 1 开始，所以 LIMIT/OFFSET 计算为 (offset-1)*num
#         posts_query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
#         params.extend([num, (offset - 1) * num])
#         print(f"帖子查询SQL: {posts_query}, 参数: {params}")
#         posts = db.query_all(posts_query, params)
#         print(f"查询到帖子数量: {len(posts) if posts else 0}")
#         post_list = []
#         for post in posts:
#             post_id = post["id"]
#             print(f"正在处理帖子，ID: {post_id}")
#             # 查询图片
#             images = db.query_all(
#                 "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order ASC",
#                 (post_id,)
#             )
#             image_urls = [img["image_url"] for img in images]
#             # 查询标签
#             tags = db.query_all(
#                 "SELECT tag_name FROM post_tags WHERE post_id = %s",
#                 (post_id,)
#             )
#             tag_names = [tag["tag_name"] for tag in tags]
#             # 查询帖子点赞数 & 当前用户是否点赞
#             like_records = db.query_all(
#                 "SELECT user_id FROM user_likes WHERE target_id = %s AND target_type = 'POST'",
#                 (post_id,)
#             )
#             like_count = len(like_records)
#             is_liked = any(like["user_id"] == user_id for like in like_records)
#             print("like_count:", like_count)
#             # 构建完整评论树（关键修正点）
#             total_comments = build_comment_tree_for_post(post_id, user_id, db)
#             total_comment_count = db.query_one("SELECT COUNT(*) AS cnt FROM comments WHERE post_id = %s",(post_id,))["cnt"]
#             # 查询帖子作者信息
#             author_info = db.query_one(
#                 "SELECT nickname, avatar_url, vip_level FROM users WHERE id = %s",
#                 (post["user_id"],)
#             )
#             if not author_info:
#                 author_info = {"nickname": "未知用户", "avatar_url": "/default-avatar.png", "vip_level": "NONE"}
#             is_vip = author_info.get('vip_level', 'NONE') != "NONE"
#             post_list.append(
#                 newPost(
#                     author=author_info.get('nickname'),
#                     avatar=author_info.get('avatar_url') or "/default-avatar.png",
#                     id=post_id,
#                     time=post["created_at"].strftime('%Y-%m-%d %H:%M:%S') if post.get("created_at") else "未知时间",
#                     content=post.get('content', ''),
#                     fullContent=post.get('content', ''),
#                     images=image_urls,
#                     likes=like_count,
#                     comments=total_comment_count,  # 顶级评论数（或可改为总评论数）
#                     isLiked=is_liked,
#                     isV=is_vip,
#                     isVIP=is_vip,
#                     vipLevel=author_info.get('vip_level', 'NONE'),
#                     userTags=tag_names,
#                     commentList=total_comments,  # ✅ 正确的评论树结构
#                 ).dict()
#             )
#         print(f"帖子列表构建完成，共 {len(post_list)} 个帖子")
#         return JsonTool(code=200, msg="获取帖子成功", data={"posts": post_list})
#     except Exception as e:
#         traceback.print_exc()
#         print(f"获取帖子时发生异常: {str(e)}")
#         return JsonTool(code=500, msg=f"获取帖子失败: {str(e)}", data=None)

# # 根据时间进行分页，获取社区帖子（含每帖最多5条评论）
# @router.post("/api/communityview/get_community_posts_by_time", response_model=JsonTool)
# async def get_community_posts_by_time(request_data: CommunityRequestComment2):
#     try:
#         user_id = request_data.user_id
#         limit = request_data.limit
#         timenode = request_data.timenode
#         exclude_post_ids = request_data.exclude_post_ids or []
#         datatype = request_data.datatype

#         if limit <= 0 or not user_id:
#             return JsonTool(code=400, msg="请求参数无效", data=None)

#         if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # === 第一步：获取帖子主列表 ===
#         posts_query = "SELECT * FROM posts WHERE 1=1"
#         params = []

#         if exclude_post_ids:
#             placeholders = ','.join(['%s'] * len(exclude_post_ids))
#             posts_query += f" AND id NOT IN ({placeholders})"
#             params.extend(exclude_post_ids)

#         if timenode:
#             if datatype == "newer":
#                 posts_query += " AND created_at > %s ORDER BY created_at ASC"
#             else:
#                 posts_query += " AND created_at < %s ORDER BY created_at DESC"
#             params.append(timenode)
#         else:
#             posts_query += " ORDER BY created_at DESC"

#         posts_query += " LIMIT %s"
#         params.append(limit)

#         posts = db.query_all(posts_query, params)
#         if not posts:
#             return JsonTool(code=200, msg="无更多帖子", data={"posts": []})

#         post_ids = [p["id"] for p in posts]
#         author_ids = {p["user_id"] for p in posts}

#         # === 第二步：批量查询关联数据 ===

#         # 1. 图片
#         image_map = {}
#         if post_ids:
#             images = db.query_all("""
#                 SELECT post_id, image_url 
#                 FROM post_images 
#                 WHERE post_id IN ({})
#                 ORDER BY post_id, sort_order
#             """.format(','.join(['%s'] * len(post_ids))), post_ids)
#             for img in images:
#                 image_map.setdefault(img["post_id"], []).append(img["image_url"])

#         # 2. 标签
#         tag_map = {}
#         if post_ids:
#             tags = db.query_all("""
#                 SELECT post_id, tag_name 
#                 FROM post_tags 
#                 WHERE post_id IN ({})
#             """.format(','.join(['%s'] * len(post_ids))), post_ids)
#             for tag in tags:
#                 tag_map.setdefault(tag["post_id"], []).append(tag["tag_name"])

#         # 3. 点赞
#         like_map = {}
#         if post_ids:
#             likes = db.query_all("""
#                 SELECT target_id AS post_id, user_id 
#                 FROM user_likes 
#                 WHERE target_type = 'POST' AND target_id IN ({})
#             """.format(','.join(['%s'] * len(post_ids))), post_ids)
#             for like in likes:
#                 pid = like["post_id"]
#                 if pid not in like_map:
#                     like_map[pid] = {"count": 0, "is_liked": False}
#                 like_map[pid]["count"] += 1
#                 if like["user_id"] == user_id:
#                     like_map[pid]["is_liked"] = True

#         # 4. 作者信息
#         author_map = {}
#         if author_ids:
#             authors = db.query_all("""
#                 SELECT id, nickname, avatar_url, vip_level 
#                 FROM users 
#                 WHERE id IN ({})
#             """.format(','.join(['%s'] * len(author_ids))), list(author_ids))
#             for au in authors:
#                 author_map[au["id"]] = au

#         # 5. 评论总数（用于显示数字）
#         comment_count_map = {}
#         if post_ids:
#             counts = db.query_all("""
#                 SELECT post_id, COUNT(*) AS cnt 
#                 FROM comments 
#                 WHERE post_id IN ({})
#                 GROUP BY post_id
#             """.format(','.join(['%s'] * len(post_ids))), post_ids)
#             for c in counts:
#                 comment_count_map[c["post_id"]] = c["cnt"]

#         # === 第三步：批量查询每帖最多5条评论（关键！）===
#         recent_comments_map = {}  # post_id -> List[comment_row]
#         all_comment_user_ids = set()
#         if post_ids:
#             # 使用窗口函数或子查询获取每帖最新5条
#             # 兼容 MySQL 5.7+（无窗口函数）的写法
#             comments = db.query_all("""
#                 SELECT c1.id, c1.post_id, c1.user_id, c1.reply_to_uid, 
#                        c1.content, c1.created_at, c1.likes_count
#                 FROM comments c1
#                 WHERE c1.post_id IN ({})
#                   AND (
#                     SELECT COUNT(*)
#                     FROM comments c2
#                     WHERE c2.post_id = c1.post_id
#                       AND c2.created_at >= c1.created_at
#                   ) <= 3
#                 ORDER BY c1.post_id, c1.created_at DESC
#             """.format(','.join(['%s'] * len(post_ids))), post_ids)

#             for cmt in comments:
#                 post_id = cmt["post_id"]
#                 recent_comments_map.setdefault(post_id, []).append(cmt)
#                 all_comment_user_ids.add(cmt["user_id"])
#                 if cmt["reply_to_uid"]:
#                     all_comment_user_ids.add(cmt["reply_to_uid"])

#             # 确保顺序是“最新在前”，但前端可能需要反转？按你需求
#             for pid in recent_comments_map:
#                 recent_comments_map[pid].sort(key=lambda x: x["created_at"], reverse=True)

#         # 6. 批量查评论相关用户（作者 + 被回复者）
#         user_map = {}
#         if all_comment_user_ids:
#             users = db.query_all("""
#                 SELECT id, username, avatar_url, vip_level 
#                 FROM users 
#                 WHERE id IN ({})
#             """.format(','.join(['%s'] * len(all_comment_user_ids))), list(all_comment_user_ids))
#             user_map = {u["id"]: u for u in users}

#         # === 第四步：组装数据 ===
#         post_list = []
#         for post in posts:
#             post_id = post["id"]
#             author_id = post["user_id"]

#             # 基础数据
#             image_urls = image_map.get(post_id, [])
#             tag_names = tag_map.get(post_id, [])
#             like_info = like_map.get(post_id, {"count": 0, "is_liked": False})
#             total_comment_count = comment_count_map.get(post_id, 0)

#             author_info = author_map.get(author_id, {
#                 "nickname": "未知用户",
#                 "avatar_url": "/default-avatar.png",
#                 "vip_level": "NONE"
#             })
#             is_vip = author_info.get('vip_level', 'NONE') != "NONE"

#             # 组装前5条评论（扁平列表）
#             comment_objs = []
#             for cmt in recent_comments_map.get(post_id, []):
#                 author = user_map.get(cmt["user_id"], {})
#                 reply_to_name = ""
#                 reply_to_content = ""  # 注意：这里不查父评论内容（性能考虑）

#                 if cmt["reply_to_uid"]:
#                     replied_user = user_map.get(cmt["reply_to_uid"])
#                     if replied_user:
#                         reply_to_name = replied_user.get("username", "")

#                 # 是否被当前用户点赞（简化：可后续扩展）
#                 is_liked = False  # 如需真实状态，可加 user_comment_likes 表查询

#                 comment_objs.append(
#                     Comment(
#                         id=str(cmt["id"]),
#                         author=author.get("username", "未知用户"),
#                         avatar=author.get("avatar_url") or "/default-avatar.png",
#                         content=cmt["content"],
#                         time=cmt["created_at"].strftime('%Y-%m-%d %H:%M:%S'),
#                         likes=cmt.get("likes_count", 0),
#                         isLiked=is_liked,
#                         isVIP=author.get("vip_level") != "NONE",
#                         vipLevel=author.get("vip_level", "NONE"),
#                         replyToName=reply_to_name,
#                         replies=[],  # 扁平化，不嵌套
#                         replyToContent=reply_to_content,  # 若需内容，需额外查，建议省略
#                     )
#                 )

#             post_list.append(
#                 newPost(
#                     author=author_info.get('nickname'),
#                     avatar=author_info.get('avatar_url') or "/default-avatar.png",
#                     id=post_id,
#                     time=post["created_at"].strftime('%Y-%m-%d %H:%M:%S') if post.get("created_at") else "未知时间",
#                     content=post.get('content', ''),
#                     fullContent=post.get('content', ''),
#                     images=image_urls,
#                     likes=like_info["count"],
#                     comments=total_comment_count,
#                     isLiked=like_info["is_liked"],
#                     isV=is_vip,
#                     isVIP=is_vip,
#                     vipLevel=author_info.get('vip_level', 'NONE'),
#                     userTags=tag_names,
#                     commentList=comment_objs,  # ✅ 只有最多5条，且无嵌套
#                 ).dict()
#             )

#         return JsonTool(
#             code=200,
#             msg="获取帖子成功",
#             data={"posts": post_list}
#         )

#     except Exception as e:
#         traceback.print_exc()
#         return JsonTool(code=500, msg=f"获取帖子失败: {str(e)}", data=None)

# # 点赞帖子、评论，包括点赞和取消点赞
# @router.post("/api/communityview/like_post", response_model=JsonTool)
# async def like_post(request: likePost):
#     try:
#         user_id = request.user_id
#         target_id = request.target_id
#         target_type = request.target_type  # 'POST' or 'COMMENT'

#         print(f"点赞请求 - 用户ID: {user_id}, 目标ID: {target_id}, 类型: {target_type}")

#         # 检查用户是否存在
#         user_result = db.query_one("SELECT * FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print("用户不存在")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 检查目标是否存在，并获取当前 likes_count
#         target_exists = False
#         current_likes = 0
#         if target_type == 'POST':
#             target_result = db.query_one("SELECT id, likes_count FROM posts WHERE id = %s", (target_id,))
#             if target_result:
#                 target_exists = True
#                 current_likes = target_result.get('likes_count', 0)
#         elif target_type == 'COMMENT':
#             target_result = db.query_one("SELECT id, likes_count FROM comments WHERE id = %s", (target_id,))
#             if target_result:
#                 target_exists = True
#                 current_likes = target_result.get('likes_count', 0)
#         else:
#             return JsonTool(code=400, msg=f"不支持的目标类型: {target_type}", data=None)

#         if not target_exists:
#             return JsonTool(code=400, msg=f"{target_type} 不存在", data=None)

#         # 检查是否已点赞
#         existing_like = db.query_one(
#             "SELECT * FROM user_likes WHERE user_id = %s AND target_id = %s AND target_type = %s",
#             (user_id, target_id, target_type)
#         )

#         if existing_like:
#             # ========== 取消点赞 ==========
#             result = db.execute(
#                 "DELETE FROM user_likes WHERE user_id = %s AND target_id = %s AND target_type = %s",
#                 (user_id, target_id, target_type)
#             )
#             if result > 0:
#                 # 更新对应表的 likes_count
#                 new_like_count = max(0, current_likes - 1)
#                 if target_type == 'POST':
#                     db.execute(
#                         "UPDATE posts SET likes_count = %s WHERE id = %s",
#                         (new_like_count, target_id)
#                     )
#                 elif target_type == 'COMMENT':
#                     db.execute(
#                         "UPDATE comments SET likes_count = %s WHERE id = %s",
#                         (new_like_count, target_id)
#                     )

#                 return JsonTool(
#                     code=200,
#                     msg="取消点赞成功",
#                     data={
#                         "target_id": target_id,
#                         "target_type": target_type,
#                         "is_liked": False,
#                         "like_count": new_like_count
#                     }
#                 )
#             else:
#                 return JsonTool(code=500, msg="取消点赞失败", data=None)
#         else:
#             # ========== 点赞 ==========
#             result = db.execute(
#                 "INSERT INTO user_likes (user_id, target_id, target_type, created_at) VALUES (%s, %s, %s, %s)",
#                 (user_id, target_id, target_type, datetime.now())
#             )
#             if result > 0:
#                 # 更新对应表的 likes_count
#                 new_like_count = current_likes + 1
#                 if target_type == 'POST':
#                     db.execute(
#                         "UPDATE posts SET likes_count = %s WHERE id = %s",
#                         (new_like_count, target_id)
#                     )
#                 elif target_type == 'COMMENT':
#                     db.execute(
#                         "UPDATE comments SET likes_count = %s WHERE id = %s",
#                         (new_like_count, target_id)
#                     )

#                 return JsonTool(
#                     code=200,
#                     msg="点赞成功",
#                     data={
#                         "target_id": target_id,
#                         "target_type": target_type,
#                         "is_liked": True,
#                         "like_count": new_like_count
#                     }
#                 )
#             else:
#                 return JsonTool(code=500, msg="点赞失败", data=None)

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         print(f"点赞时发生异常: {str(e)}")
#         return JsonTool(code=500, msg=f"点赞失败: {str(e)}", data=None)

# # 评论帖子、评论父评论（需要修改添加一个root_id来确定处于那个顶级评论下）
# @router.post("/api/communityview/comment_post", response_model=JsonTool)
# async def comment_post(request: commentPost):
#     try:
#         post_id = request.post_id
#         user_id = request.user_id
#         parent_id = request.parent_id      # 可为 None（顶级评论）
#         reply_to_id = request.reply_to_id  # 被 @ 的用户 ID
#         content = request.content.strip()
#         root_id = request.root_id          # 核心字段：必须为 None 或 非空字符串

#         print(f"开始处理评论请求 - 帖子ID: {post_id}, 用户ID: {user_id}, 父评论ID: {parent_id}, 回复用户ID: {reply_to_id}")
#         print(f"评论内容: {content}, root_id: {root_id}")

#         # --- 参数基础校验 ---
#         if not post_id or not user_id or not content:
#             print("参数校验失败 - 缺少必要参数")
#             return JsonTool(code=400, msg="缺少必要参数", data=None)

#         if len(content) > 500:
#             print(f"参数校验失败 - 评论内容长度超出限制: {len(content)} 字符")
#             return JsonTool(code=400, msg="评论内容不能超过500字", data=None)

#         # --- 严格校验 root_id 格式 ---
#         if root_id is not None:
#             if not isinstance(root_id, str) or not root_id.strip():
#                 print(f"参数校验失败 - root_id 格式错误: {root_id}")
#                 return JsonTool(code=400, msg="root_id 必须为 null 或非空字符串", data=None)
#             root_id = root_id.strip()  # 确保无多余空格
#             print(f"root_id 校验通过: {root_id}")

#         # --- 验证用户和帖子 ---
#         print(f"正在查询用户信息，用户ID: {user_id}")
#         user_info = db.query_one("SELECT username, avatar_url, vip_level FROM users WHERE id = %s", (user_id,))
#         if not user_info:
#             print(f"用户不存在，用户ID: {user_id}")
#             return JsonTool(code=400, msg="用户不存在", data=None)
#         print(f"用户信息查询成功: {user_info['username']}")

#         print(f"正在查询帖子信息，帖子ID: {post_id}")
#         if not db.query_one("SELECT 1 FROM posts WHERE id = %s", (post_id,)):
#             print(f"帖子不存在，帖子ID: {post_id}")
#             return JsonTool(code=404, msg="帖子不存在", data=None)
#         print(f"帖子存在，帖子ID: {post_id}")

#         # --- 核心逻辑：根据 parent_id 判断评论类型 ---
#         actual_reply_to_uid = None
#         actual_root_id = None  # 最终写入数据库的值

#         print(f"开始处理评论类型判断 - parent_id: {parent_id}")
#         if parent_id is None:
#             # ========== 发表顶级评论 ==========
#             print("处理顶级评论逻辑")
#             if root_id is not None:
#                 print(f"顶级评论的 root_id 不为 null，参数错误: {root_id}")
#                 return JsonTool(code=400, msg="顶级评论的 root_id 必须为 null", data=None)
#             # actual_root_id 保持为 None
#             print("顶级评论参数校验通过")
#         else:
#             # ========== 发表子评论 ==========
#             print(f"处理子评论逻辑，parent_id: {parent_id}")
#             if root_id is None:
#                 print("子评论的 root_id 为 null，参数错误")
#                 return JsonTool(code=400, msg="回复评论时 root_id 不能为空", data=None)

#             # 1. 验证父评论存在且属于当前帖子
#             print(f"验证父评论是否存在，父评论ID: {parent_id}，帖子ID: {post_id}")
#             parent_comment = db.query_one(
#                 "SELECT user_id FROM comments WHERE id = %s AND post_id = %s",
#                 (parent_id, post_id)
#             )
#             if not parent_comment:
#                 print(f"父评论不存在或不属于此帖子 - 父评论ID: {parent_id}，帖子ID: {post_id}")
#                 return JsonTool(code=400, msg="父评论不存在或不属于此帖子", data=None)
#             print(f"父评论存在，被回复用户ID: {parent_comment['user_id']}")

#             # 2. 验证 root_id 是有效的顶级评论（属于当前帖子且 parent_id IS NULL）
#             print(f"验证 root_id 是否为有效顶级评论，root_id: {root_id}，帖子ID: {post_id}")
#             valid_root = db.query_one(
#                 "SELECT 1 FROM comments WHERE id = %s AND post_id = %s AND parent_id IS NULL",
#                 (root_id, post_id)
#             )
#             if not valid_root:
#                 print(f"无效的 root_id: {root_id}")
#                 return JsonTool(code=400, msg="无效的 root_id", data=None)
#             print(f"root_id 验证通过: {root_id}")

#             # 3. 设置被回复的用户ID
#             actual_reply_to_uid = reply_to_id if reply_to_id is not None else parent_comment["user_id"]
#             actual_root_id = root_id  # 此时 root_id 已确认为有效非空字符串
#             print(f"设置被回复用户ID: {actual_reply_to_uid}，实际root_id: {actual_root_id}")

#         # --- 写入数据库 ---
#         print("准备写入数据库")
#         timedata = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
#         print(f"评论时间: {timedata}")
#         new_comment_id = db.insert_and_get_id("""
#             INSERT INTO comments (post_id, user_id, parent_id, reply_to_uid, root_id, content, created_at)
#             VALUES (%s, %s, %s, %s, %s, %s, %s)
#         """, (post_id, user_id, parent_id, actual_reply_to_uid, actual_root_id, content, timedata))

#         if not new_comment_id:
#             print("数据库插入失败，无法获取新评论ID")
#             return JsonTool(code=500, msg="评论发布失败", data=None)
#         print(f"评论插入成功，新评论ID: {new_comment_id}")

#         # === 新增：查询父评论信息以填充 replyToName 和 replyToContent ===
#         reply_to_name = None
#         reply_to_content = None

#         if parent_id is not None:
#             print(f"查询父评论信息，父评论ID: {parent_id}")
#             parent_info = db.query_one(
#                 """
#                 SELECT u.username AS author, c.content 
#                 FROM comments c 
#                 JOIN users u ON c.user_id = u.id 
#                 WHERE c.id = %s
#                 """,
#                 (parent_id,)  # 👈 关键：这里必须是 parent_id！
#             )
#             if parent_info:
#                 reply_to_name = parent_info["author"]
#                 reply_to_content = parent_info["content"]
#                 print(f"获取父评论信息成功 - 作者: {reply_to_name}，内容: {reply_to_content[:50]}...")
#             else:
#                 reply_to_name = "[已删除]"
#                 reply_to_content = ""
#                 print("父评论已被删除")

#         print(f"评论对象构建前的数据 - ID: {new_comment_id}, 作者: {user_info['username']}, 内容: {content[:30]}...")

#         # === 构建返回对象 ===
#         new_comment_obj = Comment(
#             id=str(new_comment_id),
#             author=user_info["username"],
#             avatar=user_info["avatar_url"] or "/default-avatar.png",
#             content=content,
#             time=timedata,
#             likes=0,
#             isLiked=False,
#             isVIP=user_info["vip_level"] != "NONE",
#             vipLevel=user_info["vip_level"] or "NONE",
#             replyToName=reply_to_name,          # 👈 填充
#             replies=[],
#             replyToContent=reply_to_content,    # 👈 填充
#             top_comment_id=actual_root_id       # 用于前端识别所属顶级评论
#         )

#         print(f"评论成功发布 - 评论ID: {new_comment_id}，帖子ID: {post_id}")
#         return JsonTool(code=200, msg="评论成功", data=new_comment_obj.dict())

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         print(f"评论发布时发生异常: {str(e)}")
#         return JsonTool(code=500, msg=f"评论失败: {str(e)}", data=None)
# # 获取用户点赞历史（获取历史记录的view）
# @router.post("/api/communityview/get_like_history", response_model=JsonTool)
# async def get_like_history(request_data: str):
#     try:
#         user_id = request_data
        
#         print(f"开始获取点赞历史，用户ID: {user_id}")
        
#         # 检查用户是否存在
#         user_query = "SELECT * FROM users WHERE id = %s"
#         user_result = db.query_one(user_query, (user_id,))
#         if not user_result:
#             print("用户不存在")
#             return JsonTool(
#                 code=400,
#                 msg="用户不存在",
#                 data=None
#             )
        
#         # 查询用户点赞过的所有帖子
#         like_history_query = """
#             SELECT ul.*, p.id as post_id, p.content as post_content, p.created_at as post_created_at,
#                    u.username as post_author, u.avatar_url as post_author_avatar
#             FROM user_likes ul
#             JOIN posts p ON ul.target_id = p.id
#             JOIN users u ON p.user_id = u.id
#             WHERE ul.user_id = %s AND ul.target_type = 'POST'
#             ORDER BY ul.created_at DESC
#             LIMIT 20  -- 限制返回数量
#         """
        
#         like_history = db.query_all(like_history_query, (user_id,))
        
#         print(f"查询到点赞历史数量: {len(like_history) if like_history else 0}")
        
#         # 构建返回数据
#         history_list = []
#         if like_history:
#             for item in like_history:
#                 history_item = {
#                     "id": str(item["id"]),
#                     "post_id": item["post_id"],
#                     "post_author": item["post_author"],
#                     "post_author_avatar": item["post_author_avatar"] or "/default-avatar.png",
#                     "post_content": item["post_content"],
#                     "post_title": item["post_content"][:50] + "..." if len(item["post_content"]) > 50 else item["post_content"],
#                     "post_image_url": "",  # 如果需要可以查询post_images表
#                     "created_at": item["created_at"].strftime('%Y-%m-%d %H:%M:%S'),
#                     "target_type": "POST"
#                 }
                
#                 # 查询帖子的首张图片
#                 first_image_query = "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order LIMIT 1"
#                 first_image = db.query_one(first_image_query, (item["post_id"],))
#                 if first_image:
#                     history_item["post_image_url"] = first_image["image_url"]
                
#                 history_list.append(history_item)
        
#         return JsonTool(
#             code=200,
#             msg="获取点赞历史成功",
#             data={
#                 "history": history_list
#             }
#         )
        
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         print(f"获取点赞历史时发生异常: {str(e)}")
#         return JsonTool(
#             code=500,
#             msg=f"获取点赞历史失败: {str(e)}",
#             data=None
#         )

# # 获取用户评论历史（获取历史记录的view）
# @router.post("/api/communityview/get_comment_history", response_model=JsonTool)
# async def get_comment_history(request_data: str):
#     try:
#         user_id = request_data
        
#         print(f"开始获取评论历史，用户ID: {user_id}")
        
#         # 检查用户是否存在
#         user_query = "SELECT * FROM users WHERE id = %s"
#         user_result = db.query_one(user_query, (user_id,))
#         if not user_result:
#             print("用户不存在")
#             return JsonTool(
#                 code=400,
#                 msg="用户不存在",
#                 data=None
#             )
        
#         # 查询用户发布的所有评论
#         comment_history_query = """
#             SELECT c.*, p.id as post_id, p.content as post_content, p.created_at as post_created_at,
#                    u.username as post_author, u.avatar_url as post_author_avatar
#             FROM comments c
#             JOIN posts p ON c.post_id = p.id
#             JOIN users u ON p.user_id = u.id
#             WHERE c.user_id = %s
#             ORDER BY c.created_at DESC
#             LIMIT 20  -- 限制返回数量
#         """
        
#         comment_history = db.query_all(comment_history_query, (user_id,))
        
#         print(f"查询到评论历史数量: {len(comment_history) if comment_history else 0}")
        
#         # 构建返回数据
#         history_list = []
#         if comment_history:
#             for item in comment_history:
#                 history_item = {
#                     "id": str(item["id"]),
#                     "post_id": item["post_id"],
#                     "post_author": item["post_author"],
#                     "post_author_avatar": item["post_author_avatar"] or "/default-avatar.png",
#                     "post_content": item["post_content"],
#                     "post_title": item["post_content"][:50] + "..." if len(item["post_content"]) > 50 else item["post_content"],
#                     "post_image_url": "",  # 如果需要可以查询post_images表
#                     "comment_content": item["content"],
#                     "created_at": item["created_at"].strftime('%Y-%m-%d %H:%M:%S')
#                 }
                
#                 # 查询帖子的首张图片
#                 first_image_query = "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order LIMIT 1"
#                 first_image = db.query_one(first_image_query, (item["post_id"],))
#                 if first_image:
#                     history_item["post_image_url"] = first_image["image_url"]
                
#                 history_list.append(history_item)
        
#         return JsonTool(
#             code=200,
#             msg="获取评论历史成功",
#             data={
#                 "history": history_list
#             }
#         )
        
#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         print(f"获取评论历史时发生异常: {str(e)}")
#         return JsonTool(
#             code=500,
#             msg=f"获取评论历史失败: {str(e)}",
#             data=None
#         )
    
# # 根据帖子id来获取帖子详情
# @router.post("/api/communityview/get_post_detail", response_model=JsonTool)
# async def get_post_detail(request_data: CommunityDetail):
#     try:
#         post_id = request_data.post_id
#         user_id = request_data.user_id
#         top_limit = request_data.top_limit
#         replies_limit = request_data.replies_limit

#         print(f"开始获取帖子详情 - 帖子ID: {post_id}, 用户ID: {user_id}")
#         # 1. 验证用户是否存在
#         if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 查询帖子主信息
#         post = db.query_one("SELECT * FROM posts WHERE id = %s", (post_id,))
#         if not post:
#             return JsonTool(code=404, msg="帖子不存在", data=None)
#         author_id = post["user_id"]

#         # 3. 查询作者信息
#         author_info = db.query_one(
#             "SELECT nickname, avatar_url, vip_level FROM users WHERE id = %s",
#             (author_id,)
#         )
#         if not author_info:
#             author_info = {"nickname": "未知用户", "avatar_url": "/default-avatar.png", "vip_level": "NONE"}

#         is_vip = author_info.get('vip_level', 'NONE') != "NONE"

#         # 4. 查询图片
#         images = db.query_all(
#             "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order ASC",
#             (post_id,)
#         )
#         image_urls = [img["image_url"] for img in images]

#         # 5. 查询标签
#         tags = db.query_all(
#             "SELECT tag_name FROM post_tags WHERE post_id = %s",
#             (post_id,)
#         )
#         tag_names = [tag["tag_name"] for tag in tags]

#         # 6. 查询点赞信息
#         like_records = db.query_all(
#             "SELECT user_id FROM user_likes WHERE target_id = %s AND target_type = 'POST'",
#             (post_id,)
#         )
#         like_count = len(like_records)
#         is_liked = any(like["user_id"] == user_id for like in like_records)

#         # 7. 查询评论总数（用于显示数字）
#         total_comment_count = db.query_one(
#             "SELECT COUNT(*) AS cnt FROM comments WHERE post_id = %s",
#             (post_id,)
#         )["cnt"]

#         # 8. 构建完整评论树（使用已有函数）
#         # comment_list = build_comment_tree_for_post(post_id, user_id, db)
#         comment_list = build_comment_tree_paginated(post_id, user_id, db, top_limit, replies_limit)

#         # 9. 组装 newPost 对象
#         post_detail = newPost(
#             id=post_id,
#             author=author_info.get('nickname'),
#             avatar=author_info.get('avatar_url') or "/default-avatar.png",
#             time=post["created_at"].strftime('%Y-%m-%d %H:%M:%S') if post.get("created_at") else "未知时间",
#             content=post.get('content', ''),
#             fullContent=post.get('content', ''),
#             images=image_urls,
#             likes=like_count,
#             comments=total_comment_count,
#             isLiked=is_liked,
#             userTags=tag_names,
#             commentList=comment_list,
#             isV=is_vip,
#             isVIP=is_vip,
#             vipLevel=author_info.get('vip_level', 'NONE')
#         )

#         return JsonTool(
#             code=200,
#             msg="获取帖子详情成功",
#             data={"post": post_detail}
#         )

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         print(f"获取帖子详情时发生异常: {str(e)}")
#         return JsonTool(
#             code=500,
#             msg=f"获取帖子详情失败: {str(e)}",
#             data=None
#         )
    
# # 假设你的 request_data 新增了两个字段（见下方说明）
# @router.post("/api/communityview/get_comment_tree", response_model=JsonTool)
# async def get_comment_tree(request_data: CommunityCommentRequest):
#     try:
#         user_id = request_data.user_id
#         post_id = request_data.post_id
#         page_size = min(50, max(1, request_data.page_size))
#         top_comment_id = request_data.top_comment_id
#         cursor_time = request_data.timenode

#         print(f"获取评论树 - 帖子ID: {post_id}, 父评论ID: {top_comment_id}, 游标时间: {cursor_time}")

#         # 验证用户
#         if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 如果是查顶级评论，验证帖子
#         if top_comment_id is None:
#             if not db.query_one("SELECT 1 FROM posts WHERE id = %s", (post_id,)):
#                 return JsonTool(code=404, msg="帖子不存在", data=None)
#             actual_post_id = post_id
#         else:
#             # 🔥 关键修复：通过 top_comment_id 反查 post_id（确保安全）
#             comment_info = db.query_one(
#                 "SELECT post_id FROM comments WHERE id = %s AND parent_id IS NULL",
#                 (top_comment_id,)
#             )
#             if not comment_info:
#                 return JsonTool(code=404, msg="顶级评论不存在", data=None)
#             actual_post_id = str(comment_info["post_id"])

#         # 调用辅助函数
#         if top_comment_id is None:
#             comment_objects = fetch_and_build_comments(
#                 post_id=actual_post_id,
#                 parent_id=None,
#                 cursor_time=cursor_time,
#                 limit=page_size,
#                 is_top_level=True,
#                 current_user_id=user_id  # ← 新增参数
#             )
#         else:
#             comment_objects = fetch_and_build_comments(
#                 post_id=actual_post_id,
#                 parent_id=top_comment_id,
#                 cursor_time=cursor_time,
#                 limit=page_size,
#                 is_top_level=False,
#                 current_user_id=user_id  # ← 新增参数
#             )

#         has_more = len(comment_objects) == page_size
#         next_cursor = comment_objects[-1].time if comment_objects else None

#         return JsonTool(
#             code=200,
#             msg="获取评论列表成功",
#             data={
#                 "comments": [c.dict() for c in comment_objects],
#                 "has_more": has_more,
#                 "next_cursor": next_cursor
#             }
#         )

#     except Exception as e:
#         import traceback
#         traceback.print_exc()
#         print(f"获取评论树时发生异常: {str(e)}")
#         return JsonTool(code=500, msg=f"服务器错误: {str(e)}", data=None)
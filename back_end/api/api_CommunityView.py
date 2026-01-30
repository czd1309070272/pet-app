from pathlib import Path
# from tokenize import Comment
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, FastAPI, Form
from pydantic import BaseModel
from fastapi import APIRouter, FastAPI, File, UploadFile, Form
import uuid
import os
from datetime import datetime
from .schemas import CommunityDetail, CommunityRequestComment, CommunityRequestComment2, JsonTool, commentPost, likePost, newPost
from .schemas import CommunityRequest,Comment
from sql.mysql_DB import db

# 创建API路由器
router = APIRouter()  # 使用APIRouter而不是FastAPI()
# onlinefile_path = "http://192.168.31.70:8000"

# 创建一个测试的api
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

@router.post("/api/communityview/upload_videos", response_model=JsonTool)
async def upload_videos(user_id: str = Form(...), videos: List[UploadFile] = File(...)):
    try:
        # 检查并创建上传目录
        current_dir = Path(__file__).parent.parent
        upload_dir = current_dir / "pet_videos"  # 使用单独的视频目录
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 存储上传的视频并生成URL
        uploaded_urls = []
        for video in videos:
            # 验证文件类型 - 检查是否为视频格式
            if not video.content_type.startswith("video/"):
                raise Exception(f"文件 {video.filename} 不是有效的视频格式")
            
            # 生成当前时间戳
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            # 使用 user_id + 时间戳 + 随机数确保唯一性
            unique_filename = f"{user_id}_{timestamp}_{str(uuid.uuid4())[:8]}{os.path.splitext(video.filename)[1]}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            # 保存文件
            with open(file_path, "wb") as buffer:
                buffer.write(await video.read())
            
            # 生成访问URL - 添加完整的服务器地址
            video_url = f"/videos/{unique_filename}"
            uploaded_urls.append(video_url)
        
        return JsonTool(
            code=200,
            msg="视频上传成功",
            data={"video_urls": uploaded_urls}
        )
    except Exception as e:
        return JsonTool(
            code=500,
            msg=f"视频上传失败: {str(e)}",
            data=None
        )
# 定义一个图片上传的API，然后返回图片的URL列表
@router.post("/api/communityview/upload_images", response_model=JsonTool)
async def upload_images(user_id: str = Form(...), images: List[UploadFile] = File(...)):
    try:
        # 检查并创建上传目录
        current_dir = Path(__file__).parent.parent  # 获取 back_end 目录
        upload_dir = current_dir / "pet_images"
        if not os.path.exists(upload_dir):
            os.makedirs(upload_dir)
        
        # 存储上传的图片并生成URL
        uploaded_urls = []
        for image in images:
            # 验证文件类型
            if not image.content_type.startswith("image/"):
                raise Exception(f"文件 {image.filename} 不是有效的图片格式")
            
            # 生成当前时间戳
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            # 使用 user_id + 时间戳 + 随机数确保唯一性
            unique_filename = f"{user_id}_{timestamp}_{str(uuid.uuid4())[:8]}{os.path.splitext(image.filename)[1]}"
            file_path = os.path.join(upload_dir, unique_filename)
            
            # 保存文件
            with open(file_path, "wb") as buffer:
                buffer.write(await image.read())
            
            # 生成访问URL - 添加完整的服务器地址
            image_url = f"/images/{unique_filename}"
            uploaded_urls.append(image_url)
        return JsonTool(
            code=200,
            msg="图片上传成功",
            data={"image_urls": uploaded_urls}
        )
    except Exception as e:
        return JsonTool(
            code=500,
            msg=f"图片上传失败: {str(e)}",
            data=None
        )

# 发布新社区信息
@router.post("/api/communityview/add_new_community", response_model=JsonTool)
async def add_community(request_data: CommunityRequest):
    # 获取请求数据
    user_id = request_data.user_id
    content = request_data.content
    images = request_data.images or []  # 确保是列表
    tags = request_data.tags or []      # 确保是列表
    
    print(f"接收到的社区帖子数据: user_id={user_id}, content={content}, images={images}, tags={tags}")
    
    # 使用user_id查询用户信息
    sql = "select * from users where id = %s"
    print(f"正在查询用户信息，user_id: {user_id}")
    user = db.query_one(sql, (user_id,)) 
    print(f"查询到的用户信息: {user}")
    
    if not user:
        print("用户不存在")
        # 删除已上传的文件
        for img_url in images:
            # 从URL中提取文件名
            filename = img_url.split('/')[-1]
            # 确定文件类型并删除相应目录中的文件
            if any(img_url.endswith(ext) for ext in ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv', '.flv', '.mkv']):
                # 视频文件
                video_path = Path(__file__).parent.parent / "pet_videos" / filename
                if video_path.exists():
                    os.remove(video_path)
                    print(f"已删除视频文件: {filename}")
            elif any(img_url.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']):
                # 图片文件
                image_path = Path(__file__).parent.parent / "pet_images" / filename
                if image_path.exists():
                    os.remove(image_path)
                    print(f"已删除图片文件: {filename}")
        return JsonTool(code=201, msg="用户不存在", data=None)

    
    print("用户存在，继续处理")
    
    # TODO: 添加你的业务逻辑
    # 1、保存到posts表中
    datatime = datetime.now()
    print(f"准备插入帖子数据，时间: {datatime}")
    insert_new_post_sql = "INSERT INTO posts (user_id, content, full_content, created_at) VALUES (%s, %s, %s, %s)"
    result = db.execute(insert_new_post_sql, (user_id, content, content, datatime))
    print(f"帖子插入结果: {result}")
    
    # 2、获取新插入的post_id，把图片插入到post_images表中，把标签插入到post_tags表中
    print(f"正在查询新插入的帖子ID")
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
    
    # 返回成功响应
    print("准备返回成功响应")
    response = JsonTool(
        code=200,
        msg="社区帖子发布成功",
        data={
            "post": newPost(
                author=user.get('username') if user and len(user) > 0 else 'Unknown',
                avatar=user.get('avatar_url', '') if user and len(user) > 0 and user.get('avatar_url') else '/default-avatar.png',
                id=post_id['id'],  # 使用实际获取的帖子ID而不是硬编码的1
                time=datatime.strftime('%Y-%m-%d %H:%M:%S'),  # 将datetime转换为字符串
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

def build_comment_tree_for_post(post_id: str, current_user_id: str, db) -> List[Comment]:
    """
    构建帖子的完整评论树（支持任意嵌套，前端扁平展示）
    返回: List[Comment] —— 每个是顶级评论，其 replies 包含所有子孙（按时间排序）
    """
    # 1. 查询该帖子的所有评论
    all_comments = db.query_all(
        """
        SELECT id, user_id, parent_id, reply_to_uid, content, created_at, likes_count
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
    # 3. 找到每条评论的顶级祖先
    root_ancestor = {}      # comment_id -> top_level_id
    top_level_ids = set()
    for cmt in all_comments:
        current_id = cmt["id"]
        ancestor_id = current_id
        visited = set()  # 防止循环引用
        while True:
            if ancestor_id in visited:
                break  # 循环引用，跳出
            visited.add(ancestor_id)
            current_cmt = comment_map.get(ancestor_id)
            if not current_cmt:
                break
            if current_cmt["parent_id"] is None:
                root_ancestor[current_id] = ancestor_id
                top_level_ids.add(ancestor_id)
                break
            else:
                ancestor_id = current_cmt["parent_id"]
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

# 获取社区帖子
@router.post("/api/communityview/get_community_posts", response_model=JsonTool)
async def get_community_posts(request_data: CommunityRequestComment):
    print(f"开始获取社区帖子，用户ID: {request_data.user_id}")
    try:
        user_id = request_data.user_id
        num = request_data.num
        offset = getattr(request_data, 'offset', 1)  # 注意：这里改为从1开始更符合分页习惯
        exclude_post_ids = getattr(request_data, 'exclude_post_ids', []) or []
        if num <= 0 or not user_id:
            print("参数验证失败，用户ID为空或数量小于等于0")
            return JsonTool(code=400, msg="请求参数无效", data=None)
        # 查询用户是否存在
        print(f"正在查询用户是否存在，用户ID: {user_id}")
        user_result = db.query_one("SELECT * FROM users WHERE id = %s", (str(user_id),))
        if not user_result:
            print("用户不存在")
            return JsonTool(code=400, msg="用户不存在", data=None)
        print(f"用户存在，用户信息: {user_result}")
        # 构建帖子查询 SQL
        posts_query = "SELECT * FROM posts WHERE 1=1"
        params = []
        if exclude_post_ids:
            placeholders = ','.join(['%s'] * len(exclude_post_ids))
            posts_query += f" AND id NOT IN ({placeholders})"
            params.extend(exclude_post_ids)
        # 分页：offset 通常从 1 开始，所以 LIMIT/OFFSET 计算为 (offset-1)*num
        posts_query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([num, (offset - 1) * num])
        print(f"帖子查询SQL: {posts_query}, 参数: {params}")
        posts = db.query_all(posts_query, params)
        print(f"查询到帖子数量: {len(posts) if posts else 0}")
        post_list = []
        for post in posts:
            post_id = post["id"]
            print(f"正在处理帖子，ID: {post_id}")
            # 查询图片
            images = db.query_all(
                "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order ASC",
                (post_id,)
            )
            image_urls = [img["image_url"] for img in images]
            # 查询标签
            tags = db.query_all(
                "SELECT tag_name FROM post_tags WHERE post_id = %s",
                (post_id,)
            )
            tag_names = [tag["tag_name"] for tag in tags]
            # 查询帖子点赞数 & 当前用户是否点赞
            like_records = db.query_all(
                "SELECT user_id FROM user_likes WHERE target_id = %s AND target_type = 'POST'",
                (post_id,)
            )
            like_count = len(like_records)
            is_liked = any(like["user_id"] == user_id for like in like_records)
            print("like_count:", like_count)
            # 构建完整评论树（关键修正点）
            total_comments = build_comment_tree_for_post(post_id, user_id, db)
            total_comment_count = db.query_one("SELECT COUNT(*) AS cnt FROM comments WHERE post_id = %s",(post_id,))["cnt"]
            # 查询帖子作者信息
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
                    comments=total_comment_count,  # 顶级评论数（或可改为总评论数）
                    isLiked=is_liked,
                    isV=is_vip,
                    isVIP=is_vip,
                    vipLevel=author_info.get('vip_level', 'NONE'),
                    userTags=tag_names,
                    commentList=total_comments,  # ✅ 正确的评论树结构
                ).dict()
            )
        print(f"帖子列表构建完成，共 {len(post_list)} 个帖子")
        return JsonTool(code=200, msg="获取帖子成功", data={"posts": post_list})
    except Exception as e:
        traceback.print_exc()
        print(f"获取帖子时发生异常: {str(e)}")
        return JsonTool(code=500, msg=f"获取帖子失败: {str(e)}", data=None)


# 根据时间进行分页，获取社区帖子（含每帖最多5条评论）
@router.post("/api/communityview/get_community_posts_by_time", response_model=JsonTool)
async def get_community_posts_by_time(request_data: CommunityRequestComment2):
    try:
        user_id = request_data.user_id
        limit = request_data.limit
        timenode = request_data.timenode
        exclude_post_ids = request_data.exclude_post_ids or []
        datatype = request_data.datatype

        if limit <= 0 or not user_id:
            return JsonTool(code=400, msg="请求参数无效", data=None)

        if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
            return JsonTool(code=400, msg="用户不存在", data=None)

        # === 第一步：获取帖子主列表 ===
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

        # === 第二步：批量查询关联数据 ===

        # 1. 图片
        image_map = {}
        if post_ids:
            images = db.query_all("""
                SELECT post_id, image_url 
                FROM post_images 
                WHERE post_id IN ({})
                ORDER BY post_id, sort_order
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for img in images:
                image_map.setdefault(img["post_id"], []).append(img["image_url"])

        # 2. 标签
        tag_map = {}
        if post_ids:
            tags = db.query_all("""
                SELECT post_id, tag_name 
                FROM post_tags 
                WHERE post_id IN ({})
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for tag in tags:
                tag_map.setdefault(tag["post_id"], []).append(tag["tag_name"])

        # 3. 点赞
        like_map = {}
        if post_ids:
            likes = db.query_all("""
                SELECT target_id AS post_id, user_id 
                FROM user_likes 
                WHERE target_type = 'POST' AND target_id IN ({})
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for like in likes:
                pid = like["post_id"]
                if pid not in like_map:
                    like_map[pid] = {"count": 0, "is_liked": False}
                like_map[pid]["count"] += 1
                if like["user_id"] == user_id:
                    like_map[pid]["is_liked"] = True

        # 4. 作者信息
        author_map = {}
        if author_ids:
            authors = db.query_all("""
                SELECT id, nickname, avatar_url, vip_level 
                FROM users 
                WHERE id IN ({})
            """.format(','.join(['%s'] * len(author_ids))), list(author_ids))
            for au in authors:
                author_map[au["id"]] = au

        # 5. 评论总数（用于显示数字）
        comment_count_map = {}
        if post_ids:
            counts = db.query_all("""
                SELECT post_id, COUNT(*) AS cnt 
                FROM comments 
                WHERE post_id IN ({})
                GROUP BY post_id
            """.format(','.join(['%s'] * len(post_ids))), post_ids)
            for c in counts:
                comment_count_map[c["post_id"]] = c["cnt"]

        # === 第三步：批量查询每帖最多5条评论（关键！）===
        recent_comments_map = {}  # post_id -> List[comment_row]
        all_comment_user_ids = set()
        if post_ids:
            # 使用窗口函数或子查询获取每帖最新5条
            # 兼容 MySQL 5.7+（无窗口函数）的写法
            comments = db.query_all("""
                SELECT c1.id, c1.post_id, c1.user_id, c1.reply_to_uid, 
                       c1.content, c1.created_at, c1.likes_count
                FROM comments c1
                WHERE c1.post_id IN ({})
                  AND (
                    SELECT COUNT(*)
                    FROM comments c2
                    WHERE c2.post_id = c1.post_id
                      AND c2.created_at >= c1.created_at
                  ) <= 3
                ORDER BY c1.post_id, c1.created_at DESC
            """.format(','.join(['%s'] * len(post_ids))), post_ids)

            for cmt in comments:
                post_id = cmt["post_id"]
                recent_comments_map.setdefault(post_id, []).append(cmt)
                all_comment_user_ids.add(cmt["user_id"])
                if cmt["reply_to_uid"]:
                    all_comment_user_ids.add(cmt["reply_to_uid"])

            # 确保顺序是“最新在前”，但前端可能需要反转？按你需求
            for pid in recent_comments_map:
                recent_comments_map[pid].sort(key=lambda x: x["created_at"], reverse=True)

        # 6. 批量查评论相关用户（作者 + 被回复者）
        user_map = {}
        if all_comment_user_ids:
            users = db.query_all("""
                SELECT id, username, avatar_url, vip_level 
                FROM users 
                WHERE id IN ({})
            """.format(','.join(['%s'] * len(all_comment_user_ids))), list(all_comment_user_ids))
            user_map = {u["id"]: u for u in users}

        # === 第四步：组装数据 ===
        post_list = []
        for post in posts:
            post_id = post["id"]
            author_id = post["user_id"]

            # 基础数据
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

            # 组装前5条评论（扁平列表）
            comment_objs = []
            for cmt in recent_comments_map.get(post_id, []):
                author = user_map.get(cmt["user_id"], {})
                reply_to_name = ""
                reply_to_content = ""  # 注意：这里不查父评论内容（性能考虑）

                if cmt["reply_to_uid"]:
                    replied_user = user_map.get(cmt["reply_to_uid"])
                    if replied_user:
                        reply_to_name = replied_user.get("username", "")

                # 是否被当前用户点赞（简化：可后续扩展）
                is_liked = False  # 如需真实状态，可加 user_comment_likes 表查询

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
                        replies=[],  # 扁平化，不嵌套
                        replyToContent=reply_to_content,  # 若需内容，需额外查，建议省略
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
                    commentList=comment_objs,  # ✅ 只有最多5条，且无嵌套
                ).dict()
            )

        return JsonTool(
            code=200,
            msg="获取帖子成功",
            data={"posts": post_list}
        )

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"获取帖子失败: {str(e)}", data=None)


# 点赞帖子、评论，包括点赞和取消点赞
@router.post("/api/communityview/like_post", response_model=JsonTool)
async def like_post(request: likePost):
    try:
        user_id = request.user_id
        target_id = request.target_id
        target_type = request.target_type  # 'POST' or 'COMMENT'
        
        print(f"点赞请求 - 用户ID: {user_id}, 目标ID: {target_id}, 类型: {target_type}")
        
        # 检查用户是否存在
        user_query = "SELECT * FROM users WHERE id = %s"
        user_result = db.query_one(user_query, (user_id,))
        if not user_result:
            print("用户不存在")
            return JsonTool(
                code=400,
                msg="用户不存在",
                data=None
            )
        
        # 检查目标帖子的id或目标评论的id是否存在
        target_exists = False
        if target_type == 'POST':
            post_query = "SELECT * FROM posts WHERE id = %s"
            target_result = db.query_one(post_query, (target_id,))
            target_exists = target_result is not None
        elif target_type == 'COMMENT':
            comment_query = "SELECT * FROM comments WHERE id = %s"
            target_result = db.query_one(comment_query, (target_id,))
            target_exists = target_result is not None
        else:
            print(f"不支持的目标类型: {target_type}")
            return JsonTool(
                code=400,
                msg=f"不支持的目标类型: {target_type}",
                data=None
            )
        
        if not target_exists:
            print(f"{target_type} 不存在，ID: {target_id}")
            return JsonTool(
                code=400,
                msg=f"{target_type} 不存在",
                data=None
            )
        
        # 检查用户是否已经点赞过该目标
        existing_like_query = "SELECT * FROM user_likes WHERE user_id = %s AND target_id = %s AND target_type = %s"
        existing_like = db.query_one(existing_like_query, (user_id, target_id, target_type))
        
        if existing_like:
            # 用户已点赞，取消点赞
            delete_like_sql = "DELETE FROM user_likes WHERE user_id = %s AND target_id = %s AND target_type = %s"
            result = db.execute(delete_like_sql, (user_id, target_id, target_type))
            
            if result > 0:
                print(f"用户 {user_id} 取消点赞 {target_type} {target_id} 成功")
                
                # 获取点赞数（根据类型）
                if target_type == 'POST':
                    like_count_query = "SELECT COUNT(*) as count FROM user_likes WHERE target_id = %s AND target_type = 'POST'"
                    count_result = db.query_one(like_count_query, (target_id,))
                    new_like_count = count_result['count'] if count_result else 0
                else:  # COMMENT
                    like_count_query = "SELECT COUNT(*) as count FROM user_likes WHERE target_id = %s AND target_type = 'COMMENT'"
                    count_result = db.query_one(like_count_query, (target_id,))
                    new_like_count = count_result['count'] if count_result else 0
                
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
                print(f"取消点赞失败，可能数据未更新")
                return JsonTool(
                    code=500,
                    msg="取消点赞失败",
                    data=None
                )
        else:
            # 用户未点赞，添加点赞
            insert_like_sql = "INSERT INTO user_likes (user_id, target_id, target_type, created_at) VALUES (%s, %s, %s, %s)"
            result = db.execute(insert_like_sql, (user_id, target_id, target_type, datetime.now()))
            
            if result > 0:
                print(f"用户 {user_id} 点赞 {target_type} {target_id} 成功")
                
                # 获取点赞数（根据类型）
                if target_type == 'POST':
                    like_count_query = "SELECT COUNT(*) as count FROM user_likes WHERE target_id = %s AND target_type = 'POST'"
                    count_result = db.query_one(like_count_query, (target_id,))
                    new_like_count = count_result['count'] if count_result else 0
                else:  # COMMENT
                    like_count_query = "SELECT COUNT(*) as count FROM user_likes WHERE target_id = %s AND target_type = 'COMMENT'"
                    count_result = db.query_one(like_count_query, (target_id,))
                    new_like_count = count_result['count'] if count_result else 0
                
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
                print(f"点赞失败")
                return JsonTool(
                    code=500,
                    msg="点赞失败",
                    data=None
                )
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"点赞时发生异常: {str(e)}")
        return JsonTool(
            code=500,
            msg=f"点赞失败: {str(e)}",
            data=None
        )


# 评论帖子、评论父评论
@router.post("/api/communityview/comment_post", response_model=JsonTool)
async def comment_post(request: commentPost):
    try:
        id = request.id  # 可选，新增评论时不传
        post_id = request.post_id
        user_id = request.user_id
        parent_id = request.parent_id      # 可为 None（顶级评论）
        reply_to_id = request.reply_to_id  # 被 @ 的用户 ID（用于前端显示 @xxx）
        content = request.content.strip()

        print(f"开始处理评论请求 - 帖子ID: {post_id}, 用户ID: {user_id}, 内容: {content}")
        print(f"父评论ID: {parent_id}, 回复用户ID: {reply_to_id}")

        # --- 校验 1：必填字段 ---
        if not post_id or not user_id or not content:
            print(f"缺少必要参数 - post_id: {post_id}, user_id: {user_id}, content: {'empty' if not content else 'provided'}")
            return JsonTool(code=202, msg="缺少必要参数", data=None)

        if len(content) > 500:
            print(f"评论内容超长 - 实际长度: {len(content)}, 限制: 500")
            return JsonTool(code=202, msg="评论内容不能超过500字", data=None)

        # --- 校验 2：评论者 user_id 必须是合法注册用户 ---
        print(f"开始验证用户 - user_id: {user_id}")
        commenter = db.query_one("SELECT * FROM users WHERE id = %s", (user_id,))
        if not commenter:
            print(f"用户不存在 - user_id: {user_id}")
            return JsonTool(code=201, msg="非法用户，无法发表评论", data=None)

        # --- 校验 3：帖子是否存在 ---
        print(f"开始验证帖子 - post_id: {post_id}")
        post_exists = db.query_one("SELECT id FROM posts WHERE id = %s", (post_id,))
        if not post_exists:
            print(f"帖子不存在 - post_id: {post_id}")
            return JsonTool(code=404, msg="帖子不存在", data=None)

        # --- 校验 4：如果 parent_id 不为空，检查父评论是否属于当前帖子且存在 ---

        actual_reply_to_uid = None  # 最终要存入数据库的 reply_to_uid
        parent_comment_content = ""  # 新增变量：用于 replyToContent
        if parent_id is not None:
            print(f"验证父评论 - parent_id: {parent_id}, post_id: {post_id}")
            parent_comment = db.query_one(
                "SELECT id, user_id ,content FROM comments WHERE id = %s AND post_id = %s",
                (parent_id, post_id)
            )
            if not parent_comment:
                print(f"父评论不存在或不属于该帖子 - parent_id: {parent_id}, post_id: {post_id}")
                return JsonTool(code=202, msg="父评论不存在或不属于该帖子", data=None)
            # ✅ 自动设置被回复用户为父评论的作者
            actual_reply_to_uid = parent_comment["user_id"]
            parent_comment_content = parent_comment["content"]  # ✅ 保存被回复的内容
        else:
            # 顶级评论：不回复任何人，reply_to_uid 为 None
            actual_reply_to_uid = None
        # （可选）如果你仍想允许前端覆盖 reply_to_id（比如自由 @ 别人），可以加判断：
        # if reply_to_id is not None and reply_to_id != "":
        #     actual_reply_to_uid = reply_to_id  # 允许前端指定
        # else:
        #     actual_reply_to_uid = parent_comment["user_id"] if parent_id else None
        # --- 校验 5：校验 actual_reply_to_uid 对应的用户是否存在（如果非空）---
        if actual_reply_to_uid is not None:
            target_user = db.query_one("SELECT id FROM users WHERE id = %s", (actual_reply_to_uid,))
            if not target_user:
                print(f"被回复的用户不存在 - reply_to_uid: {actual_reply_to_uid}")
                return JsonTool(code=400, msg="被回复的用户不存在", data=None)
        # --- 插入新评论 ---
        current_time = datetime.now()
        print(f"开始插入新评论到数据库 - post_id: {post_id}, user_id: {user_id}, parent_id: {parent_id}")
        insert_sql = """
            INSERT INTO comments 
            (post_id, user_id, parent_id, reply_to_uid, content, likes_count, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        # 获取新评论 ID
        new_comment_id = db.insert_and_get_id(
            insert_sql,
            (post_id, user_id, parent_id, actual_reply_to_uid, content, 0, current_time)
        )
        print(f"评论插入成功 - 新评论ID: {new_comment_id}, 帖子ID: {post_id}, 用户ID: {user_id}")
        # ===== 新增：查询被 @ 用户的用户名 =====
        reply_to_name = ""
        if actual_reply_to_uid:
            target_user = db.query_one("SELECT username FROM users WHERE id = %s", (actual_reply_to_uid,))
            if target_user:
                reply_to_name = target_user["username"]

        # 构建符合前端Comment类型的数据结构
        comment_data = {
            "id": str(new_comment_id),
            "author": commenter['username'],
            "avatar": commenter['avatar_url'] if commenter['avatar_url'] else '',
            "content": content,
            "time": current_time.strftime('%Y-%m-%d %H:%M:%S'),  # 使用具体的时间格式
            "likes": 0,
            "isLiked": False,
            "isVIP": "",
            "vipLevel": "",
            "replyToName": reply_to_name,
            "replies": [],
            "replyToContent": parent_comment_content
        }

        return JsonTool(
            code=200,
            msg="评论成功",
            data=comment_data  # 返回符合前端Comment类型的数据结构
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"评论时发生异常: {str(e)}")
        return JsonTool(code=500, msg=f"评论失败: {str(e)}", data=None)
    

# 获取用户点赞历史
@router.post("/api/communityview/get_like_history", response_model=JsonTool)
async def get_like_history(request_data: str):
    try:
        user_id = request_data
        
        print(f"开始获取点赞历史，用户ID: {user_id}")
        
        # 检查用户是否存在
        user_query = "SELECT * FROM users WHERE id = %s"
        user_result = db.query_one(user_query, (user_id,))
        if not user_result:
            print("用户不存在")
            return JsonTool(
                code=400,
                msg="用户不存在",
                data=None
            )
        
        # 查询用户点赞过的所有帖子
        like_history_query = """
            SELECT ul.*, p.id as post_id, p.content as post_content, p.created_at as post_created_at,
                   u.username as post_author, u.avatar_url as post_author_avatar
            FROM user_likes ul
            JOIN posts p ON ul.target_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE ul.user_id = %s AND ul.target_type = 'POST'
            ORDER BY ul.created_at DESC
            LIMIT 20  -- 限制返回数量
        """
        
        like_history = db.query_all(like_history_query, (user_id,))
        
        print(f"查询到点赞历史数量: {len(like_history) if like_history else 0}")
        
        # 构建返回数据
        history_list = []
        if like_history:
            for item in like_history:
                history_item = {
                    "id": str(item["id"]),
                    "post_id": item["post_id"],
                    "post_author": item["post_author"],
                    "post_author_avatar": item["post_author_avatar"] or "/default-avatar.png",
                    "post_content": item["post_content"],
                    "post_title": item["post_content"][:50] + "..." if len(item["post_content"]) > 50 else item["post_content"],
                    "post_image_url": "",  # 如果需要可以查询post_images表
                    "created_at": item["created_at"].strftime('%Y-%m-%d %H:%M:%S'),
                    "target_type": "POST"
                }
                
                # 查询帖子的首张图片
                first_image_query = "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order LIMIT 1"
                first_image = db.query_one(first_image_query, (item["post_id"],))
                if first_image:
                    history_item["post_image_url"] = first_image["image_url"]
                
                history_list.append(history_item)
        
        return JsonTool(
            code=200,
            msg="获取点赞历史成功",
            data={
                "history": history_list
            }
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"获取点赞历史时发生异常: {str(e)}")
        return JsonTool(
            code=500,
            msg=f"获取点赞历史失败: {str(e)}",
            data=None
        )


# 获取用户评论历史
@router.post("/api/communityview/get_comment_history", response_model=JsonTool)
async def get_comment_history(request_data: str):
    try:
        user_id = request_data
        
        print(f"开始获取评论历史，用户ID: {user_id}")
        
        # 检查用户是否存在
        user_query = "SELECT * FROM users WHERE id = %s"
        user_result = db.query_one(user_query, (user_id,))
        if not user_result:
            print("用户不存在")
            return JsonTool(
                code=400,
                msg="用户不存在",
                data=None
            )
        
        # 查询用户发布的所有评论
        comment_history_query = """
            SELECT c.*, p.id as post_id, p.content as post_content, p.created_at as post_created_at,
                   u.username as post_author, u.avatar_url as post_author_avatar
            FROM comments c
            JOIN posts p ON c.post_id = p.id
            JOIN users u ON p.user_id = u.id
            WHERE c.user_id = %s
            ORDER BY c.created_at DESC
            LIMIT 20  -- 限制返回数量
        """
        
        comment_history = db.query_all(comment_history_query, (user_id,))
        
        print(f"查询到评论历史数量: {len(comment_history) if comment_history else 0}")
        
        # 构建返回数据
        history_list = []
        if comment_history:
            for item in comment_history:
                history_item = {
                    "id": str(item["id"]),
                    "post_id": item["post_id"],
                    "post_author": item["post_author"],
                    "post_author_avatar": item["post_author_avatar"] or "/default-avatar.png",
                    "post_content": item["post_content"],
                    "post_title": item["post_content"][:50] + "..." if len(item["post_content"]) > 50 else item["post_content"],
                    "post_image_url": "",  # 如果需要可以查询post_images表
                    "comment_content": item["content"],
                    "created_at": item["created_at"].strftime('%Y-%m-%d %H:%M:%S')
                }
                
                # 查询帖子的首张图片
                first_image_query = "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order LIMIT 1"
                first_image = db.query_one(first_image_query, (item["post_id"],))
                if first_image:
                    history_item["post_image_url"] = first_image["image_url"]
                
                history_list.append(history_item)
        
        return JsonTool(
            code=200,
            msg="获取评论历史成功",
            data={
                "history": history_list
            }
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"获取评论历史时发生异常: {str(e)}")
        return JsonTool(
            code=500,
            msg=f"获取评论历史失败: {str(e)}",
            data=None
        )
    
# 根据帖子id来获取帖子详情
@router.post("/api/communityview/get_post_detail", response_model=JsonTool)
async def get_post_detail(request_data: CommunityDetail):
    try:
        post_id = request_data.post_id
        user_id = request_data.user_id

        print(f"开始获取帖子详情 - 帖子ID: {post_id}, 用户ID: {user_id}")
        # 1. 验证用户是否存在
        if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
            return JsonTool(code=400, msg="用户不存在", data=None)

        # 2. 查询帖子主信息
        post = db.query_one("SELECT * FROM posts WHERE id = %s", (post_id,))
        if not post:
            return JsonTool(code=404, msg="帖子不存在", data=None)
        author_id = post["user_id"]

        # 3. 查询作者信息
        author_info = db.query_one(
            "SELECT nickname, avatar_url, vip_level FROM users WHERE id = %s",
            (author_id,)
        )
        if not author_info:
            author_info = {"nickname": "未知用户", "avatar_url": "/default-avatar.png", "vip_level": "NONE"}

        is_vip = author_info.get('vip_level', 'NONE') != "NONE"

        # 4. 查询图片
        images = db.query_all(
            "SELECT image_url FROM post_images WHERE post_id = %s ORDER BY sort_order ASC",
            (post_id,)
        )
        image_urls = [img["image_url"] for img in images]

        # 5. 查询标签
        tags = db.query_all(
            "SELECT tag_name FROM post_tags WHERE post_id = %s",
            (post_id,)
        )
        tag_names = [tag["tag_name"] for tag in tags]

        # 6. 查询点赞信息
        like_records = db.query_all(
            "SELECT user_id FROM user_likes WHERE target_id = %s AND target_type = 'POST'",
            (post_id,)
        )
        like_count = len(like_records)
        is_liked = any(like["user_id"] == user_id for like in like_records)

        # 7. 查询评论总数（用于显示数字）
        total_comment_count = db.query_one(
            "SELECT COUNT(*) AS cnt FROM comments WHERE post_id = %s",
            (post_id,)
        )["cnt"]

        # 8. 构建完整评论树（使用已有函数）
        comment_list = build_comment_tree_for_post(post_id, user_id, db)

        # 9. 组装 newPost 对象
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
            data=post_detail.dict()
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"获取帖子详情时发生异常: {str(e)}")
        return JsonTool(
            code=500,
            msg=f"获取帖子详情失败: {str(e)}",
            data=None
        )
    
    
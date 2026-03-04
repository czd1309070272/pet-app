from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime
from .schemas import CommunityHistoryRequest, CommunityHistoryItem, JsonTool
from sql.mysql_DB import db
from .tools.TokenTools import decode_token_for_auth

# 创建API路由器
router = APIRouter()


# ===============
# 获取用户的点赞记录
# ===============
@router.post("/api/communityhistoryview/get_like_record", response_model=JsonTool)
async def get_like_record(request_data: CommunityHistoryRequest):
    try:
        token = request_data.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        # 验证 token 版本
        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        limit = request_data.limit
        page = request_data.offset or 0  # 前端传的是页码（从0开始）

        if limit <= 0:
            return JsonTool(code=400, msg="参数错误：limit 必须大于0", data=None)

        real_offset = page * limit

        like_records = db.query_all("""
            SELECT 
                ul.id AS history_id,
                ul.created_at AS time_raw,
                p.id AS post_id,
                p.content AS content_snippet,
                u.nickname AS author,
                u.avatar_url AS author_avatar,
                pi.image_url AS image
            FROM user_likes ul
            JOIN posts p ON ul.target_id = p.id
            JOIN users u ON p.user_id = u.id
            LEFT JOIN (
                SELECT post_id, MIN(sort_order) as min_order
                FROM post_images
                GROUP BY post_id
            ) first_img ON first_img.post_id = p.id
            LEFT JOIN post_images pi ON pi.post_id = p.id AND pi.sort_order = first_img.min_order
            WHERE ul.user_id = %s AND ul.target_type = 'POST'
            ORDER BY ul.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, real_offset))

        result = []
        for record in like_records:
            item = CommunityHistoryItem(
                id=str(record["history_id"]),
                postId=record["post_id"],
                author=record["author"] or "匿名用户",
                authorAvatar=record["author_avatar"] or "",
                contentSnippet=record["content_snippet"] or "",
                time=record["time_raw"].strftime("%Y-%m-%d %H:%M") if record["time_raw"] else "",
                type="LIKE",
                commentText="",  # 点赞无评论内容
                image=record["image"] or ""
            )
            result.append(item.dict())

        return JsonTool(code=200, msg="获取点赞记录成功", data={"result": result})

    except Exception as e:
        print(f"获取点赞记录发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# ===============
# 获取用户的评论记录
# ===============
@router.post("/api/communityhistoryview/get_comment_record", response_model=JsonTool)
async def get_comment_record(request_data: CommunityHistoryRequest):
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
        page = request_data.offset or 0
        if limit <= 0:
            return JsonTool(code=400, msg="参数错误：limit 必须大于0", data=None)

        real_offset = page * limit

        comment_records = db.query_all("""
            SELECT 
                c.id AS history_id,
                c.created_at AS time_raw,
                c.content AS comment_text,
                p.id AS post_id,
                p.content AS content_snippet,
                u.nickname AS author,
                u.avatar_url AS author_avatar,
                pi.image_url AS image
            FROM comments c
            JOIN posts p ON c.post_id = p.id
            JOIN users u ON p.user_id = u.id
            LEFT JOIN (
                SELECT post_id, MIN(sort_order) as min_order
                FROM post_images
                GROUP BY post_id
            ) first_img ON first_img.post_id = p.id
            LEFT JOIN post_images pi ON pi.post_id = p.id AND pi.sort_order = first_img.min_order
            WHERE c.user_id = %s
            ORDER BY c.created_at DESC
            LIMIT %s OFFSET %s
        """, (user_id, limit, real_offset))

        result = []
        for record in comment_records:
            item = CommunityHistoryItem(
                id=str(record["history_id"]),
                postId=record["post_id"],
                author=record["author"] or "匿名用户",
                authorAvatar=record["author_avatar"] or "",
                contentSnippet=record["content_snippet"] or "",
                time=record["time_raw"].strftime("%Y-%m-%d %H:%M") if record["time_raw"] else "",
                type="COMMENT",
                commentText=record["comment_text"] or "",
                image=record["image"] or ""
            )
            result.append(item.dict())

        return JsonTool(code=200, msg="获取评论记录成功", data={"result": result})

    except Exception as e:
        print(f"获取评论记录发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# ===============
# 获取用户的帖子浏览记录（待实现）
# ===============
@router.post("/api/communityhistoryview/get_post_record", response_model=JsonTool)
async def get_post_record(request_data: CommunityHistoryRequest):
    # 即使未实现，也应做 token 验证以保持接口一致性
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

        return JsonTool(code=501, msg="浏览历史功能暂未实现", data=None)

    except Exception as e:
        print(f"获取浏览记录发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# from pathlib import Path
# # from tokenize import Comment
# import traceback
# from typing import Any, Dict, List, Optional
# from fastapi import APIRouter, FastAPI, Form
# from pydantic import BaseModel
# from fastapi import APIRouter, FastAPI, File, UploadFile, Form
# from datetime import datetime
# from .schemas import CommunityHistoryRequest,CommunityHistoryItem, JsonTool
# from sql.mysql_DB import db
# from tools.TokenTools import decode_token_for_auth

# # 创建API路由器
# router = APIRouter()  # 使用APIRouter而不是FastAPI()


# #===============
# # 获取用户的点赞记录
# #==============
# @router.post("/api/communityhistoryview/get_like_record", response_model=JsonTool)
# async def get_like_record(request_data: CommunityHistoryRequest):
#     try:
#         user_id = request_data.user_id
#         limit = request_data.limit
#         page = request_data.offset or 0  # 👈 这是 page number，不是 offset！

#         if not user_id or limit <= 0:
#             return JsonTool(code=400, msg="参数错误：user_id 和 limit 必须有效", data=None)

#         # 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户不存在，ID: {user_id}")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         real_offset = page * limit  # ✅ 关键修复！
#         # 查询用户点赞过的 POST 类型记录
#         like_records = db.query_all("""
#             SELECT 
#                 ul.id AS history_id,
#                 ul.created_at AS time_raw,
#                 p.id AS post_id,
#                 p.content AS content_snippet,
#                 u.nickname AS author,
#                 u.avatar_url AS author_avatar,
#                 pi.image_url AS image
#             FROM user_likes ul
#             JOIN posts p ON ul.target_id = p.id
#             JOIN users u ON p.user_id = u.id
#             LEFT JOIN (
#                 SELECT post_id, MIN(sort_order) as min_order
#                 FROM post_images
#                 GROUP BY post_id
#             ) first_img ON first_img.post_id = p.id
#             LEFT JOIN post_images pi ON pi.post_id = p.id AND pi.sort_order = first_img.min_order
#             WHERE ul.user_id = %s AND ul.target_type = 'POST'
#             ORDER BY ul.created_at DESC
#             LIMIT %s OFFSET %s
#         """, (user_id, limit, real_offset))

#         result = []
#         for record in like_records:
#             item = CommunityHistoryItem(
#                 id=str(record["history_id"]),
#                 postId=record["post_id"],
#                 author=record["author"] or "匿名用户",
#                 authorAvatar=record["author_avatar"] or "",
#                 contentSnippet=record["content_snippet"] or "",
#                 time=record["time_raw"].strftime("%Y-%m-%d %H:%M") if record["time_raw"] else "",
#                 type="LIKE",
#                 commentText="",  # 点赞记录无评论内容
#                 image=record["image"] or ""
#             )
#             result.append(item.dict())

#         return JsonTool(code=200, msg="获取点赞记录成功", data={"result": result})

#     except Exception as e:
#         print(f"获取点赞记录发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# #===============
# # 获取用户的评论记录
# #==============
# @router.post("/api/communityhistoryview/get_comment_record", response_model=JsonTool)
# async def get_comment_record(request_data: CommunityHistoryRequest):
#     try:
#         user_id = request_data.user_id
#         limit = request_data.limit
#         page = request_data.offset or 0
#         real_offset = page * limit  # ✅ 关键修复！

#         if not user_id or limit <= 0:
#             return JsonTool(code=400, msg="参数错误：user_id 和 limit 必须有效", data=None)

#         # 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户不存在，ID: {user_id}")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 查询用户发表的评论
#         comment_records = db.query_all("""
#             SELECT 
#                 c.id AS history_id,
#                 c.created_at AS time_raw,
#                 c.content AS comment_text,
#                 p.id AS post_id,
#                 p.content AS content_snippet,
#                 u.nickname AS author,
#                 u.avatar_url AS author_avatar,
#                 pi.image_url AS image
#             FROM comments c
#             JOIN posts p ON c.post_id = p.id
#             JOIN users u ON p.user_id = u.id
#             LEFT JOIN (
#                 SELECT post_id, MIN(sort_order) as min_order
#                 FROM post_images
#                 GROUP BY post_id
#             ) first_img ON first_img.post_id = p.id
#             LEFT JOIN post_images pi ON pi.post_id = p.id AND pi.sort_order = first_img.min_order
#             WHERE c.user_id = %s
#             ORDER BY c.created_at DESC
#             LIMIT %s OFFSET %s
#         """, (user_id, limit, real_offset))

#         result = []
#         for record in comment_records:
#             item = CommunityHistoryItem(
#                 id=str(record["history_id"]),
#                 postId=record["post_id"],
#                 author=record["author"] or "匿名用户",
#                 authorAvatar=record["author_avatar"] or "",
#                 contentSnippet=record["content_snippet"] or "",
#                 time=record["time_raw"].strftime("%Y-%m-%d %H:%M") if record["time_raw"] else "",
#                 type="COMMENT",
#                 commentText=record["comment_text"] or "",
#                 image=record["image"] or ""
#             )
#             result.append(item.dict())

#         return JsonTool(code=200, msg="获取评论记录成功", data={"result": result})

#     except Exception as e:
#         print(f"获取评论记录发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# #===============
# # 获取用户的帖子浏览记录（待实现）
# #==============
# @router.post("/api/communityhistoryview/get_post_record", response_model=JsonTool)
# async def get_post_record(request_data: CommunityHistoryRequest):
#     return JsonTool(code=501, msg="浏览历史功能暂未实现", data=None)

from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from .schemas import CommunityRequestComment, JsonTool, PetProfile, WeightEntry, commentPost, likePost, newPost
from .schemas import CommunityRequest, Comment
from sql.mysql_DB import db
from .tools.TokenTools import decode_token_for_auth

# 创建API路由器
router = APIRouter()

#=============
# 添加新宠物
#=============
@router.post("/api/pet/add_pet", response_model=JsonTool)
async def add_pet(request_data: PetProfile):
    try:
        token = request_data.token
        decoded = decode_token_for_auth(token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        # 验证 token_version
        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        memorial_date = request_data.memorialDate if request_data.isMemorial else None

        insert_query = """
            INSERT INTO pets (
                user_id, name, breed, avatar_url, is_memorial, 
                gender, birthday, hobbies, memorial_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        params = (
            user_id,
            request_data.name,
            request_data.breed,
            request_data.avatar,
            request_data.isMemorial,
            request_data.gender,
            request_data.birthday,
            request_data.hobbies,
            memorial_date
        )
        affected = db.execute(insert_query, params)
        if affected != 1:
            return JsonTool(code=500, msg="添加宠物失败", data=None)

        pet_response = PetProfile(
            id="",
            name=request_data.name,
            breed=request_data.breed,
            avatar=request_data.avatar,
            isMemorial=request_data.isMemorial,
            gender=request_data.gender,
            birthday=request_data.birthday,
            hobbies=request_data.hobbies if request_data.hobbies else "",
            memorialDate=memorial_date if memorial_date else "",
            token=token,
        )
        return JsonTool(code=200, msg="宠物添加成功", data={"pet": pet_response})

    except Exception as e:
        print(f"添加宠物时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# =============
# 获取用户宠物列表
# =============
@router.post("/api/pet/get_pets", response_model=JsonTool)
async def get_pets(request_data: PetProfile):
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

        query = """
            SELECT 
                id, name, breed, avatar_url, is_memorial,
                gender, birthday, hobbies, memorial_date
            FROM pets
            WHERE user_id = %s
            ORDER BY id DESC
        """
        rows = db.query_all(query, (user_id,))

        pet_list = []
        for row in rows:
            pet = PetProfile(
                id=str(row.get("id")),
                name=row.get("name") or "",
                breed=row.get("breed") or "",
                avatar=row.get("avatar_url") or "",
                isMemorial=bool(row.get("is_memorial")),
                gender=row.get("gender") or "",
                birthday=str(row.get("birthday")) if row.get("birthday") else "",
                hobbies=row.get("hobbies") or "",
                memorialDate=str(row.get("memorial_date")) if row.get("memorial_date") else "",
                token=token
            )
            pet_list.append(pet)

        return JsonTool(code=200, msg="获取成功", data={"pets": pet_list})

    except Exception as e:
        print(f"获取宠物发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


@router.post("/api/pet/update_pet", response_model=JsonTool)
async def update_pet(request_data: PetProfile):
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

        pet_id = request_data.id
        if not pet_id:
            return JsonTool(code=400, msg="缺少必要参数: id", data=None)

        pet_owner = db.query_one(
            "SELECT id FROM pets WHERE id = %s AND user_id = %s",
            (pet_id, user_id)
        )
        if not pet_owner:
            return JsonTool(code=403, msg="无权修改此宠物信息", data=None)

        memorial_date = request_data.memorialDate if request_data.isMemorial else None

        update_query = """
            UPDATE pets SET
                name = %s, breed = %s, avatar_url = %s, is_memorial = %s,
                gender = %s, birthday = %s, hobbies = %s, memorial_date = %s
            WHERE id = %s
        """
        params = (
            request_data.name,
            request_data.breed,
            request_data.avatar,
            request_data.isMemorial,
            request_data.gender,
            request_data.birthday,
            request_data.hobbies,
            memorial_date,
            pet_id
        )

        affected = db.execute(update_query, params)
        if affected == 0:
            return JsonTool(code=404, msg="宠物记录未找到或未更新", data=None)

        updated_row = db.query_one(
            """
            SELECT 
                id, name, breed, avatar_url AS avatar, is_memorial, gender,
                birthday, hobbies, memorial_date
            FROM pets 
            WHERE id = %s
            """,
            (pet_id,)
        )

        if not updated_row:
            return JsonTool(code=500, msg="更新成功但无法加载最新数据", data=None)

        birthday_str = str(updated_row["birthday"]) if updated_row["birthday"] else ""
        memorial_date_str = str(updated_row["memorial_date"]) if updated_row["memorial_date"] else ""

        updated_pet = PetProfile(
            id=str(updated_row["id"]),
            name=updated_row["name"] or "",
            breed=updated_row["breed"] or "",
            avatar=updated_row["avatar"] or "",
            isMemorial=bool(updated_row["is_memorial"]),
            gender=updated_row["gender"] or "",
            birthday=birthday_str,
            hobbies=updated_row["hobbies"] or "",
            memorialDate=memorial_date_str,
            token=token
        )

        return JsonTool(code=200, msg="更新成功", data={"pet": updated_pet})

    except Exception as e:
        print(f"更新宠物发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# ================
# 获取指定宠物或全部宠物的体重历史记录
# ================
@router.post("/api/pet/get_pet_weight", response_model=JsonTool)
async def get_pet_weight(request_data: WeightEntry):
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

        pet_id = request_data.id
        if not pet_id:
            return JsonTool(code=400, msg="缺少必要参数: id", data=None)

        if pet_id != "-1":
            pet_result = db.query_one(
                "SELECT id FROM pets WHERE id = %s AND user_id = %s",
                (pet_id, user_id)
            )
            if not pet_result:
                return JsonTool(code=403, msg="无权访问此宠物的体重数据", data=None)

        if pet_id == "-1":
            weight_records = db.query_all(
                """
                SELECT pw.id, pw.pet_id, pw.weight, pw.record_date, p.name AS pet_name
                FROM pet_weights pw
                JOIN pets p ON pw.pet_id = p.id
                WHERE p.user_id = %s
                ORDER BY p.id, pw.record_date ASC
                """,
                (user_id,)
            )
        else:
            weight_records = db.query_all(
                """
                SELECT id, pet_id, weight, record_date
                FROM pet_weights
                WHERE pet_id = %s
                ORDER BY record_date ASC
                """,
                (pet_id,)
            )

        weight_history = []
        for row in weight_records:
            weight_entry = WeightEntry(
                id=str(row["id"]),
                date=str(row["record_date"]),
                weight=float(row["weight"]),
                token=token
            )
            weight_history.append(weight_entry)

        return JsonTool(code=200, msg="获取成功", data={"weightHistory": weight_history})

    except Exception as e:
        print(f"获取宠物体重发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# ================
# 修改/新增宠物体重记录（按日期 upsert）
# ================
@router.post("/api/pet/update_pet_weight", response_model=JsonTool)
async def update_pet_weight(request_data: WeightEntry):
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

        pet_id = request_data.id
        weight = request_data.weight
        record_date = request_data.date

        if not pet_id or weight is None or not record_date:
            return JsonTool(code=400, msg="缺少必要参数: id、weight 或 date", data=None)
        if weight <= 0:
            return JsonTool(code=400, msg="体重必须大于 0", data=None)

        pet_result = db.query_one(
            "SELECT id FROM pets WHERE id = %s AND user_id = %s",
            (pet_id, user_id)
        )
        if not pet_result:
            return JsonTool(code=403, msg="无权操作此宠物", data=None)

        existing = db.query_one(
            "SELECT id FROM pet_weights WHERE pet_id = %s AND record_date = %s",
            (pet_id, record_date)
        )

        if existing:
            db.execute(
                "UPDATE pet_weights SET weight = %s WHERE pet_id = %s AND record_date = %s",
                (weight, pet_id, record_date)
            )
            action = "更新"
        else:
            db.execute(
                "INSERT INTO pet_weights (pet_id, weight, record_date) VALUES (%s, %s, %s)",
                (pet_id, weight, record_date)
            )
            action = "新增"

        history = db.query_all(
            """
            SELECT id, pet_id, weight, record_date
            FROM pet_weights
            WHERE pet_id = %s
            ORDER BY record_date ASC
            """,
            (pet_id,)
        )

        weight_history = [
            WeightEntry(
                id=str(row["id"]),          # ✅ 正确：用体重记录的 ID
                date=str(row["record_date"]),
                weight=float(row["weight"]),
                token=token
            )
            for row in history
        ]

        return JsonTool(
            code=200,
            msg=f"体重记录{action}成功",
            data={"weight_history": weight_history}
        )

    except Exception as e:
        print(f"更新宠物体重发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# =================
# 获取宠物全部信息（仅 pets 表）
# =================
@router.post("/api/pet/get_pet_info", response_model=JsonTool)
async def get_pet_info(request_data: PetProfile):
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

        pet_id = request_data.id
        if not pet_id:
            return JsonTool(code=400, msg="缺少必要参数: id", data=None)

        pet_basic = db.query_one(
            """
            SELECT 
                id, name, breed, avatar_url, is_memorial, gender,
                birthday, hobbies, memorial_date
            FROM pets 
            WHERE id = %s AND user_id = %s
            """,
            (pet_id, user_id)
        )
        if not pet_basic:
            return JsonTool(code=403, msg="无权访问此宠物信息", data=None)

        pet_profile = PetProfile(
            id=str(pet_basic["id"]),
            name=pet_basic["name"] or "",
            breed=pet_basic["breed"] or "",
            avatar=pet_basic["avatar_url"] or "",
            isMemorial=bool(pet_basic["is_memorial"]),
            gender=pet_basic["gender"] or "",
            birthday=str(pet_basic["birthday"]) if pet_basic["birthday"] else "",
            hobbies=pet_basic["hobbies"] or "",
            memorialDate=str(pet_basic["memorial_date"]) if pet_basic["memorial_date"] else "",
            token=token
        )

        return JsonTool(code=200, msg="获取宠物信息成功", data={"pet": pet_profile})

    except Exception as e:
        print(f"获取宠物信息发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# =============
# 修改用户宠物的死亡信息（仅用于设置“去世”状态）
# =============
@router.post("/api/pet/update_pet_death", response_model=JsonTool)
async def update_pet_death(request_data: PetProfile):
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

        pet_id = request_data.id
        is_memorial_new = request_data.isMemorial
        memorial_date = request_data.memorialDate

        if not pet_id:
            return JsonTool(code=400, msg="缺少必要参数: id", data=None)
        if not is_memorial_new:
            return JsonTool(code=400, msg="此接口仅用于设置宠物为纪念状态", data=None)
        if not memorial_date:
            return JsonTool(code=400, msg="设置纪念状态时，必须提供纪念日期", data=None)

        pet_info = db.query_one(
            "SELECT id, is_memorial FROM pets WHERE id = %s AND user_id = %s",
            (pet_id, user_id)
        )
        if not pet_info:
            return JsonTool(code=403, msg="无权修改此宠物信息", data=None)

        current_is_memorial = bool(pet_info["is_memorial"])
        if current_is_memorial:
            return JsonTool(code=400, msg="该宠物已是纪念状态，无法重复设置", data=None)

        db.execute(
            "UPDATE pets SET is_memorial = %s, memorial_date = %s WHERE id = %s",
            (True, memorial_date, pet_id)
        )

        updated_row = db.query_one(
            """
            SELECT 
                id, name, breed, avatar_url, is_memorial, gender,
                birthday, hobbies, memorial_date
            FROM pets WHERE id = %s
            """,
            (pet_id,)
        )

        if not updated_row:
            return JsonTool(code=500, msg="更新后无法获取宠物信息", data=None)

        updated_pet = PetProfile(
            id=str(updated_row["id"]),
            name=updated_row["name"] or "",
            breed=updated_row["breed"] or "",
            avatar=updated_row["avatar_url"] or "",
            isMemorial=True,
            gender=updated_row["gender"] or "",
            birthday=str(updated_row["birthday"]) if updated_row["birthday"] else "",
            hobbies=updated_row["hobbies"] or "",
            memorialDate=memorial_date,
            token=token
        )

        return JsonTool(code=200, msg="宠物纪念状态设置成功", data={"pet": updated_pet})

    except Exception as e:
        print(f"更新宠物死亡状态发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)

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
# from .schemas import CommunityRequestComment, JsonTool, PetProfile, WeightEntry, commentPost, likePost, newPost
# from .schemas import CommunityRequest,Comment
# from sql.mysql_DB import db
# from tools.TokenTools import decode_token_for_auth

# # 创建API路由器
# router = APIRouter()  # 使用APIRouter而不是FastAPI()

# #=============
# # 添加新宠物
# #=============
# @router.post("/api/pet/add_pet", response_model=JsonTool)
# async def add_pet(request_data: PetProfile):
#     try:
#         token = request_data.token
#         # user_id = request_data.user_id
#         # 解析 token
#         token = request_data.token
#         decoded = decode_token_for_auth(token)
#         user_id = decoded["user_id"]
#         claimed_token_version = decoded["token_version"]

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户验证失败，用户ID: {user_id} 不存在")
#             return JsonTool(code=400, msg="用户不存在", data=None)
#         # 2. 生成唯一宠物 ID（建议用 UUID，避免时间戳冲突）
#         # pet_id = str(uuid.uuid4())  # 例如: "a1b2c3d4-..."
#         # 3. 准备 memorialDate
#         # 如果不是纪念宠物，强制清空 memorialDate
#         memorial_date = request_data.memorialDate if request_data.isMemorial else None
#         # 4. 插入数据库
#         insert_query = """
#             INSERT INTO pets (
#                 user_id, name, breed, avatar_url, is_memorial, 
#                 gender, birthday, hobbies, memorial_date
#             ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
#         """
#         params = (
#             user_id,
#             request_data.name,
#             request_data.breed,
#             request_data.avatar,
#             request_data.isMemorial,
#             request_data.gender,
#             request_data.birthday,
#             request_data.hobbies,
#             memorial_date
#         )
#         affected = db.execute(insert_query, params)
#         if affected != 1:
#             print("插入宠物记录失败")
#             return JsonTool(code=500, msg="添加宠物失败", data=None)
#         # 5. 构建返回的完整 PetProfile 对象
#         pet_response = PetProfile(
#             id="",
#             name=request_data.name,
#             breed=request_data.breed,
#             avatar=request_data.avatar,
#             isMemorial=request_data.isMemorial,
#             gender=request_data.gender,
#             birthday=request_data.birthday,
#             hobbies=request_data.hobbies if request_data.hobbies else "",
#             memorialDate=memorial_date if memorial_date else "",
#             # user_id=user_id
#             token=token
#         )
#         return JsonTool(code=200, msg="宠物添加成功", data={"pet": pet_response})
#     except Exception as e:
#         print(f"添加宠物时发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)
    

# # =============
# # 获取用户宠物列表
# # =============
# @router.post("/api/pet/get_pets", response_model=JsonTool)
# async def get_pets(request_data: PetProfile):
#     try:
#         user_id = request_data.user_id

#         # 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户验证失败，用户ID: {user_id} 不存在")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 查询该用户的所有宠物
#         query = """
#             SELECT 
#                 id,
#                 name,
#                 breed,
#                 avatar_url,
#                 is_memorial,
#                 gender,
#                 birthday,
#                 hobbies,
#                 memorial_date
#             FROM pets
#             WHERE user_id = %s
#             ORDER BY id DESC
#         """
#         rows = db.query_all(query, (user_id,))

#         # 转换为 PetProfile 列表（下划线 → 驼峰）
#         pet_list = []
#         for row in rows:
#             pet = PetProfile(
#                 id=str(row.get("id")),
#                 name=row.get("name") or "",
#                 breed=row.get("breed") or "",
#                 avatar=row.get("avatar_url") or "",
#                 isMemorial=bool(row.get("is_memorial")),
#                 gender=row.get("gender") or "",
#                 birthday=str(row.get("birthday")) if row.get("birthday") else "",
#                 hobbies=row.get("hobbies") or "",
#                 memorialDate=str(row.get("memorial_date")) if row.get("memorial_date") else "",
#                 user_id=user_id
#             )
#             pet_list.append(pet)

#         return JsonTool(code=200, msg="获取成功", data={"pets": pet_list})

#     except Exception as e:
#         print(f"获取宠物发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# @router.post("/api/pet/update_pet", response_model=JsonTool)
# async def update_pet(request_data: PetProfile):
#     try:
#         pet_id = request_data.id
#         user_id = request_data.user_id

#         if not pet_id or not user_id:
#             return JsonTool(code=400, msg="缺少必要参数: id 或 user_id", data=None)

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户不存在，ID: {user_id}")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 验证该宠物是否属于该用户
#         pet_owner = db.query_one(
#             "SELECT id FROM pets WHERE id = %s AND user_id = %s",
#             (pet_id, user_id)
#         )
#         if not pet_owner:
#             print(f"宠物 {pet_id} 不属于用户 {user_id}，拒绝更新")
#             return JsonTool(code=403, msg="无权修改此宠物信息", data=None)

#         # 3. 准备 memorialDate
#         memorial_date = request_data.memorialDate if request_data.isMemorial else None

#         # 4. 执行更新
#         update_query = """
#             UPDATE pets SET
#                 name = %s,
#                 breed = %s,
#                 avatar_url = %s,
#                 is_memorial = %s,
#                 gender = %s,
#                 birthday = %s,
#                 hobbies = %s,
#                 memorial_date = %s
#             WHERE id = %s
#         """
#         params = (
#             request_data.name,
#             request_data.breed,
#             request_data.avatar,
#             request_data.isMemorial,
#             request_data.gender,
#             request_data.birthday,
#             request_data.hobbies,
#             memorial_date,
#             pet_id
#         )

#         affected = db.execute(update_query, params)
#         if affected == 0:
#             return JsonTool(code=404, msg="宠物记录未找到或未更新", data=None)

#         # 5. ✅ 重新查询数据库，获取真实数据
#         updated_row = db.query_one(
#             """
#             SELECT 
#                 id, name, breed, avatar_url AS avatar, is_memorial, gender,
#                 birthday, hobbies, memorial_date, user_id
#             FROM pets 
#             WHERE id = %s
#             """,
#             (pet_id,)
#         )

#         if not updated_row:
#             return JsonTool(code=500, msg="更新成功但无法加载最新数据", data=None)

#         # 格式化日期字段
#         birthday_str = str(updated_row["birthday"]) if updated_row["birthday"] else ""
#         memorial_date_str = str(updated_row["memorial_date"]) if updated_row["memorial_date"] else ""

#         updated_pet = PetProfile(
#             id=str(updated_row["id"]),
#             name=updated_row["name"] or "",
#             breed=updated_row["breed"] or "",
#             avatar=updated_row["avatar"] or "",
#             isMemorial=bool(updated_row["is_memorial"]),
#             gender=updated_row["gender"] or "",
#             birthday=birthday_str,
#             hobbies=updated_row["hobbies"] or "",
#             memorialDate=memorial_date_str,
#             user_id=updated_row["user_id"]
#         )

#         return JsonTool(code=200, msg="更新成功", data={"pet": updated_pet})

#     except Exception as e:
#         print(f"更新宠物发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# # ================
# # 获取指定宠物或全部宠物的体重历史记录
# # 支持 pet_id = "-1" 表示查询用户所有宠物
# # ================
# @router.post("/api/pet/get_pet_weight", response_model=JsonTool)
# async def get_pet_weight(request_data: WeightEntry):
#     try:
#         pet_id = request_data.id
#         user_id = request_data.user_id

#         if not pet_id or not user_id:
#             return JsonTool(code=400, msg="缺少必要参数: pet_id 或 user_id", data=None)

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 如果不是查询全部（pet_id != "-1"），验证宠物归属
#         if pet_id != "-1":
#             pet_result = db.query_one(
#                 "SELECT id FROM pets WHERE id = %s AND user_id = %s",
#                 (pet_id, user_id)
#             )
#             if not pet_result:
#                 return JsonTool(code=403, msg="无权访问此宠物的体重数据", data=None)

#         # 3. 构建查询条件
#         if pet_id == "-1":
#             # 查询该用户所有宠物的体重记录
#             weight_records = db.query_all(
#                 """
#                 SELECT pw.id, pw.pet_id, pw.weight, pw.record_date, p.name AS pet_name
#                 FROM pet_weights pw
#                 JOIN pets p ON pw.pet_id = p.id
#                 WHERE p.user_id = %s
#                 ORDER BY p.id, pw.record_date ASC
#                 """,
#                 (user_id,)
#             )
#         else:
#             # 查询指定宠物的体重记录
#             weight_records = db.query_all(
#                 """
#                 SELECT id, pet_id, weight, record_date
#                 FROM pet_weights
#                 WHERE pet_id = %s
#                 ORDER BY record_date ASC
#                 """,
#                 (pet_id,)
#             )

#         # 4. 转换为 WeightEntry 列表
#         weight_history: List[WeightEntry] = []
#         for row in weight_records:
#             weight_entry = WeightEntry(
#                 id=str(row["id"]),
#                 user_id=user_id,
#                 weight=float(row["weight"]),
#                 date=str(row["record_date"])
#             )
#             weight_history.append(weight_entry)

#         return JsonTool(code=200, msg="获取成功", data={"weightHistory":weight_history})

#     except Exception as e:
#         print(f"获取宠物体重发生异常: {str(e)}")
#         import traceback
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)
    

# # ================
# # 修改/新增宠物体重记录（按日期 upsert）
# # ================
# @router.post("/api/pet/update_pet_weight", response_model=JsonTool)
# async def update_pet_weight(request_data: WeightEntry):
#     try:
#         pet_id = request_data.id
#         user_id = request_data.user_id
#         weight = request_data.weight
#         record_date = request_data.date  # 格式应为 'YYYY-MM-DD'

#         # 参数校验
#         if not pet_id or not user_id or weight is None or not record_date:
#             return JsonTool(code=400, msg="缺少必要参数: id、user_id、weight 或 date", data=None)

#         if weight <= 0:
#             return JsonTool(code=400, msg="体重必须大于 0", data=None)

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 验证宠物归属
#         pet_result = db.query_one(
#             "SELECT id FROM pets WHERE id = %s AND user_id = %s",
#             (pet_id, user_id)
#         )
#         if not pet_result:
#             return JsonTool(code=403, msg="无权操作此宠物", data=None)

#         # 3. 检查当天是否已有体重记录
#         existing = db.query_one(
#             "SELECT id FROM pet_weights WHERE pet_id = %s AND record_date = %s",
#             (pet_id, record_date)
#         )

#         if existing:
#             # 更新已有记录
#             update_query = """
#                 UPDATE pet_weights 
#                 SET weight = %s 
#                 WHERE pet_id = %s AND record_date = %s
#             """
#             params = (weight, pet_id, record_date)
#             affected = db.execute(update_query, params)
#             action = "更新"
#         else:
#             # 插入新记录
#             insert_query = """
#                 INSERT INTO pet_weights (pet_id, weight, record_date)
#                 VALUES (%s, %s, %s)
#             """
#             params = (pet_id, weight, record_date)
#             affected = db.execute(insert_query, params)
#             action = "新增"

#         if affected == 0:
#             return JsonTool(code=500, msg="体重记录操作失败", data=None)

#         # 4. 返回最新的完整体重历史（按日期升序）
#         history = db.query_all(
#             """
#             SELECT id, pet_id, weight, record_date
#             FROM pet_weights
#             WHERE pet_id = %s
#             ORDER BY record_date ASC
#             """,
#             (pet_id,)
#         )

#         # 转换为 WeightEntry 列表（注意字段名映射）
#         weight_history = [
#             WeightEntry(
#                 id=str(row["pet_id"]),
#                 user_id=user_id,
#                 weight=float(row["weight"]),  # 前端可能期望 float，但你的模型是 int？见下方说明
#                 date=str(row["record_date"])
#             )
#             for row in history
#         ]

#         return JsonTool(
#             code=200,
#             msg=f"体重记录{action}成功",
#             data={
#                 "weight_history":weight_history
#             }
#         )

#     except Exception as e:
#         print(f"更新宠物体重发生异常: {str(e)}")
#         import traceback
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# # =================
# # 获取宠物全部信息（仅 pets 表）
# # =================
# @router.post("/api/pet/get_pet_info", response_model=JsonTool)
# async def get_pet_info(request_data: PetProfile):
#     try:
#         pet_id = request_data.id
#         user_id = request_data.user_id

#         if not pet_id or not user_id:
#             return JsonTool(code=400, msg="缺少必要参数: id 或 user_id", data=None)

#         # 1. 验证用户是否存在（可选，也可跳过，因为下一步已验证归属）
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户不存在，ID: {user_id}")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 查询宠物并验证归属
#         pet_basic = db.query_one(
#             """
#             SELECT 
#                 id, name, breed, avatar_url, is_memorial, gender,
#                 birthday, hobbies, memorial_date, user_id
#             FROM pets 
#             WHERE id = %s AND user_id = %s
#             """,
#             (pet_id, user_id)
#         )
#         if not pet_basic:
#             print(f"宠物 {pet_id} 不属于用户 {user_id}，拒绝访问")
#             return JsonTool(code=403, msg="无权访问此宠物信息", data=None)

#         # 3. 构造 PetProfile 对象（与前端结构一致）
#         pet_profile = PetProfile(
#             id=str(pet_basic["id"]),
#             name=pet_basic["name"] or "",
#             breed=pet_basic["breed"] or "",
#             avatar=pet_basic["avatar_url"] or "",
#             isMemorial=bool(pet_basic["is_memorial"]),
#             gender=pet_basic["gender"] or "",
#             birthday=str(pet_basic["birthday"]) if pet_basic["birthday"] else "",
#             hobbies=pet_basic["hobbies"] or "",
#             memorialDate=str(pet_basic["memorial_date"]) if pet_basic["memorial_date"] else "",
#             user_id=pet_basic["user_id"]
#         )

#         return JsonTool(code=200, msg="获取宠物信息成功", data={"pet": pet_profile})

#     except Exception as e:
#         print(f"获取宠物信息发生异常: {str(e)}")
#         import traceback
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)



# # =============
# # 修改用户宠物的死亡信息（仅用于设置“去世”状态）
# # =============
# @router.post("/api/pet/update_pet_death", response_model=JsonTool)
# async def update_pet_death(request_data: PetProfile):
#     try:
#         pet_id = request_data.id
#         user_id = request_data.user_id
#         is_memorial_new = request_data.isMemorial  # 前端想设置的新状态
#         memorial_date = request_data.memorialDate

#         if not pet_id or not user_id:
#             return JsonTool(code=400, msg="缺少必要参数: id 或 user_id", data=None)

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户不存在，ID: {user_id}")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 验证宠物归属 + 获取当前状态
#         pet_info = db.query_one(
#             "SELECT id, is_memorial FROM pets WHERE id = %s AND user_id = %s",
#             (pet_id, user_id)
#         )
#         if not pet_info:
#             print(f"宠物 {pet_id} 不属于用户 {user_id}，拒绝更新")
#             return JsonTool(code=403, msg="无权修改此宠物信息", data=None)

#         current_is_memorial = bool(pet_info["is_memorial"])

#         # 3. 业务规则：只允许从【存活】→【死亡】，不允许反向或重复操作
#         if current_is_memorial:
#             return JsonTool(code=400, msg="该宠物已是纪念状态，无法重复设置死亡信息", data=None)

#         if not is_memorial_new:
#             return JsonTool(code=400, msg="此接口仅用于设置宠物为纪念状态", data=None)

#         # 4. 如果是设为死亡，必须提供 memorialDate
#         if not memorial_date:
#             return JsonTool(code=400, msg="设置纪念状态时，必须提供纪念日期", data=None)

#         # 5. 执行更新（只更新死亡相关字段）
#         update_query = """
#             UPDATE pets SET
#                 is_memorial = %s,
#                 memorial_date = %s
#             WHERE id = %s
#         """
#         params = (
#             True,  # 强制设为 True（因为接口语义就是“设为死亡”）
#             memorial_date,
#             pet_id
#         )

#         affected = db.execute(update_query, params)
#         if affected == 0:
#             return JsonTool(code=500, msg="更新失败，请重试", data=None)

#         # 6. 返回更新后的宠物信息（可选）
#         # 注意：这里 name 等字段未知，所以不能直接用 request_data 构造
#         # 更安全的做法：重新查一次数据库
#         updated_row = db.query_one(
#             """
#             SELECT 
#                 id, name, breed, avatar_url, is_memorial, gender,
#                 birthday, hobbies, memorial_date, user_id
#             FROM pets WHERE id = %s
#             """,
#             (pet_id,)
#         )

#         if not updated_row:
#             return JsonTool(code=500, msg="更新后无法获取宠物信息", data=None)

#         updated_pet = PetProfile(
#             id=str(updated_row["id"]),
#             name=updated_row["name"] or "",
#             breed=updated_row["breed"] or "",
#             avatar=updated_row["avatar_url"] or "",
#             isMemorial=bool(updated_row["is_memorial"]),
#             gender=updated_row["gender"] or "",
#             birthday=str(updated_row["birthday"]) if updated_row["birthday"] else "",
#             hobbies=updated_row["hobbies"] or "",
#             memorialDate=str(updated_row["memorial_date"]) if updated_row["memorial_date"] else "",
#             user_id=updated_row["user_id"]
#         )

#         return JsonTool(code=200, msg="宠物纪念状态设置成功", data={"pet": updated_pet})

#     except Exception as e:
#         print(f"更新宠物死亡状态发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)
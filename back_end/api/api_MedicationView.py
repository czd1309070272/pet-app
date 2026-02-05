from fastapi import APIRouter
from typing import List, Optional
import traceback
from .schemas import Medication, PetProfile, JsonTool
from sql.mysql_DB import db
from .tools.TokenTools import decode_token_for_auth

router = APIRouter()


# =====================
# 获取用户下全部提醒列表
# =====================
@router.post("/api/membershipview/get_all_medication", response_model=JsonTool)
async def get_all_medication(request_data: Medication):
    try:
        # 从 token 解析用户
        decoded = decode_token_for_auth(request_data.token)
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
                m.id,
                m.pet_id,
                p.name AS pet_name,
                m.name AS medication_name,
                m.dosage,
                m.schedule_date AS date,
                m.schedule_time AS time,
                m.is_taken
            FROM medications m
            JOIN pets p ON m.pet_id = p.id
            WHERE p.user_id = %s
            ORDER BY m.schedule_date DESC, m.schedule_time DESC
        """
        rows = db.query_all(query, (user_id,))

        medication_list = []
        for row in rows:
            med = {
                "id": str(row["id"]),
                "petName": row["pet_name"],
                "name": row["medication_name"],
                "dosage": row["dosage"],
                "date": row["date"].strftime("%Y-%m-%d") if row["date"] else "",
                "time": str(row["time"]) if row["time"] else "00:00",
                "isTaken": bool(row["is_taken"])
            }
            medication_list.append(med)

        return JsonTool(code=200, msg="获取成功", data={"medications": medication_list})

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"服务器错误: {str(e)}", data=None)


# =====================
# 添加新用药提醒
# =====================
@router.post("/api/membershipview/add_medication", response_model=JsonTool)
async def add_medication(request_data: Medication):
    try:
        decoded = decode_token_for_auth(request_data.token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        petName = request_data.petName
        name = request_data.name
        dosage = request_data.dosage
        date_str = request_data.date
        time_str = request_data.time

        if not petName:
            return JsonTool(code=400, msg="缺少宠物名字", data=None)

        pet_result = db.query_one(
            "SELECT id, is_memorial FROM pets WHERE name = %s AND user_id = %s",
            (petName, user_id)
        )
        if not pet_result:
            return JsonTool(code=400, msg="宠物不存在或无权限", data=None)

        if pet_result.get("is_memorial"):
            return JsonTool(code=400, msg="无法为已故宠物添加用药提醒", data=None)

        if not name:
            return JsonTool(code=400, msg="药品名称不能为空", data=None)

        db.execute(
            "INSERT INTO medications (pet_id, name, dosage, schedule_date, schedule_time, is_taken) "
            "VALUES (%s, %s, %s, %s, %s, 0)",
            (pet_result["id"], name, dosage, date_str, time_str)
        )
        new_id = db.lastrowid()

        return JsonTool(code=200, msg="添加成功", data={"id": str(new_id)})

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"服务器错误: {str(e)}", data=None)


# =====================
# 删除用药提醒
# =====================
@router.post("/api/membershipview/delete_medication", response_model=JsonTool)
async def delete_medication(request_data: Medication):
    try:
        decoded = decode_token_for_auth(request_data.token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        med_id = request_data.id
        if not med_id:
            return JsonTool(code=400, msg="缺少用药记录ID", data=None)

        record = db.query_one("""
            SELECT m.id 
            FROM medications m
            JOIN pets p ON m.pet_id = p.id
            WHERE m.id = %s AND p.user_id = %s
        """, (med_id, user_id))

        if not record:
            return JsonTool(code=400, msg="用药记录不存在或无权限删除", data=None)

        db.execute("DELETE FROM medications WHERE id = %s", (med_id,))
        return JsonTool(code=200, msg="删除成功", data=None)

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"服务器错误: {str(e)}", data=None)


# =====================
# 更新用药状态（isTaken）
# =====================
@router.post("/api/membershipview/update_medication", response_model=JsonTool)
async def update_medication(request_data: Medication):
    try:
        decoded = decode_token_for_auth(request_data.token)
        user_id = decoded["user_id"]
        claimed_token_version = decoded["token_version"]

        db_user = db.query_one("SELECT id, token_version FROM users WHERE id = %s", (user_id,))
        if not db_user:
            return JsonTool(code=401, msg="用户不存在", data=None)
        current_token_version = db_user.get("token_version") or 0
        if claimed_token_version != current_token_version:
            return JsonTool(code=401, msg="登录状态已过期，请重新登录", data=None)

        med_id = request_data.id
        is_taken = request_data.isTaken

        if not med_id:
            return JsonTool(code=400, msg="缺少用药记录ID", data=None)
        if is_taken is None:
            return JsonTool(code=400, msg="缺少 isTaken 字段", data=None)

        record = db.query_one("""
            SELECT m.id 
            FROM medications m
            JOIN pets p ON m.pet_id = p.id
            WHERE m.id = %s AND p.user_id = %s
        """, (med_id, user_id))

        if not record:
            return JsonTool(code=400, msg="用药记录不存在或无权限修改", data=None)

        is_taken_int = 1 if is_taken else 0
        db.execute("UPDATE medications SET is_taken = %s WHERE id = %s", (is_taken_int, med_id))
        return JsonTool(code=200, msg="更新成功", data=None)

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"服务器错误: {str(e)}", data=None)


# =====================
# 获取用户全部宠物列表
# =====================
@router.post("/api/membershipview/get_pets", response_model=JsonTool)
async def get_pets(request_data: Medication):
    try:
        decoded = decode_token_for_auth(request_data.token)
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
                id,
                name,
                COALESCE(breed, '') AS breed,
                COALESCE(avatar_url, '') AS avatar_url,
                is_memorial,
                COALESCE(gender, '') AS gender,
                COALESCE(birthday, '') AS birthday,
                COALESCE(hobbies, '') AS hobbies,
                COALESCE(memorial_date, '') AS memorial_date
            FROM pets
            WHERE user_id = %s
            ORDER BY is_memorial ASC, id DESC
        """
        results = db.query_all(query, (user_id,))

        pets_list: List[PetProfile] = []
        for row in results:
            pet = {
                "id": str(row["id"]),
                "name": row["name"],
                "breed": row["breed"],
                "avatar": row["avatar_url"],
                "isMemorial": bool(row["is_memorial"]),
                "gender": row["gender"],
                "birthday": str(row["birthday"]) if row["birthday"] else "",
                "hobbies": row["hobbies"],
                "memorialDate": str(row["memorial_date"]) if row["memorial_date"] else "",
            }
            pets_list.append(pet)

        return JsonTool(code=200, msg="成功", data={"pets": pets_list})

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"服务器内部错误: {str(e)}", data=None)


# import json
# from pathlib import Path
# import traceback
# from typing import Any, Dict, List, Optional
# from fastapi import APIRouter, Form
# from pydantic import BaseModel
# import uuid
# import os
# from datetime import datetime, timedelta
# from .schemas import DeleteCarts, DiscoveryBuildOrder,CartItem, DiscoveryBuildCarts, DiscoveryRequest, JsonTool, Medication, PetProfile
# from sql.mysql_DB import db
# from tools.TokenTools import decode_token_for_auth

# # 创建API路由器
# router = APIRouter()

# # =====================
# # 获取用户下全部提醒列表
# # =====================
# @router.post("/api/membershipview/get_all_medication", response_model=JsonTool)
# async def get_all_medication(request_data: Medication):
#     try:
#         user_id = request_data.user_id

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户验证失败，用户ID: {user_id} 不存在")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 查询该用户所有宠物的用药记录（关联 pets 表以获取宠物名称）
#         query = """
#             SELECT 
#                 m.id,
#                 m.pet_id,
#                 p.name AS pet_name,
#                 m.name AS medication_name,
#                 m.dosage,
#                 m.schedule_date AS date,
#                 m.schedule_time AS time,
#                 m.is_taken
#             FROM medications m
#             JOIN pets p ON m.pet_id = p.id
#             WHERE p.user_id = %s
#             ORDER BY m.schedule_date DESC, m.schedule_time DESC
#         """
#         rows = db.query_all(query, (user_id,))

#         # 3. 构建返回数据列表
#         medication_list = []
#         for row in rows:
#             med = {
#                 "id": str(row["id"]),
#                 "petName": row["pet_name"],
#                 "name": row["medication_name"],
#                 "dosage": row["dosage"],
#                 "date": row["date"].strftime("%Y-%m-%d") if row["date"] else "",
#                 "time": str(row["time"]) if row["time"] else "00:00",
#                 "isTaken": bool(row["is_taken"])
#             }
#             medication_list.append(med)

#         return JsonTool(code=200, msg="获取成功", data={"medications": medication_list})

#     except Exception as e:
#         print(f"获取用药提醒列表时发生异常: {str(e)}")
#         traceback.print_exc()
#         return JsonTool(code=500, msg="服务器错误", data=None)

# # =====================
# # 添加新列表提醒
# # =====================
# @router.post("/api/membershipview/add_medication", response_model=JsonTool)
# async def add_medication(request_data: Medication):
#     try:
#         user_id = request_data.user_id
#         petName = request_data.petName
#         name = request_data.name
#         dosage = request_data.dosage
#         date_str = request_data.date
#         time_str = request_data.time

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户验证失败，用户ID: {user_id} 不存在")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 验证宠物是否存在且属于该用户
#         if not petName:
#             return JsonTool(code=400, msg="缺少宠物名字", data=None)
#         pet_result = db.query_one(
#             "SELECT id, is_memorial FROM pets WHERE name = %s AND user_id = %s", 
#             (petName, user_id)
#         )
#         if not pet_result:
#             print(f"宠物验证失败，name: {petName} 不属于用户 {user_id}")
#             return JsonTool(code=400, msg="宠物不存在或无权限", data=None)

#         # 3. 禁止为“星空宠物”（已故）添加用药
#         if pet_result.get("is_memorial") or pet_result.get("is_memorial")==1:
#             return JsonTool(code=400, msg="无法为已故宠物添加用药提醒", data=None)

#         # 4. 验证药品名称
#         if not name:
#             return JsonTool(code=400, msg="药品名称不能为空", data=None)

#         # 5. 插入新用药记录
#         insert_query = """
#             INSERT INTO medications (pet_id, name, dosage, schedule_date, schedule_time, is_taken)
#             VALUES (%s, %s, %s, %s, %s, 0)
#         """
#         db.execute(insert_query, (pet_result.get("id"), name, dosage, date_str, time_str))

#         # 6. 返回新记录 ID（可选）
#         new_id = db.lastrowid()
#         return JsonTool(code=200, msg="添加成功", data={"id": str(new_id)})

#     except Exception as e:
#         print(f"添加用药提醒时发生异常: {str(e)}")
#         traceback.print_exc()
#         return JsonTool(code=500, msg="服务器错误", data=None)

# # =====================
# # 删除列表提醒
# # =====================
# @router.post("/api/membershipview/delete_medication", response_model=JsonTool)
# async def delete_medication(request_data: Medication):
#     try:
#         user_id = request_data.user_id
#         med_id = request_data.id

#         if not med_id:
#             return JsonTool(code=400, msg="缺少用药记录ID", data=None)

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 验证该用药记录是否属于该用户（通过关联 pets）
#         record = db.query_one("""
#             SELECT m.id 
#             FROM medications m
#             JOIN pets p ON m.pet_id = p.id
#             WHERE m.id = %s AND p.user_id = %s
#         """, (med_id, user_id))

#         if not record:
#             return JsonTool(code=400, msg="用药记录不存在或无权限删除", data=None)

#         # 3. 执行删除
#         db.execute("DELETE FROM medications WHERE id = %s", (med_id,))
#         return JsonTool(code=200, msg="删除成功", data=None)

#     except Exception as e:
#         print(f"删除用药提醒时发生异常: {str(e)}")
#         traceback.print_exc()
#         return JsonTool(code=500, msg="服务器错误", data=None)

# # =====================
# # 修改列表提醒
# # =====================
# @router.post("/api/membershipview/update_medication", response_model=JsonTool)
# async def update_medication(request_data: Medication):
#     try:
#         user_id = request_data.user_id
#         med_id = request_data.id
#         is_taken = request_data.isTaken

#         if not med_id:
#             return JsonTool(code=400, msg="缺少用药记录ID", data=None)
#         if is_taken is None:
#             return JsonTool(code=400, msg="缺少 is_taken 字段", data=None)

#         # 1. 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 验证用药记录归属
#         record = db.query_one("""
#             SELECT m.id 
#             FROM medications m
#             JOIN pets p ON m.pet_id = p.id
#             WHERE m.id = %s AND p.user_id = %s
#         """, (med_id, user_id))

#         if not record:
#             return JsonTool(code=400, msg="用药记录不存在或无权限修改", data=None)

#         # 3. 更新 is_taken 状态（0 或 1）
#         is_taken_int = 1 if is_taken else 0
#         db.execute(
#             "UPDATE medications SET is_taken = %s WHERE id = %s", 
#             (is_taken_int, med_id)
#         )

#         return JsonTool(code=200, msg="更新成功", data=None)

#     except Exception as e:
#         print(f"更新用药提醒状态时发生异常: {str(e)}")
#         traceback.print_exc()
#         return JsonTool(code=500, msg="服务器错误", data=None)
    
# # =====================
# # 获取用户下全部宠物x列表
# # =====================
# @router.post("/api/membershipview/get_pets", response_model=JsonTool)
# async def get_pets(request_data: Medication):
#     """
#     获取用户下的全部宠物列表（包括纪念宠物）
#     注意：虽然请求体用 Medication，但我们只取 user_id
#     """
#     try:
#         user_id = request_data.user_id
#         if not user_id or user_id <= 0:
#             return JsonTool(code=400, msg="无效的用户ID", data=None)

#         # 执行数据库查询（根据你的实际数据库连接方式调整）
#         query = """
#             SELECT 
#                 id,
#                 name,
#                 COALESCE(breed, '') AS breed,
#                 COALESCE(avatar_url, '') AS avatar_url,
#                 is_memorial,
#                 COALESCE(gender, '') AS gender,
#                 COALESCE(birthday, '') AS birthday,
#                 COALESCE(hobbies, '') AS hobbies,
#                 COALESCE(memorial_date, '') AS memorial_date
#             FROM pets
#             WHERE user_id = %s
#             ORDER BY is_memorial ASC, id DESC
#         """
#         # 假设你使用的是 async 数据库（如 databases + aiomysql）
#         results = db.query_all(query, (user_id,))

#         # 转换为前端需要的 PetProfile 结构（驼峰命名）
#         pets_list: List[PetProfile] = []
#         for row in results:
#             pet = {
#                 "id": str(row.get("id", "")),
#                 "name": row.get("name", ""),
#                 "breed": row.get("breed", ""),
#                 "avatar": row.get("avatar_url", ""),  # 数据库字段是 avatar_url
#                 "isMemorial": bool(row.get("is_memorial", False)),
#                 "gender": row.get("gender", ""),
#                 "birthday": str(row.get("birthday", "")) if row.get("birthday") else "",
#                 "hobbies": row.get("hobbies", ""),
#                 "memorialDate": str(row.get("memorial_date", "")) if row.get("memorial_date") else "",
#             }
#             pets_list.append(pet)

#         return JsonTool(code=200, msg="成功", data={"pets":pets_list})

#     except Exception as e:
#         print(f"获取宠物列表时发生异常: {str(e)}")
#         traceback.print_exc()
#         return JsonTool(code=500, msg="服务器内部错误", data=None)
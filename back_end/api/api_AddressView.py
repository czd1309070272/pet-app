import json
from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from .schemas import Address, DiscoveryBuildOrder, Order, OrderItem, Product, CartItem, DiscoveryBuildCarts, DiscoveryRequest, DiscoveryShopMes, JsonTool
from sql.mysql_DB import db
from .tools.TokenTools import decode_token_for_auth

# 创建API路由器
router = APIRouter()


# ================================
# 4. 获取用户的地址列表
# ================================
@router.post("/api/addressview/get_useraddress", response_model=JsonTool)
async def get_useraddress(request_data: Address):
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

        query = """
            SELECT 
                id,
                receiver_name,
                phone,
                area,
                detail,
                label,
                is_default
            FROM addresses 
            WHERE user_id = %s
            ORDER BY is_default DESC, id DESC
        """
        rows = db.query_all(query, (user_id,))

        address_list: List[Address] = []
        for row in rows:
            addr = Address(
                id=str(row.get("id")),
                receiverName=row.get("receiver_name") or "",
                phone=row.get("phone") or "",
                area=row.get("area") or "",
                detail=row.get("detail") or "",
                label=row.get("label") or "HOME",
                isDefault=bool(row.get("is_default")),
                token=token
            )
            address_list.append(addr)

        return JsonTool(code=200, msg="获取成功", data={"addressList": address_list})

    except Exception as e:
        print(f"查询地址时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"获取地址失败: {str(e)}", data=None)


# ================================
# 5. 创建用户地址
# ================================
@router.post("/api/addressview/create_useraddress", response_model=JsonTool)
def create_useraddress(request_data: Address):
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

        # 如果设为默认地址，先取消该用户其他地址的默认状态
        if request_data.isDefault:
            db.execute(
                "UPDATE addresses SET is_default = 0 WHERE user_id = %s",
                (user_id,)
            )

        # 插入新地址
        db.execute(
            """
            INSERT INTO addresses (
                user_id, receiver_name, phone, area, detail, label, is_default
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                request_data.receiverName,
                request_data.phone,
                request_data.area,
                request_data.detail,
                request_data.label,
                1 if request_data.isDefault else 0
            )
        )

        # 获取最新插入的地址
        new_addr = db.query_one(
            "SELECT * FROM addresses WHERE user_id = %s ORDER BY id DESC LIMIT 1",
            (user_id,)
        )

        if not new_addr:
            return JsonTool(code=500, msg="创建地址后无法获取新地址", data=None)

        saved_address = Address(
            id=str(new_addr["id"]),
            receiverName=new_addr["receiver_name"] or "",
            phone=new_addr["phone"] or "",
            area=new_addr["area"] or "",
            detail=new_addr["detail"] or "",
            label=new_addr["label"] or "HOME",
            isDefault=bool(new_addr["is_default"]),
            token=token
        )

        return JsonTool(code=200, msg="地址创建成功", data=saved_address.dict())

    except Exception as e:
        print(f"创建地址时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"创建地址失败: {str(e)}", data=None)


# ================================
# 6. 修改用户地址
# ================================
@router.post("/api/addressview/update_useraddress", response_model=JsonTool)
def update_useraddress(request_data: Address):
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

        addr_id = request_data.id
        if not addr_id or not addr_id.isdigit():
            return JsonTool(code=400, msg="无效的地址ID", data=None)

        # 验证地址归属
        addr_result = db.query_one(
            "SELECT id FROM addresses WHERE id = %s AND user_id = %s",
            (int(addr_id), user_id)
        )
        if not addr_result:
            return JsonTool(code=403, msg="无权修改此地址", data=None)

        # 如果设为默认，清除其他默认地址
        if request_data.isDefault:
            db.execute(
                "UPDATE addresses SET is_default = 0 WHERE user_id = %s AND id != %s",
                (user_id, int(addr_id))
            )

        # 执行更新
        db.execute(
            """
            UPDATE addresses SET
                receiver_name = %s,
                phone = %s,
                area = %s,
                detail = %s,
                label = %s,
                is_default = %s
            WHERE id = %s AND user_id = %s
            """,
            (
                request_data.receiverName,
                request_data.phone,
                request_data.area,
                request_data.detail,
                request_data.label,
                1 if request_data.isDefault else 0,
                int(addr_id),
                user_id
            )
        )

        updated_row = db.query_one(
            "SELECT * FROM addresses WHERE id = %s AND user_id = %s",
            (int(addr_id), user_id)
        )
        if not updated_row:
            return JsonTool(code=500, msg="更新后未找到地址", data=None)

        updated_address = Address(
            id=str(updated_row["id"]),
            receiverName=updated_row["receiver_name"] or "",
            phone=updated_row["phone"] or "",
            area=updated_row["area"] or "",
            detail=updated_row["detail"] or "",
            label=updated_row["label"] or "HOME",
            isDefault=bool(updated_row["is_default"]),
            token=token
        )

        return JsonTool(code=200, msg="地址更新成功", data=updated_address.dict())

    except Exception as e:
        print(f"修改地址时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"修改地址失败: {str(e)}", data=None)


# ================================
# 7. 删除用户地址
# ================================
@router.post("/api/addressview/delete_useraddress", response_model=JsonTool)
def delete_useraddress(request_data: Address):
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

        addr_id = request_data.id
        if not addr_id or not addr_id.isdigit():
            return JsonTool(code=400, msg="无效的地址ID", data=None)

        addr_result = db.query_one(
            "SELECT id FROM addresses WHERE id = %s AND user_id = %s",
            (int(addr_id), user_id)
        )
        if not addr_result:
            return JsonTool(code=403, msg="无权删除此地址", data=None)

        db.execute(
            "DELETE FROM addresses WHERE id = %s AND user_id = %s",
            (int(addr_id), user_id)
        )

        return JsonTool(code=200, msg="地址删除成功", data=None)

    except Exception as e:
        print(f"删除地址时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"删除地址失败: {str(e)}", data=None)


# import json
# from pathlib import Path
# import traceback
# from typing import Any, Dict, List, Optional
# from fastapi import APIRouter, Form
# from pydantic import BaseModel
# import uuid
# import os
# from datetime import datetime
# from .schemas import Address, DiscoveryBuildOrder, Order, OrderItem, Product,CartItem, DiscoveryBuildCarts, DiscoveryRequest, DiscoveryShopMes, JsonTool
# from sql.mysql_DB import db
# from tools.TokenTools import decode_token_for_auth

# # 创建API路由器
# router = APIRouter()


# # ================================
# # 4. 获取用户的地址列表 ✅（返回 Address 列表）
# # ================================
# @router.post("/api/addressview/get_useraddress", response_model=JsonTool)
# async def get_useraddress(request_data: Address):
#     try:
#         user_id = request_data.user_id
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             print(f"用户验证失败，用户ID: {user_id} 不存在")
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 查询用户的所有地址
#         query = """
#             SELECT 
#                 id,
#                 receiver_name,
#                 phone,
#                 area,
#                 detail,
#                 label,
#                 is_default
#             FROM addresses 
#             WHERE user_id = %s
#             ORDER BY is_default DESC, id DESC
#         """
#         rows = db.query_all(query, (user_id,))

#         # 构建 Address 对象列表（注意字段名转换：下划线 → 驼峰）
#         address_list: List[Address] = []
#         for row in rows:
#             addr = Address(
#                 id=str(row.get("id")),               # 转为字符串（因模型定义为 str）
#                 receiverName=row.get("receiver_name"),
#                 phone=row.get("phone"),
#                 area=row.get("area"),
#                 detail=row.get("detail"),
#                 label=row.get("label"),
#                 isDefault=bool(row.get("is_default")),
#                 user_id=user_id
#             )
#             address_list.append(addr)

#         return JsonTool(code=200, msg="获取成功", data={"addressList":address_list})

#     except Exception as e:
#         print(f"查询地址时发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"获取地址失败: {str(e)}", data=None)
    
# # ================================
# # 5. 创建用户地址 ✅（返回 Address 对象）
# # ================================
# @router.post("/api/addressview/create_useraddress", response_model=JsonTool)
# def create_useraddress(request_data: Address):
#     try:
#         user_id = request_data.user_id
#         if not user_id or user_id <= 0:
#             return JsonTool(code=400, msg="无效的用户ID", data=None)

#         # 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 如果设为默认地址，先取消该用户其他地址的默认状态
#         if request_data.isDefault:
#             db.execute(
#                 "UPDATE addresses SET is_default = 0 WHERE user_id = %s",
#                 (user_id,)
#             )

#         # 插入新地址
#         db.execute(
#             """
#             INSERT INTO addresses (
#                 user_id, receiver_name, phone, area, detail, label, is_default
#             ) VALUES (%s, %s, %s, %s, %s, %s, %s)
#             """,
#             (
#                 user_id,
#                 request_data.receiverName,
#                 request_data.phone,
#                 request_data.area,
#                 request_data.detail,
#                 request_data.label,
#                 1 if request_data.isDefault else 0
#             )
#         )

#         # 获取刚插入的地址 ID（假设你的 db 支持 lastrowid，或通过查询获取）
#         # 如果不支持 lastrowid，可以用以下方式：
#         new_addr = db.query_one(
#             "SELECT * FROM addresses WHERE user_id = %s ORDER BY id DESC LIMIT 1",
#             (user_id,)
#         )

#         if not new_addr:
#             return JsonTool(code=500, msg="创建地址后无法获取新地址", data=None)

#         saved_address = Address(
#             id=str(new_addr["id"]),
#             receiverName=new_addr["receiver_name"],
#             phone=new_addr["phone"],
#             area=new_addr["area"],
#             detail=new_addr["detail"],
#             label=new_addr["label"] or "HOME",
#             isDefault=bool(new_addr["is_default"]),
#             user_id=user_id
#         )

#         return JsonTool(code=200, msg="地址创建成功", data=saved_address.dict())

#     except Exception as e:
#         print(f"创建地址时发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"创建地址失败: {str(e)}", data=None)

# # ================================
# # 6. 修改用户地址 ✅（返回更新后的 Address 对象）
# # ================================
# @router.post("/api/addressview/update_useraddress", response_model=JsonTool)
# def update_useraddress(request_data: Address):
#     try:
#         addr_id = request_data.id
#         user_id = request_data.user_id

#         if not addr_id or not addr_id.isdigit():
#             return JsonTool(code=400, msg="无效的地址ID", data=None)
#         if not user_id or user_id <= 0:
#             return JsonTool(code=400, msg="无效的用户ID", data=None)

#         # 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 验证地址是否属于该用户
#         addr_result = db.query_one(
#             "SELECT id FROM addresses WHERE id = %s AND user_id = %s",
#             (int(addr_id), user_id)
#         )
#         if not addr_result:
#             return JsonTool(code=403, msg="无权修改此地址", data=None)

#         # 如果设为默认地址，先取消该用户其他地址的默认状态（排除自己）
#         if request_data.isDefault:
#             db.execute(
#                 "UPDATE addresses SET is_default = 0 WHERE user_id = %s AND id != %s",
#                 (user_id, int(addr_id))
#             )

#         # 更新地址
#         db.execute(
#             """
#             UPDATE addresses SET
#                 receiver_name = %s,
#                 phone = %s,
#                 area = %s,
#                 detail = %s,
#                 label = %s,
#                 is_default = %s
#             WHERE id = %s AND user_id = %s
#             """,
#             (
#                 request_data.receiverName,
#                 request_data.phone,
#                 request_data.area,
#                 request_data.detail,
#                 request_data.label,
#                 1 if request_data.isDefault else 0,
#                 int(addr_id),
#                 user_id
#             )
#         )

#         # 查询更新后的地址
#         updated_row = db.query_one(
#             "SELECT * FROM addresses WHERE id = %s AND user_id = %s",
#             (int(addr_id), user_id)
#         )
#         if not updated_row:
#             return JsonTool(code=500, msg="更新后未找到地址", data=None)

#         updated_address = Address(
#             id=str(updated_row["id"]),
#             receiverName=updated_row["receiver_name"],
#             phone=updated_row["phone"],
#             area=updated_row["area"],
#             detail=updated_row["detail"],
#             label=updated_row["label"] or "HOME",
#             isDefault=bool(updated_row["is_default"]),
#             user_id=user_id
#         )

#         return JsonTool(code=200, msg="地址更新成功", data=updated_address.dict())

#     except Exception as e:
#         print(f"修改地址时发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"修改地址失败: {str(e)}", data=None)


# # ================================
# # 7. 删除用户地址 ✅（成功返回空 data）
# # ================================
# @router.post("/api/addressview/delete_useraddress", response_model=JsonTool)
# def delete_useraddress(request_data: Address):
#     try:
#         addr_id = request_data.id
#         user_id = request_data.user_id

#         if not addr_id or not addr_id.isdigit():
#             return JsonTool(code=400, msg="无效的地址ID", data=None)
#         if not user_id or user_id <= 0:
#             return JsonTool(code=400, msg="无效的用户ID", data=None)

#         # 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 验证地址是否属于该用户
#         addr_result = db.query_one(
#             "SELECT id FROM addresses WHERE id = %s AND user_id = %s",
#             (int(addr_id), user_id)
#         )
#         if not addr_result:
#             return JsonTool(code=403, msg="无权删除此地址", data=None)

#         # 执行删除
#         db.execute(
#             "DELETE FROM addresses WHERE id = %s AND user_id = %s",
#             (int(addr_id), user_id)
#         )

#         return JsonTool(code=200, msg="地址删除成功", data=None)

#     except Exception as e:
#         print(f"删除地址时发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"删除地址失败: {str(e)}", data=None)


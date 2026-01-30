import json
from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Form
from pydantic import BaseModel
import uuid
import os
from datetime import datetime, time, timedelta
from .schemas import DeleteCarts, DiscoveryBuildOrder,CartItem, DiscoveryBuildCarts, DiscoveryRequest, JsonTool, VipProfile
from sql.mysql_DB import db

# 创建API路由器
router = APIRouter()

# 套餐等级映射（用于比较）
VIP_LEVEL_RANK = {
    "SILVER": 1,
    "GOLD": 2,
    "PLATINUM": 3
}
@router.post("/api/membershipview/open_vip", response_model=JsonTool)
async def open_vip(request_data: VipProfile):
    try:
        user_id = request_data.user_id
        pay_status = request_data.pay_status
        requested_combo = request_data.vip_combo

        # 1. 验证用户是否存在
        user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
        if not user_result:
            return JsonTool(code=400, msg="用户不存在", data=None)

        # 2. 检查支付是否成功
        if not pay_status:
            return JsonTool(code=400, msg="支付未成功，无法开通VIP", data=None)

        # 3. 验证套餐名称是否合法
        if requested_combo not in VIP_LEVEL_RANK:
            return JsonTool(code=400, msg="无效的套餐类型，请使用 SILVER / GOLD / PLATINUM", data=None)

        # 4. 获取当前 VIP 状态
        current_vip = db.query_one(
            "SELECT vip_level, vip_expiry FROM users WHERE id = %s", 
            (user_id,)
        )
        
        current_level_str = current_vip.get("vip_level") if current_vip else None
        current_expire = current_vip.get("vip_expiry") if current_vip else None

        # 5. 判断当前是否在有效期内
        now = datetime.now()
        is_active = False
        if current_expire:
            if isinstance(current_expire, str):
                try:
                    current_expire_dt = datetime.strptime(current_expire, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    current_expire_dt = now  # 格式错误视为过期
            else:
                current_expire_dt = current_expire
            is_active = current_expire_dt > now

        # 6. 计算新的到期时间：30天后的 00:00:00
        today = now.date()
        expire_date = today + timedelta(days=30)
        new_expire = datetime.combine(expire_date, time.min)  # 00:00:00

        # 7. 核心逻辑判断
        if not is_active:
            # 情况1: 未开通 或 已过期 → 直接开通新套餐
            new_level = requested_combo
        else:
            # 情况2: 当前处于有效期内
            if current_level_str == requested_combo:
                return JsonTool(code=400, msg="当前套餐仍在有效期内，无需重复开通", data=None)
            
            current_rank = VIP_LEVEL_RANK.get(current_level_str, 0)
            requested_rank = VIP_LEVEL_RANK[requested_combo]

            if requested_rank > current_rank:
                new_level = requested_combo
            else:
                return JsonTool(code=400, msg="不支持降级或重复开通当前套餐", data=None)

        # 8. 更新数据库
        expire_str = new_expire.strftime('%Y-%m-%d %H:%M:%S')
        update_query = """
            UPDATE users 
            SET vip_level = %s,
                vip_expiry = %s 
            WHERE id = %s
        """
        db.execute(update_query, (new_level, expire_str, user_id))

        # 9. 重新查询完整用户信息
        full_user = db.query_one("""
            SELECT 
                id, username, nickname, email, phone, avatar_url, gender,
                vip_level, vip_expiry, level, google_id, apple_id
            FROM users 
            WHERE id = %s
        """, (user_id,))

        if not full_user:
            return JsonTool(code=500, msg="用户数据异常", data=None)

        # 10. 构造前端需要的数据结构
        user_data = {
            "user_id": full_user["id"],
            "username": full_user["username"],
            "nickname": full_user.get("nickname"),
            "email": full_user.get("email"),
            "phone": full_user.get("phone"),
            "avatar_url": full_user.get("avatar_url"),
            "gender": full_user.get("gender"),
            "vip_level": full_user.get("vip_level"),
            "vip_expiry": full_user.get("vip_expiry"),  # 字段名保持一致
            "level": full_user.get("level"),
            "google_id": full_user.get("google_id"),
            "apple_id": full_user.get("apple_id"),
        }

        return JsonTool(
            code=200, 
            msg="VIP开通/升级成功", 
            data=user_data
        )

    except Exception as e:
        print(f"开通VIP时发生异常: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonTool(code=500, msg="服务器错误", data=None)

# 修改用户vip状态
@router.post("/api/membershipview/update_vip_status", response_model=JsonTool)
def update_vip_status(request_data: VipProfile):
    try:
        user_id = request_data.user_id

        # 1. 验证用户是否存在
        user_result = db.query_one(
            "SELECT id, is_vip, vip_expire_time FROM users WHERE id = %s", (user_id,)
        )
        if not user_result:
            print(f"用户验证失败，用户ID: {user_id} 不存在")
            return JsonTool(code=400, msg="用户不存在", data=None)

        # 2. 检查是否需要更新VIP状态（仅当 is_vip=1 且有过期时间时才检查）
        is_vip = bool(user_result.get("is_vip"))
        vip_expire_time = user_result.get("vip_expire_time")

        # 如果当前不是VIP，无需处理
        if not is_vip:
            return JsonTool(code=200, msg="用户当前不是VIP", data={"is_vip": False})

        # 如果没有过期时间（异常情况），也视为非VIP
        if not vip_expire_time:
            db.execute("UPDATE users SET is_vip = 0 WHERE id = %s", (user_id,))
            return JsonTool(code=200, msg="VIP状态已修正（无过期时间）", data={"is_vip": False})

        # 3. 判断是否过期
        from datetime import datetime
        now = datetime.now()

        # 注意：vip_expire_time 是 datetime 类型（由数据库驱动返回）
        if now > vip_expire_time:
            # 已过期，更新状态
            db.execute("UPDATE users SET is_vip = 0 WHERE id = %s", (user_id,))
            print(f"用户 {user_id} VIP 已过期，状态已更新为非VIP")
            return JsonTool(code=200, msg="VIP已过期，状态已更新", data={"is_vip": False})
        else:
            # 未过期
            return JsonTool(code=200, msg="VIP有效", data={"is_vip": True})

    except Exception as e:
        print(f"修改用户VIP状态时发生异常: {str(e)}")
        traceback.print_exc()
        return JsonTool(code=500, msg="服务器错误", data=None)
    
# 获取用户vip状态
@router.post("/api/membershipview/get_vip_status", response_model=JsonTool)
def get_vip_status(request_data: DiscoveryRequest):
    try:
        return JsonTool(code=200, msg="VIP有效", data={"is_vip": True})
    except Exception as e:
            print(f"修改用户VIP状态时发生异常: {str(e)}")
            traceback.print_exc()
            return JsonTool(code=500, msg="服务器错误", data=None)
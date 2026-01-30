import json
from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Form
from pydantic import BaseModel
import uuid
import os
from datetime import datetime
from .schemas import Address, DiscoveryBuildOrder, Order, OrderItem, Product,CartItem, DiscoveryBuildCarts, DiscoveryRequest, DiscoveryShopMes, JsonTool, UpdateOrderRequest
from sql.mysql_DB import db

# 创建API路由器
router = APIRouter()

# ================================
# 3. 获取用户的订单列表 ✅（全新实现）
# ================================
# --- Helper function to fetch order items ---
def get_order_items(order_id: str):
    """
    根据业务订单号（如 'ORD-20260115-F6192D'）查询订单明细
    """
    query = """
        SELECT 
            name_snapshot AS name,
            price_snapshot AS price,
            quantity,
            image_snapshot AS imageUrl
        FROM order_items 
        WHERE order_id = %s
    """
    items = db.query_all(query, (order_id,))
    # 处理 NULL 图片
    for item in items:
        if item['imageUrl'] is None:
            item['imageUrl'] = ''
    return items

# --- Main API endpoint ---
@router.post("/api/ordersview/get_discoveryview_userorder", response_model=JsonTool)
async def get_discoveryview_userorder(request_data: DiscoveryRequest):
    try:
        user_id = request_data.user_id
        pages = request_data.pages
        limit = request_data.limit
        category = request_data.category  # e.g., "PENDING_PAY", "ALL"

        print(f"开始查询用户订单，用户ID: {user_id}, 页码: {pages}, 限制: {limit}, 状态: {category}")
        
        # 验证用户是否存在
        user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
        if not user_result:
            print(f"用户验证失败，用户ID: {user_id} 不存在")
            return JsonTool(code=400, msg="用户不存在", data=None)

        offset = limit * (pages - 1)
        print(f"计算分页偏移量: limit({limit}) * (pages({pages}) - 1) = {offset}")

        # 构建 SQL 查询（注意：使用 orders.id 作为 Order.id）
        base_query = """
            SELECT 
                id,                  -- 自增主键，用于前端 key
                order_id,            -- 业务订单号，用于关联 order_items
                total_price,
                status,
                tracking_no,
                created_at,
                addressId
            FROM orders 
            WHERE user_id = %s
        """
        params = [user_id]

        if category != "ALL":
            base_query += " AND status = %s"
            params.append(category)
            print(f"添加状态过滤条件，状态: {category}")

        base_query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        print(f"执行SQL查询: {base_query}")
        print(f"查询参数: {tuple(params)}")
        
        raw_orders = db.query_all(base_query, tuple(params))
        print(f"查询完成，返回 {len(raw_orders)} 条订单记录")

        # 构建完整的 Order 对象列表
        orders = []
        for order in raw_orders:
            # 获取订单明细
            order_items = get_order_items(order['order_id'])
            
            # 构造 Order 对象
            order_obj = Order(
                id=order['order_id'],  # 使用自增主键，确保唯一且为数字
                status=order['status'],
                items=[
                    OrderItem(
                        name=item['name'],
                        price=float(item['price']),
                        quantity=item['quantity'],
                        imageUrl=item['imageUrl'] or ''
                    )
                    for item in order_items
                ],
                totalPrice=float(order['total_price']),
                date=order['created_at'].isoformat() if hasattr(order['created_at'], 'isoformat') else str(order['created_at']),
                trackingNumber=order['tracking_no'] or '',
                addressId=order['addressId'],
            )
            orders.append(order_obj.dict())

        return JsonTool(code=200, msg="获取订单成功", data={"orders": orders})
    
    except Exception as e:
        print(f"查询订单时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"获取订单失败: {str(e)}", data=None)
    

from datetime import datetime, timedelta

@router.post("/api/ordersview/update_discoveryview_userorder", response_model=JsonTool)
async def update_discoveryview_userorder(request_data: UpdateOrderRequest):
    try:
        user_id = request_data.user_id
        order_data = request_data.order

        print(f"开始更新订单，用户ID: {user_id}, 订单ID: {order_data.id}")

        # 1. 验证用户
        print(f"正在验证用户是否存在，用户ID: {user_id}")
        user_exists = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
        print(f"查询结果: {user_exists}")
        if not user_exists:
            return JsonTool(code=404, msg="用户不存在", data=None)

        # 2. 查询订单完整信息（包括 status 和 created_at）
        print(f"正在查询订单信息，订单ID: {order_data.id}")
        order_result = db.query_one(
            "SELECT user_id, status, created_at FROM orders WHERE order_id = %s", 
            (order_data.id,)
        )
        print(f"订单查询结果: {order_result}")
        if not order_result:
            return JsonTool(code=404, msg="订单不存在", data=None)

        # 3. 验证订单归属
        print(f"验证订单归属 - 订单用户ID: {order_result['user_id']}, 请求用户ID: {user_id}")
        if str(order_result['user_id']) != str(user_id):
            return JsonTool(code=403, msg="无权修改此订单", data=None)

        current_status = order_result['status']
        created_at = order_result['created_at']  # datetime 对象（假设你的 db 返回的是 datetime）
        print(f"当前订单状态: {current_status}, 创建时间: {created_at}")

        # 4. 【关键】判断订单是否已过期或不可修改
        # 已完成或已取消的订单禁止修改
        print(f"检查订单状态是否允许修改，当前状态: {current_status}")
        if current_status in ('COMPLETED', 'CANCELLED'):
            print("订单已完成或已取消，无法修改")
            return JsonTool(code=400, msg="订单已完成或已取消，无法修改", data=None)

        # 如果是待支付订单，检查是否超时（例如：15分钟）
        if current_status == 'PENDING_PAY':
            print("订单为待支付状态，检查是否超时")
            # 计算当前时间与订单创建时间的差值
            now = datetime.now()
            print(f"当前时间: {now}, 订单创建时间: {created_at}")
            # 注意：created_at 可能是 offset-naive 或 aware，这里假设是 naive（无时区）
            if isinstance(created_at, str):
                # 如果 db 返回的是字符串，需解析 
                print("转换创建时间为datetime对象")
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00').replace(' ', 'T'))
                print(f"转换后的创建时间: {created_at}")
            
            time_diff = now - created_at
            print(f"时间差: {time_diff}, 超时阈值: 15分钟")
            if time_diff > timedelta(minutes=15):
                print("订单已超时，无法修改")
                return JsonTool(code=400, msg="订单已超时，无法修改", data=None)

        # 5. 【可选】验证地址是否属于该用户
        print(f"检查收货地址有效性，地址ID: {order_data.addressId}")
        if order_data.addressId:
            address_valid = db.query_one(
                "SELECT id FROM addresses WHERE id = %s AND user_id = %s",
                (order_data.addressId, user_id)
            )
            print(f"地址验证结果: {address_valid}")
            if not address_valid:
                return JsonTool(code=400, msg="收货地址无效", data=None)

        # 6. 安全更新（仅允许改状态、物流号、地址）
        print(f"准备更新订单，新状态: {order_data.status}, 物流号: {order_data.trackingNumber}, 地址ID: {order_data.addressId}")
        update_query = """
            UPDATE orders 
            SET 
                status = %s,
                tracking_no = %s,
                addressId = %s
            WHERE order_id = %s
        """
        rows_affected = db.execute(update_query, (
            order_data.status,
            order_data.trackingNumber or None,
            order_data.addressId,
            order_data.id
        ))
        print(f"订单更新影响行数: {rows_affected}")

        if rows_affected == 0:
            print("订单更新未生效")
            return JsonTool(code=400, msg="订单更新未生效", data=None)

        print(f"订单更新成功，订单ID: {order_data.id}")
        return JsonTool(code=200, msg="订单更新成功", data={"order_id": order_data.id})

    except Exception as e:
        print(f"修改订单时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"修改订单失败: {str(e)}", data=None)
import json
from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
import uuid
import os
from datetime import datetime
from .schemas import DeleteCarts, DiscoveryBuildOrder, CartItem, DiscoveryBuildCarts, DiscoveryRequest, JsonTool
from sql.mysql_DB import db
from .tools.TokenTools import decode_token_for_auth

# 创建API路由器
router = APIRouter()

# ================================
# 2. 获取用户的购物车信息
# ================================
@router.post("/api/cartview/get_discoveryview_carts", response_model=JsonTool)
async def get_discoveryview_carts(request_data: DiscoveryRequest):
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

        pages = request_data.pages
        limit = request_data.limit
        category = request_data.category  # 注意：当前 SQL 未使用 category，如需过滤请补充

        print(f"正在查询用户 {user_id} 的购物车数据，页码: {pages}, 每页: {limit}")

        # 根据 limit 是否为 -1 决定是否分页
        if limit == -1:
            query = """
                SELECT 
                    c.id AS cart_id,
                    c.product_id,
                    c.quantity,
                    c.is_selected,
                    c.created_at,
                    p.name AS product_name,
                    p.price,
                    p.main_image
                FROM carts c
                JOIN products p ON c.product_id = p.product_id
                WHERE c.user_id = %s
                ORDER BY c.created_at DESC
            """
            raw_carts = db.query_all(query, (user_id,))
        else:
            offset = limit * (pages - 1)
            query = """
                SELECT 
                    c.id AS cart_id,
                    c.product_id,
                    c.quantity,
                    c.is_selected,
                    c.created_at,
                    p.name AS product_name,
                    p.price,
                    p.main_image
                FROM carts c
                JOIN products p ON c.product_id = p.product_id
                WHERE c.user_id = %s
                ORDER BY c.created_at DESC
                LIMIT %s OFFSET %s
            """
            raw_carts = db.query_all(query, (user_id, limit, offset))

        formatted_carts = []
        for cart in raw_carts:
            cart_item = CartItem(
                id=cart.get('cart_id', 0),
                productId=cart.get('product_id', 0),
                name=cart.get('product_name', '') or '',
                price=float(cart.get('price', 0.0)) if cart.get('price') is not None else 0.0,
                quantity=int(cart.get('quantity', 0)) if cart.get('quantity') is not None else 0,
                imageUrl=cart.get('main_image', '') or '',
                selected=bool(cart.get('is_selected', False)),
            )
            formatted_carts.append(cart_item)

        print(f"查询到 {len(formatted_carts)} 个购物车项")
        return JsonTool(code=200, msg="获取购物车成功", data={"carts": formatted_carts})

    except Exception as e:
        print(f"获取购物车数据时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"获取购物车失败: {str(e)}", data=None)


# ===============================
# 6. 把购物车内容转为订单储存
# ===============================
@router.post("/api/cartview/build_orders", response_model=JsonTool)
async def build_orders(request: DiscoveryBuildOrder):
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

        cart_items = request.cart_items
        address_id = request.address_id

        print(f"开始创建订单，用户ID: {user_id}")
        if not cart_items:
            return JsonTool(code=400, msg="购物车为空", data=None)

        # 验证地址归属
        sql_address = """
            SELECT receiver_name, phone, area, detail 
            FROM addresses 
            WHERE id = %s AND user_id = %s
        """
        address_result = db.query_one(sql_address, (address_id, user_id))
        if not address_result:
            return JsonTool(code=400, msg="地址不存在或不属于当前用户", data=None)

        address_snapshot = {
            "name": address_result["receiver_name"],
            "phone": address_result["phone"],
            "address": f"{address_result['area']} {address_result['detail']}"
        }

        total_price = sum(item.price * item.quantity for item in cart_items)
        order_id = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4().hex)[:6].upper()}"

        # 插入订单主表
        sql_insert_order = """
            INSERT INTO orders (order_id, user_id, total_price, status, address_snapshot, created_at, addressId)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        db.execute(sql_insert_order, (
            order_id, user_id, total_price, "PENDING_PAY",
            json.dumps(address_snapshot, ensure_ascii=False),
            datetime.now(), address_id
        ))

        # 插入订单商品项
        for item in cart_items:
            cart_record = db.query_one(
                "SELECT product_id FROM carts WHERE id = %s AND user_id = %s",
                (item.id, user_id)
            )
            if not cart_record:
                return JsonTool(code=400, msg=f"购物车项 {item.id} 无效或不属于你", data=None)

            product_id = cart_record["product_id"]
            db.execute("""
                INSERT INTO order_items (
                    order_id, product_id, name_snapshot, price_snapshot, quantity, image_snapshot, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                order_id, product_id, item.name, item.price, item.quantity,
                getattr(item, 'imageUrl', ""), datetime.now()
            ))

        # 安全删除购物车项
        cart_ids = [item.id for item in cart_items]
        if cart_ids:
            placeholders = ','.join(['%s'] * len(cart_ids))
            owned = db.query_all(
                f"SELECT id FROM carts WHERE id IN ({placeholders}) AND user_id = %s",
                (*cart_ids, user_id)
            )
            owned_ids = [row["id"] for row in owned]
            if owned_ids:
                delete_placeholders = ','.join(['%s'] * len(owned_ids))
                db.execute(f"DELETE FROM carts WHERE id IN ({delete_placeholders})", owned_ids)

        return JsonTool(code=200, msg="订单创建成功", data={"order_id": order_id})

    except Exception as e:
        print(f"创建订单时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"创建订单失败: {str(e)}", data=None)


# ===============================
# 删除购物车
# ===============================
@router.post("/api/cartview/delete_carts", response_model=JsonTool)
async def delete_carts(request: DeleteCarts):
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

        cart_ids = request.cartsId_list
        if not cart_ids:
            return JsonTool(code=200, msg="无可删除的购物车项", data=None)

        # 构造安全删除语句
        placeholders = ','.join(['%s'] * len(cart_ids))
        delete_sql = f"DELETE FROM carts WHERE id IN ({placeholders}) AND user_id = %s"
        deleted_count = db.execute(delete_sql, (*cart_ids, user_id))

        if deleted_count == 0:
            return JsonTool(code=404, msg="未找到可删除的购物车项（可能已删除或无权限）", data=None)
        else:
            return JsonTool(
                code=200,
                msg=f"成功删除 {deleted_count} 个购物车项",
                data={"deleted_count": deleted_count}
            )

    except Exception as e:
        print(f"批量删除购物车异常: {e}")
        traceback.print_exc()
        return JsonTool(code=500, msg=f"删除失败: {str(e)}", data=None)


# import json
# from pathlib import Path
# import traceback
# from typing import Any, Dict, List, Optional
# from fastapi import APIRouter, Form
# from pydantic import BaseModel
# import uuid
# import os
# from datetime import datetime
# from .schemas import DeleteCarts, DiscoveryBuildOrder,CartItem, DiscoveryBuildCarts, DiscoveryRequest, JsonTool
# from sql.mysql_DB import db
# from tools.TokenTools import decode_token_for_auth

# # 创建API路由器
# router = APIRouter()

# # ================================
# # 2. 获取用户的购物车信息 ✅（修正版）
# # ================================
# @router.post("/api/cartview/get_discoveryview_carts", response_model=JsonTool)
# async def get_discoveryview_carts(request_data: DiscoveryRequest):
#     try:
#         user_id = request_data.user_id
#         pages = request_data.pages
#         limit = request_data.limit
#         category = request_data.category
        
#         print(f"正在查询用户 {user_id} 的购物车数据，页码: {pages}, 每页: {limit}")
        
#         # 验证用户是否存在
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 根据limit是否为-1来决定查询策略
#         if limit == -1:
#             # 如果limit为-1，则不使用LIMIT和OFFSET，直接获取所有符合条件的数据
#             query = """
#                 SELECT 
#                     c.id AS cart_id,
#                     c.product_id,
#                     c.quantity,
#                     c.is_selected,
#                     c.created_at,
#                     p.name AS product_name,
#                     p.price,
#                     p.main_image
#                 FROM carts c
#                 JOIN products p ON c.product_id = p.product_id
#                 WHERE c.user_id = %s
#                 ORDER BY c.created_at DESC
#             """
#             raw_carts = db.query_all(query, (user_id,))
#         else:
#             # 当limit大于0时，根据提供的pages和limit参数进行分页查询
#             offset = limit * (pages - 1)
#             query = """
#                 SELECT 
#                     c.id AS cart_id,
#                     c.product_id,
#                     c.quantity,
#                     c.is_selected,
#                     c.created_at,
#                     p.name AS product_name,
#                     p.price,
#                     p.main_image
#                 FROM carts c
#                 JOIN products p ON c.product_id = p.product_id
#                 WHERE c.user_id = %s
#                 ORDER BY c.created_at DESC
#                 LIMIT %s OFFSET %s
#             """
#             raw_carts = db.query_all(query, (user_id, limit, offset))
        
#         # 将数据库查询结果转换为CartItem对象
#         formatted_carts = []
#         for cart in raw_carts:
#             cart_item = CartItem(
#                 id=cart.get('cart_id', 0),
#                 productId=cart.get('product_id', 0),
#                 name=cart.get('product_name', '') or '',
#                 price=float(cart.get('price', 0.0)) if cart.get('price') is not None else 0.0,
#                 quantity=int(cart.get('quantity', 0)) if cart.get('quantity') is not None else 0,
#                 imageUrl=cart.get('main_image', '') or '',
#                 selected=cart.get('is_selected', False),  # 注意这里应该是 'is_selected' 而不是 'selected'
#             )
#             formatted_carts.append(cart_item)
        
#         print(f"查询到 {len(formatted_carts)} 个购物车项，格式化后的数据: {formatted_carts[:2]}...")  # 只打印前两个用于调试
        
#         return JsonTool(code=200, msg="获取购物车成功", data={"carts": formatted_carts})
    
#     except Exception as e:
#         print(f"获取购物车数据时发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"获取购物车失败: {str(e)}", data=None)


# # ===============================
# # 6. 把购物车内容转为订单储存
# # ===============================
# @router.post("/api/cartview/build_orders", response_model=JsonTool)
# async def build_orders(request: DiscoveryBuildOrder):
#     try:
#         user_id = request.user_id
#         cart_items = request.cart_items
#         address_id = request.address_id

#         print(f"开始创建订单，用户ID: {user_id}")
#         print(f"购物车商品数量: {len(cart_items)}")
#         print(f"地址ID: {address_id}")

#         if not cart_items:
#             return JsonTool(code=400, msg="购物车为空", data=None)

#         # 1. 验证用户
#         user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
#         if not user_result:
#             return JsonTool(code=400, msg="用户不存在", data=None)
#         print(f"用户验证通过，用户ID: {user_id}")

#         # 2. 验证地址
#         sql_address = """
#             SELECT receiver_name, phone, area, detail 
#             FROM addresses 
#             WHERE id = %s AND user_id = %s
#         """
#         address_result = db.query_one(sql_address, (address_id, user_id))
#         if not address_result:
#             return JsonTool(code=400, msg="地址不存在或不属于当前用户", data=None)
#         print(f"地址验证通过")

#         address_snapshot = {
#             "name": address_result["receiver_name"],
#             "phone": address_result["phone"],
#             "address": f"{address_result['area']} {address_result['detail']}"
#         }

#         # 3. 计算总价（注意：此处依赖前端传的 price，若需强一致性应查数据库）
#         total_price = sum(item.price * item.quantity for item in cart_items)
#         print(f"total_price: {total_price}")

#         # 4. 生成订单号
#         order_id = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4().hex)[:6].upper()}"
#         print(f"生成唯一订单号: {order_id}")

#         # 5. 插入 orders 表
#         sql_insert_order = """
#             INSERT INTO orders (order_id, user_id, total_price, status, address_snapshot, created_at,addressId)
#             VALUES (%s, %s, %s, %s, %s, %s,%s)
#         """
#         db.execute(sql_insert_order, (
#             order_id,
#             user_id,
#             total_price,
#             "PENDING_PAY",
#             json.dumps(address_snapshot, ensure_ascii=False),
#             datetime.now(),
#             address_id
#         ))
#         print(f"订单表插入成功，订单ID: {order_id}")

#         # 6. 插入 order_items：先根据 cart.id 查 product_id
#         print(f"开始插入订单商品，共 {len(cart_items)} 个商品")
#         for i, item in enumerate(cart_items):
#             # 安全查询：通过 cart.id 获取 product_id
#             sql_get_product = "SELECT product_id FROM carts WHERE id = %s AND user_id = %s"
#             cart_record = db.query_one(sql_get_product, (item.id, user_id))
            
#             print(f"正在处理第 {i+1} 个商品，商品 ID: {cart_record}, 用户id：{user_id}")
#             if not cart_record:
#                 return JsonTool(code=400, msg=f"购物车项 {item.id} 无效或不属于你", data=None)

#             product_id = cart_record.get("product_id")
#             print(f"正在处理商品 ID: {product_id}")

#             sql_insert_item = """
#                 INSERT INTO order_items (
#                     order_id, product_id, name_snapshot, price_snapshot, quantity, image_snapshot, created_at
#                 ) VALUES (%s, %s, %s, %s, %s, %s, %s)
#             """
#             db.execute(sql_insert_item, (
#                 order_id,
#                 product_id,
#                 item.name,
#                 item.price,
#                 item.quantity,
#                 getattr(item, 'imageUrl', ""),
#                 datetime.now()
#             ))
#             print(f"插入第 {i+1} 个商品: product_id={product_id}, 数量={item.quantity}")

#         print("订单商品插入完成")

#         # 7. 清空购物车（安全删除）
#         cart_ids = [item.id for item in cart_items]
#         if cart_ids:
#             # 动态生成占位符（仅占位符，不拼接数据）
#             placeholders = ','.join(['%s'] * len(cart_ids))
#             sql_check_ownership = f"SELECT id FROM carts WHERE id IN ({placeholders}) AND user_id = %s"
#             owned_cart_ids = db.query_all(sql_check_ownership, cart_ids + [user_id])
#             owned_ids = [row["id"] for row in owned_cart_ids]

#             if owned_ids:
#                 delete_placeholders = ','.join(['%s'] * len(owned_ids))
#                 sql_delete_cart = f"DELETE FROM carts WHERE id IN ({delete_placeholders})"
#                 db.execute(sql_delete_cart, owned_ids)
#                 print(f"购物车清理完成，删除了 {len(owned_ids)} 条记录")

#         return JsonTool(code=200, msg="订单创建成功", data={"order_id": order_id})

#     except Exception as e:
#         import traceback
#         print(f"创建订单时发生异常: {str(e)}")
#         print(traceback.format_exc())
#         return JsonTool(code=500, msg=f"创建订单失败: {str(e)}", data=None)

# # 删除购物车
# @router.post("/api/cartview/delete_carts", response_model=JsonTool)
# async def delete_carts(request: DeleteCarts):
#     try:
#         user_id = request.user_id
#         cart_ids = request.cartsId_list  # 建议模型字段名改为 cart_ids

#         if not cart_ids:
#             return JsonTool(code=200, msg="无可删除的购物车项", data=None)

#         # 1. 验证用户是否存在（可选）
#         if not db.query_one("SELECT 1 FROM users WHERE id = %s", (user_id,)):
#             return JsonTool(code=400, msg="用户不存在", data=None)

#         # 2. 构造批量删除 SQL（安全方式）
#         placeholders = ','.join(['%s'] * len(cart_ids))
#         delete_sql = f"DELETE FROM carts WHERE id IN ({placeholders}) AND user_id = %s"
        
#         # 注意：参数顺序要匹配 placeholders + user_id
#         params = (*cart_ids, user_id)
#         deleted_count = db.execute(delete_sql, params)

#         # 3. 返回结果
#         if deleted_count == 0:
#             return JsonTool(code=404, msg="未找到可删除的购物车项（可能已删除或无权限）", data=None)
#         else:
#             return JsonTool(
#                 code=200,
#                 msg=f"成功删除 {deleted_count} 个购物车项",
#                 data={"deleted_count": deleted_count}
#             )

#     except Exception as e:
#         print(f"批量删除购物车异常: {e}")
#         import traceback
#         traceback.print_exc()
#         return JsonTool(code=500, msg=f"删除失败: {str(e)}", data=None)


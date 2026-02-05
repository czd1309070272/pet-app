import json
from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
import uuid
import os
from datetime import datetime
from .schemas import DiscoverySearchRequest, Product, DiscoveryRequest, JsonTool
from sql.mysql_DB import db
from .tools.TokenTools import decode_token_for_auth

# 创建API路由器
router = APIRouter()


# ================================
# 1. 获取商品列表（发现页）
# ================================
@router.post("/api/discoveryview/get_discoveryview_shops", response_model=JsonTool)
async def get_discoveryview_shops(request_data: DiscoveryRequest):
    try:
        # 使用 token 替代 user_id
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

        offset = request_data.limit * (request_data.pages - 1)

        # 构建动态 SQL
        if request_data.category and request_data.category.strip().lower() != "all":
            query = "SELECT * FROM products WHERE category = %s ORDER BY id DESC LIMIT %s OFFSET %s"
            params = (request_data.category.strip(), request_data.limit, offset)
            raw_products = db.query_all(query, params)
        else:
            query = "SELECT * FROM products ORDER BY id DESC LIMIT %s OFFSET %s"
            raw_products = db.query_all(query, (request_data.limit, offset))

        # 转换为 Product 对象
        formatted_products = []
        for product in raw_products:
            product_obj = Product(
                id=product.get('id', 0),
                product_id=product.get('product_id', '') or '',
                name=product.get('name', '') or '',
                price=float(product.get('price', 0.0)) if product.get('price') is not None else 0.0,
                original_price=float(product.get('original_price', product.get('price', 0.0))) 
                    if product.get('original_price') is not None 
                    else float(product.get('price', 0.0)),
                imageUrl=product.get('main_image', '') or '',
                category=product.get('category', '') or '',
                tags=product.get('tags', product.get('tag', '')) or '',
                rating=float(product.get('rating', 0)) if product.get('rating') is not None else 0.0,
                sales=int(product.get('sales', 0)) if product.get('sales') is not None else 0,
                description=product.get('description', '') or ''
            )
            formatted_products.append(product_obj)

        if not formatted_products:
            return JsonTool(code=404, msg="没有找到商品", data={"products": []})

        return JsonTool(code=200, msg="获取成功", data={"products": formatted_products})

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"获取商品失败: {str(e)}", data=None)


# ==================================
# 搜索符合要求的商品 products
# ==================================
@router.post("/api/discoveryview/search_products", response_model=JsonTool)
async def search_products(request_data: DiscoverySearchRequest):
    try:
        # 使用 token 替代 user_id
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

        # 必须提供 keyword
        if not request_data.keyword or not request_data.keyword.strip():
            return JsonTool(code=400, msg="搜索关键词不能为空", data={"products": []})

        keyword = request_data.keyword.strip()
        limit = request_data.limit if request_data.limit else 10
        pages = request_data.pages if request_data.pages >= 1 else 1
        offset = limit * (pages - 1)

        # 在 name 和 category 中模糊搜索
        query = """
            SELECT * FROM products 
            WHERE name LIKE %s OR category LIKE %s
            ORDER BY id DESC 
            LIMIT %s OFFSET %s
        """
        like_pattern = f"%{keyword}%"
        params = (like_pattern, like_pattern, limit, offset)

        raw_products = db.query_all(query, params)

        # 转换为 Product 对象
        formatted_products = []
        for product in raw_products:
            product_obj = Product(
                id=product.get('id', 0),
                product_id=product.get('product_id', '') or '',
                name=product.get('name', '') or '',
                price=float(product.get('price', 0.0)) if product.get('price') is not None else 0.0,
                original_price=float(product.get('original_price', product.get('price', 0.0))) 
                    if product.get('original_price') is not None 
                    else float(product.get('price', 0.0)),
                imageUrl=product.get('main_image', '') or '',
                category=product.get('category', '') or '',
                tags=product.get('tags', product.get('tag', '')) or '',
                rating=float(product.get('rating', 0)) if product.get('rating') is not None else 0.0,
                sales=int(product.get('sales', 0)) if product.get('sales') is not None else 0,
                description=product.get('description', '') or ''
            )
            formatted_products.append(product_obj)

        return JsonTool(
            code=200,
            msg="搜索成功",
            data={"products": formatted_products}
        )

    except Exception as e:
        traceback.print_exc()
        return JsonTool(code=500, msg=f"搜索商品失败: {str(e)}", data=None)



# import json
# from pathlib import Path
# import traceback
# from typing import Any, Dict, List, Optional
# from fastapi import APIRouter, Form
# from pydantic import BaseModel
# import uuid
# import os
# from datetime import datetime
# from .schemas import DiscoverySearchRequest, Product, DiscoveryRequest, JsonTool
# from sql.mysql_DB import db
# from tools.TokenTools import decode_token_for_auth

# # 创建API路由器
# router = APIRouter()

# # ================================
# # 1. 获取商品列表（发现页）
# # ================================
# @router.post("/api/discoveryview/get_discoveryview_shops", response_model=JsonTool)
# async def get_discoveryview_shops(request_data: DiscoveryRequest):
#     print(f"开始获取商品数据，用户ID: {request_data.user_id}, 页码: {request_data.pages}, 限制: {request_data.limit}, 分类: {request_data.category}")
    
#     # 可选：验证用户是否存在（根据业务决定是否必要）
#     user_result = db.query_one("SELECT id FROM users WHERE id = %s", (request_data.user_id,))
#     if not user_result:
#         print(f"用户不存在，用户ID: {request_data.user_id}")
#         return JsonTool(code=400, msg="用户不存在", data=None)

#     offset = request_data.limit * (request_data.pages - 1)
#     print(f"计算偏移量: limit({request_data.limit}) * (pages({request_data.pages}) - 1) = {offset}")
    
#     # 构建动态 SQL
#     if request_data.category and request_data.category.strip().lower() != "all":
#         # 按分类筛选
#         print(f"按分类查询: {request_data.category}")
#         query = "SELECT * FROM products WHERE category = %s ORDER BY id DESC LIMIT %s OFFSET %s"
#         params = (request_data.category.strip(), request_data.limit, offset)
#         raw_products = db.query_all(query, params)
#     else:
#         # 不筛选，返回全部
#         print("查询全部商品")
#         query = " SELECT * FROM products ORDER BY id DESC LIMIT %s OFFSET %s"
#         raw_products = db.query_all(query, (request_data.limit, offset))
    
#     print(f"从数据库获取到 {len(raw_products)} 个原始商品")
    
#     # 将数据库查询结果转换为Product对象
#     formatted_products = []
#     for product in raw_products:
#         # 创建Product对象实例，处理可能为None的字段
#         product_obj = Product(
#             id=product.get('id', 0),
#             product_id=product.get('product_id', '') or '',
#             name=product.get('name', '') or '',  # 确保是字符串
#             price=float(product.get('price', 0.0)) if product.get('price') is not None else 0.0,
#             original_price=float(product.get('original_price', product.get('price', 0.0))) if product.get('original_price') is not None else float(product.get('price', 0.0)),  # 如果没有原价，默认为现价
#             imageUrl=product.get('main_image', '') or '',  # 使用 image_url 字段
#             category=product.get('category', '') or '',  # 确保是字符串
#             tags=product.get('tags', product.get('tag', '')) or '',  # 使用tags字段，如果没有则尝试tag字段
#             rating=float(product.get('rating', 0)) if product.get('rating') is not None else 0.0,  # 评分
#             sales=int(product.get('sales', 0)) if product.get('sales') is not None else 0,  # 销量
#             description=product.get('description', '') or ''  # 描述
#         )
#         formatted_products.append(product_obj)
    
#     print(f"查询到 {len(formatted_products)} 个商品，格式化后的数据: {formatted_products[:2]}...")  # 只打印前两个用于调试
    
#     if not formatted_products:
#         print("没有找到商品")
#         return JsonTool(code=404, msg="没有找到商品",  data={"products": []})
    
#     print(f"成功返回 {len(formatted_products)} 个商品")
#     return JsonTool(code=200, msg="获取成功", 
#                     data={"products": formatted_products})


# # ===========
# # 搜索符合要求的商品 products
# @router.post("/api/discoveryview/search_products", response_model=JsonTool)
# async def search_products(request_data: DiscoverySearchRequest):
#     try:
#         print(f"开始搜索商品，用户ID: {request_data.user_id}, 关键词: '{request_data.keyword}', 页码: {request_data.pages}, 限制: {request_data.limit}")
        
#         # 可选：验证用户是否存在
#         if request_data.user_id:
#             user_result = db.query_one("SELECT id FROM users WHERE id = %s", (request_data.user_id,))
#             if not user_result:
#                 print(f"用户不存在，用户ID: {request_data.user_id}")
#                 return JsonTool(code=400, msg="用户不存在", data=None)

#         # 必须提供 keyword
#         if not request_data.keyword or not request_data.keyword.strip():
#             print("搜索关键词为空")
#             return JsonTool(code=400, msg="搜索关键词不能为空", data={"products": []})

#         keyword = request_data.keyword.strip()
#         limit = request_data.limit if request_data.limit else 10
#         pages = request_data.pages if request_data.pages >= 1 else 1
#         offset = limit * (pages - 1)

#         print(f"搜索关键词: '{keyword}', 分页: page={pages}, limit={limit}, offset={offset}")

#         # 构建 SQL：在 name 和 tags 中模糊搜索（使用 LIKE）
#         # 注意：MySQL 的 LIKE 默认不区分大小写（取决于 collation）
#         query = """
#             SELECT * FROM products 
#             WHERE name LIKE %s OR category LIKE %s
#             ORDER BY id DESC 
#             LIMIT %s OFFSET %s
#         """
#         like_pattern = f"%{keyword}%"
#         params = (like_pattern, like_pattern, limit, offset)

#         raw_products = db.query_all(query, params)
#         print(f"数据库返回 {len(raw_products)} 条匹配结果")

#         # 转换为 Product 对象
#         formatted_products = []
#         for product in raw_products:
#             product_obj = Product(
#                 id=product.get('id', 0),
#                 product_id=product.get('product_id', '') or '',
#                 name=product.get('name', '') or '',
#                 price=float(product.get('price', 0.0)) if product.get('price') is not None else 0.0,
#                 original_price=float(product.get('original_price', product.get('price', 0.0))) 
#                     if product.get('original_price') is not None 
#                     else float(product.get('price', 0.0)),
#                 imageUrl=product.get('main_image', '') or '',
#                 category=product.get('category', '') or '',
#                 tags=product.get('tags', product.get('tag', '')) or '',
#                 rating=float(product.get('rating', 0)) if product.get('rating') is not None else 0.0,
#                 sales=int(product.get('sales', 0)) if product.get('sales') is not None else 0,
#                 description=product.get('description', '') or ''
#             )
#             formatted_products.append(product_obj)

#         print(f"成功格式化 {len(formatted_products)} 个商品用于搜索响应")
#         return JsonTool(
#             code=200,
#             msg="搜索成功",
#             data={"products": formatted_products}
#         )

#     except Exception as e:
#         error_msg = f"搜索商品时发生错误: {str(e)}\n{traceback.format_exc()}"
#         print(error_msg)
#         return JsonTool(code=500, msg="服务器内部错误", data=None)




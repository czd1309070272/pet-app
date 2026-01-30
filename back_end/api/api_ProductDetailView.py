import json
from pathlib import Path
import traceback
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Form
from pydantic import BaseModel
import uuid
import os
from datetime import datetime
from .schemas import Product, DiscoveryBuildCarts, DiscoveryShopMes, JsonTool
from sql.mysql_DB import db

# 创建API路由器
router = APIRouter()

# ================================
# 5. 添加购物车 ✅
# ================================
@router.post("/api/productdetailview/add_discoveryview_cart", response_model=JsonTool)
async def add_discoveryview_cart(request_data: DiscoveryBuildCarts):
    try:
        user_id = request_data.user_id
        product_id = request_data.product_id  # 注意：这里假设是 product_id（业务ID）
        num = request_data.num

        print(f"尝试将商品 {product_id} 添加到用户 {user_id} 的购物车")
        # 1. 验证用户是否存在
        user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
        if not user_result:
            return JsonTool(code=400, msg="用户不存在", data=None)

        # 3. 检查购物车是否已有该商品
        existing_cart = db.query_one(
            "SELECT id, quantity FROM carts WHERE user_id = %s AND product_id = %s",
            (user_id, product_id)
        )

        if existing_cart:
            # 已存在：数量 +1（或可设上限）
            new_quantity = existing_cart['quantity'] + num  # 使用传入的数量num，而不是固定的1
            
            db.execute(
                "UPDATE carts SET quantity = %s WHERE id = %s",
                (new_quantity, existing_cart['id'])
            )
            print(f"更新购物车：商品 {product_id} 数量变为 {new_quantity}")
            
            # 添加成功返回
            return JsonTool(code=200, msg="更新购物车成功", data=None)
        else:
            # 不存在：插入新记录
            insertSql = """
                INSERT INTO carts (product_id, user_id, quantity, created_at)
                VALUES (%s, %s, %s, NOW())
            """
            insertParam = (product_id, user_id, num)  # 修正：移除多余的 True 参数
            insertId = db.insert_and_get_id(insertSql, insertParam)
            print(f"新增购物车项：用户 {user_id} 添加商品 {product_id} 到购物车成功{insertId}")
            if insertId:
                return JsonTool(code=200, msg="添加成功", data=None)
            else:
                return JsonTool(code=500, msg="添加失败", data=None)

    except Exception as e:
        print(f"添加购物车时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"添加购物车失败: {str(e)}", data=None)
    

# ================================
# 4. 获取具体商品信息（保持不变，仅微调）
# ================================
@router.post("/api/productdetailview/get_discoveryview_productmes", response_model=JsonTool)
async def get_discoveryview_productmes(request_data: DiscoveryShopMes):
    try:
        user_id = request_data.user_id
        product_id = request_data.product_id  # 注意：这是业务ID（VARCHAR），不是自增id
        
        print(f"开始获取商品信息，用户ID: {user_id}, 商品ID: {product_id}")
        
        # 验证用户
        user_result = db.query_one("SELECT id FROM users WHERE id = %s", (user_id,))
        if not user_result:
            print(f"用户不存在，用户ID: {user_id}")
            return JsonTool(code=400, msg="用户不存在", data=None)

        # 查询商品
        product_result = db.query_one(
            "SELECT * FROM products WHERE id = %s", 
            (product_id,)
        )
        if not product_result:
            print(f"商品不存在，商品ID: {product_id}")
            return JsonTool(code=400, msg="商品不存在", data=None)
        
        # 将数据库查询结果转换为Product对象
        product_obj = Product(
            id=str(product_result.get('id', 0)),  # id转换为字符串
            product_id=str(product_result.get('product_id', '')),
            name=product_result.get('name', '') or '',  # 确保是字符串
            price=float(product_result.get('price', 0.0)) if product_result.get('price') is not None else 0.0,
            original_price=float(product_result.get('original_price', product_result.get('price', 0.0))) if product_result.get('original_price') is not None else float(product_result.get('price', 0.0)),  # 如果没有原价，默认为现价
            imageUrl=product_result.get('main_image', '') or '',  # 使用 image_url 字段
            category=product_result.get('category', '') or '',  # 确保是字符串
            tags=product_result.get('tags', product_result.get('tag', '')) or '',  # 使用tags字段，如果没有则尝试tag字段
            rating=float(product_result.get('rating', 0)) if product_result.get('rating') is not None else 0.0,  # 评分
            sales=int(product_result.get('sales', 0)) if product_result.get('sales') is not None else 0,  # 销量
            description=product_result.get('description', '') or ''  # 描述
        )
        
        print(f"查询到商品信息: {product_obj}")
            
        return JsonTool(code=200, msg="商品信息查询成功", data={"product": product_obj})
    
    except Exception as e:
        print(f"查询商品时发生异常: {str(e)}")
        print(traceback.format_exc())
        return JsonTool(code=500, msg=f"查询商品失败: {str(e)}", data=None)
    
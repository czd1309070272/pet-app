# api/__init__.py

# # 方式一：显式导入（推荐，清晰可控）
# from .api.api_CommunityView import router as community_router
# from .api.api_LoginView import router as login_router
# 绝对导入方式
import sys
import os
# 添加当前目录到路径中，确保能够找到api模块
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from api.api_CommunityView import router as community_router
from api.api_LoginView import router as login_router
from api.api_DiscoveryView import router as discovery_router
from api.api_CartView import router as cart_router
from api.api_ProductDetailView import router as product_router
from api.api_OrdersView import router as orders_router
from api.api_AddressView import router as address_router
from api.api_MembershipView import router as membership_router
from api.api_MedicationView import router as medication_router
from api.api_ProfileView import router as profile_router
from api.api_CommunityHistoryView import router as community_history_router
from ai_function.api_connection import router as ai_router

# 统一暴露给 main.py
all_routers = [
    community_router,
    login_router,
    discovery_router,
    cart_router,
    product_router,
    orders_router,
    address_router,
    membership_router,
    medication_router,
    profile_router,
    community_history_router,
    ai_router,
]
# from fastapi import APIRouter
# from .api.auto_register import register_api_routers

# def init_routers(app):
#     """
#     初始化并注册所有API路由
#     """
#     register_api_routers(app, "api")
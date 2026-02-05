from datetime import datetime, timedelta
import os
import re
import jwt
from fastapi import APIRouter
from .tools.TokenTools import JWT_SECRET, JWT_EXPIRES_MIN, JWT_ALGORITHM, create_access_token
from .schemas import JsonTool, LoginAccount, RegisterRequest
from sql.mysql_DB import db
import hashlib
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 创建API路由器
router = APIRouter()  # 使用APIRouter而不是FastAPI()

def get_user_field_type(username: str) -> str:
    """判断用户名是邮箱还是手机号"""
    logger.info(f"判断用户名类型: {username}")
    phone_pattern = r"^1[3-9]\d{9}$"
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    
    if re.match(phone_pattern, username):
        logger.info("用户名类型: 手机号")
        return "phone"
    elif re.match(email_pattern, username):
        logger.info("用户名类型: 邮箱")
        return "email"
    else:
        logger.info("用户名类型: 普通用户名")
        return "username"

def verify_username_format(username: str) -> bool:
    """验证 username 是手机号或邮箱"""
    logger.info(f"验证用户名格式: {username}")
    # 手机号正则（中国大陆）
    phone_pattern = r"^1[3-9]\d{9}$"
    # 邮箱正则
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    is_valid = bool(re.match(phone_pattern, username)) or bool(re.match(email_pattern, username))
    logger.info(f"用户名格式验证结果: {is_valid}")
    return is_valid


# 定义一个验证码的api
@router.post("/api/loginview/send_verification_code", response_model=JsonTool)
async def send_verification_code(request_data: LoginAccount):
    return JsonTool(
        code=200,
        msg="验证码发送成功（模拟）",
        data={"username": request_data.username}
    )

# 登录
@router.post("/api/loginview/login", response_model=JsonTool)
async def login(request: LoginAccount):
    logger.info("开始执行登录函数")
    try:
        username = request.username
        password_hash = request.password_hash
        
        logger.info(f"接收到的登录信息 - 用户名: {username}, 密码哈希: {password_hash}")

        if not username or not password_hash:
            logger.warning("用户名或密码为空")
            return JsonTool(code=400, msg="用户名和密码不能为空", data=None)

        sql = "SELECT * FROM users WHERE phone = %s OR email = %s"
        user = db.query_one(sql, (username, username))
        
        if not user:
            logger.warning("用户不存在")
            return JsonTool(code=401, msg="用户不存在", data=None)

        if user['password_hash'] != password_hash:
            logger.warning("密码错误")
            return JsonTool(code=401, msg="密码错误", data=None)
        
        logger.info("密码验证通过")

        # ✅【关键】先完成认证核心逻辑
        user_id = user['id']
        current_token_version = user.get('token_version', 0)
        new_token_version = current_token_version + 1
        db.execute("UPDATE users SET token_version = %s WHERE id = %s", (new_token_version, user_id))
        token = create_access_token(
            {"sub": username, "user_id": user_id},
            token_version=new_token_version
        )
        logger.info("Token 已生成，处理附加业务逻辑")

        # === VIP 过期检查（附加逻辑，不影响登录）===
        vip_expiry = user.get('vip_expiry')
        vip_level = user.get('vip_level')
        should_update_vip = False
        now = datetime.now()

        if vip_expiry and vip_level and vip_level != "NONE":
            if isinstance(vip_expiry, str):
                try:
                    expiry_dt = datetime.strptime(vip_expiry, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    logger.warning(f"用户 {user_id} 的 vip_expiry 格式无效，视为过期")  # ← 不打印具体值
                    should_update_vip = True
                else:
                    if expiry_dt <= now:
                        should_update_vip = True
            elif isinstance(vip_expiry, datetime):
                if vip_expiry <= now:
                    should_update_vip = True
            else:
                should_update_vip = True

        if should_update_vip:
            logger.info(f"用户 {user_id} VIP 已过期，正在降级为 NONE")
            db.execute(
                "UPDATE users SET vip_level = 'NONE', vip_expiry = NULL WHERE id = %s",
                (user_id,)
            )
            user['vip_level'] = 'NONE'
            user['vip_expiry'] = None
        # === VIP 检查结束 ===

        return JsonTool(
            code=200,
            msg="登录成功",
            data={
                "user_id": user['id'],
                "username": user['username'],
                "nickname": user.get('nickname'),
                "email": user.get('email'),
                "phone": user.get('phone'),
                "avatar_url": user.get('avatar_url'),
                "gender": user.get("gender"),
                "vip_level": user.get("vip_level"),
                "vip_expiry": user.get("vip_expiry"),
                "level": user.get("level"),
                "google_id": user.get("google_id"),
                "apple_id": user.get("apple_id"),
                "token": token,
                "expires_in": JWT_EXPIRES_MIN * 60
            }
        )
    except Exception as e:
        logger.error(f"登录过程中发生异常: {str(e)}", exc_info=True)
        return JsonTool(code=500, msg="登录失败，请稍后再试", data=None)    

# 定义一个重置密码的api
@router.post("/api/loginview/reset_password", response_model=JsonTool)
async def reset_password(request_data: LoginAccount):
    logger.info("开始执行重置密码函数")
    try:
        username = request_data.username
        new_password_hash = request_data.password_hash
        
        logger.info(f"接收到的重置密码信息 - 用户名: {username}")

        # 验证输入参数
        if not username or not new_password_hash:
            logger.warning("用户名或新密码为空")
            return JsonTool(
                code=400,
                msg="用户名和新密码不能为空",
                data=None
            )

        logger.info("用户名和新密码不为空，继续处理")
        
        # 根据用户名类型查询用户信息
        logger.info(f"查询数据库，用户名: {username}")
        sql = "SELECT * FROM users WHERE phone = %s or email = %s"
        user = db.query_one(sql, (username,username))
        
        logger.info(f"数据库查询结果: {user}")

        if not user:
            logger.warning("用户不存在")
            return JsonTool(
                code=401,
                msg="用户不存在",
                data=None
            )

        logger.info("用户存在，更新密码")
        
        # 更新密码
        update_sql = "UPDATE users SET password_hash = %s WHERE id = %s"
        result = db.execute(update_sql, (new_password_hash, user['id']))
        
        if result > 0:
            logger.info("密码更新成功")
            return JsonTool(
                code=200,
                msg="密码重置成功",
                data=None
            )
        else:
            logger.warning("密码更新失败")
            return JsonTool(
                code=500,
                msg="密码重置失败",
                data=None
            )
    except Exception as e:
        logger.error(f"重置密码过程中发生异常: {str(e)}")
        return JsonTool(
            code=500,
            msg=f"重置密码失败: {str(e)}",
            data=None
        )

# 定义一个注册用的api
@router.post("/api/loginview/register", response_model=JsonTool)
async def register(request_data: RegisterRequest):
    logger.info("开始执行注册函数")
    try:
        username = request_data.username
        nickname = request_data.nickname
        password_hash = request_data.password_hash
        
        logger.info(f"接收到的注册信息 - 用户名: {username}, 昵称: {nickname}")
        
        # 1. 验证输入参数
        if not username or not nickname or not password_hash:
            logger.warning("用户名、昵称或密码为空")
            return JsonTool(code=400, msg="用户名、昵称、密码不能为空", data=None)
        
        # 2. 校验格式
        if not verify_username_format(username):
            logger.warning("用户名格式错误")
            return JsonTool(code=400, msg="用户名格式错误", data=None)

        # 3. 检查是否已存在
        sql_check = "SELECT id FROM users WHERE email = %s OR phone = %s"
        existing_user = db.query_one(sql_check, (username, username))
        if existing_user:
            logger.warning("用户已存在")
            return JsonTool(code=409, msg="该邮箱或手机号已存在", data=None)
        
        logger.info("用户名未存在，准备插入新用户")

        # 4. 确定字段类型并构建插入语句（不包含 token！）
        field_type = get_user_field_type(username)
        if field_type == "email":
            insert_sql = """
                INSERT INTO users (username, email, nickname, password_hash, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """
        elif field_type == "phone":
            insert_sql = """
                INSERT INTO users (username, phone, nickname, password_hash, created_at)
                VALUES (%s, %s, %s, %s, NOW())
            """
        else:
            logger.error("不支持的用户名类型")
            return JsonTool(code=400, msg="仅支持手机号或邮箱注册", data=None)

        # 5. 执行插入
        result = db.execute(insert_sql, (username, username, nickname, password_hash))
        if result <= 0:
            logger.error("数据库插入失败")
            return JsonTool(code=500, msg="注册失败，请稍后再试", data=None)

        # 6. 查询新用户（必须做，获取 id 和完整信息）
        query_sql = "SELECT * FROM users WHERE username = %s"
        new_user = db.query_one(query_sql, (username,))
        if not new_user:
            logger.error("注册成功但无法查询新用户")
            return JsonTool(code=500, msg="注册异常", data=None)

        user_id = new_user['id']
        logger.info(f"新用户注册成功，ID: {user_id}")

        # ✅【关键】注册时 token_version = 0（数据库默认值）
        token = create_access_token(
            {"sub": username, "user_id": user_id},
            token_version=0  # ← 必须传！与登录逻辑一致
        )

        # 7. 返回响应（使用 new_user，不包含 token 字段）
        return JsonTool(
            code=200,
            msg="注册成功",
            data={
                "user_id": new_user['id'],
                "username": new_user['username'],
                "nickname": new_user.get('nickname'),
                "email": new_user.get('email'),
                "phone": new_user.get('phone'),
                "avatar_url": new_user.get('avatar_url'),
                "gender": new_user.get("gender"),
                "vip_level": new_user.get("vip_level") or "NONE",
                "vip_expiry": new_user.get("vip_expiry"),
                "level": new_user.get("level") or 1,
                "google_id": new_user.get("google_id"),
                "apple_id": new_user.get("apple_id"),
                "token": token,                          # ← 返回给前端
                "expires_in": JWT_EXPIRES_MIN * 60       # ← 单位：秒
            }
        )

    except Exception as e:
        logger.error(f"注册过程中发生异常: {str(e)}", exc_info=True)
        return JsonTool(code=500, msg="注册失败，请稍后再试", data=None)    

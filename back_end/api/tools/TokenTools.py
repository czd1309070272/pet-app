import jwt
import os
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sql.mysql_DB import db

security = HTTPBearer()

JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
JWT_EXPIRES_MIN = int(os.getenv("JWT_EXPIRES_MIN", "10080"))  # 默认7天
JWT_ALGORITHM = "HS256"
# 生成 token
def create_access_token(payload: dict, token_version: int) -> str:
    expires_at = datetime.utcnow() + timedelta(minutes=JWT_EXPIRES_MIN)
    data = dict(payload)
    data.update({
        "exp": expires_at,
        "token_version": token_version  # ← 关键：绑定版本号
    })
    return jwt.encode(data, JWT_SECRET, algorithm=JWT_ALGORITHM)


# 验证 token
def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        exp = payload.get("exp")
        if user_id is None:
            raise HTTPException(status_code=401, detail="无效 token")
        if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="token 已过期")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="token 验证失败")

# 获取当前用户
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    return {"user_id": payload["user_id"]}

# 这个函数专门用于鉴权，解码 token 并提取 user_id 和 token_version
def decode_token_for_auth(token: str) -> dict:
    """
    解码 token 并返回关键身份信息，用于鉴权。
    
    返回:
        {
            "user_id": int,
            "token_version": int
        }
    
    抛出:
        HTTPException(401) - 如果 token 无效、过期、缺少字段
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # 提取必要字段
        user_id = payload.get("user_id")
        token_version = payload.get("token_version")
        
        # 验证字段存在且类型正确
        if user_id is None or not isinstance(user_id, int):
            raise HTTPException(status_code=401, detail="Token 缺少有效 user_id")
            
        if token_version is None or not isinstance(token_version, int):
            raise HTTPException(status_code=401, detail="Token 缺少有效 token_version")
        
        # PyJWT 会自动校验 exp，但显式处理更清晰（可选）
        # exp = payload.get("exp")
        # if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
        #     raise HTTPException(status_code=401, detail="Token 已过期")
        
        return {
            "user_id": user_id,
            "token_version": token_version
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token 已过期")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token 无效或签名错误")
    
# 获取当前用户（严格模式）
def get_current_user_strict(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    严格模式鉴权（同步版）
    """
    token = credentials.credentials
    decoded = decode_token_for_auth(token)
    
    user_id = decoded["user_id"]
    claimed_version = decoded["token_version"]
    
    # 这是同步调用！
    user = db.query_one("SELECT token_version FROM users WHERE id = %s", (user_id,))
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在或已被删除")
    
    current_version = user["token_version"]
    if claimed_version != current_version:
        raise HTTPException(status_code=401, detail="登录状态已失效，请重新登录")
    
    return {"user_id": user_id}
# db.py
import mysql.connector
from mysql.connector import pooling
from typing import Optional, Dict, Any, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
             
        self.host = '127.0.0.1'
        self.user = 'root'
        self.password = 'czd888'
        self.database = 'pawpal'
        self.pool = None
        # self.host = '127.0.0.1'
        # self.user = 'root'
        # self.password = '123456'
        # self.database = 'pawpal'
        # self.pool = None
        
        try:
            # 创建连接池（推荐！支持高并发）
            self.pool = pooling.MySQLConnectionPool(
                pool_name="aether_pool",
                pool_size=32,
                host=self.host,
                user=self.user,
                password=self.password,
                database=self.database,
                autocommit=True,
                charset='utf8mb4',
                pool_reset_session=True
            )
            logger.info("数据库连接池创建成功！")
        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            self.pool = None
        
        self._initialized = True

    def get_connection(self):
        """获取一个连接（自动处理重连）"""
        if not self.pool:
            logger.error("连接池未初始化！")
            return None
        
        try:
            return self.pool.get_connection()
        except mysql.connector.Error as e:
            logger.warning(f"连接失效，尝试重连: {e}")
            # 简单重连逻辑
            try:
                return self.pool.get_connection()
            except:
                return None

    def query_one(self, sql: str, params: tuple = None) -> Optional[Dict[str, Any]]:
        """查询单条（返回 dict 或 None）"""
        conn = self.get_connection()
        if not conn:
            return None
        
        try:
            cursor = conn.cursor(dictionary=True)  # 关键！返回 dict
            cursor.execute(sql, params or ())
            result = cursor.fetchone()
            return result
        except Exception as e:
            logger.error(f"查询失败: {e}, SQL: {sql}, Params: {params}")
            return None
        finally:
            if 'cursor' in locals():
                cursor.close()
            if conn:
                conn.close()

    def query_all(self, sql: str, params: tuple = None) -> List[Dict[str, Any]]:
        """查询多条"""
        conn = self.get_connection()
        if not conn:
            return []
        
        try:
            cursor = conn.cursor(dictionary=True)
            cursor.execute(sql, params or ())
            result = cursor.fetchall()
            return result
        except Exception as e:
            logger.error(f"查询失败: {e}")
            return []
        finally:
            if 'cursor' in locals():
                cursor.close()
            if conn:
                conn.close()

    def execute(self, sql: str, params: tuple = None) -> bool:
        """执行 INSERT/UPDATE/DELETE"""
        conn = self.get_connection()
        if not conn:
            return 0
        try:
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            conn.commit()
            count = cursor.rowcount
            return count if count >= 0 else 0
        except Exception as e:
            logger.error(f"执行 SQL 失败: {e}")
            try:conn.rollback()
            except:pass
            return 0 # 失败返回 0
        finally:
            if 'cursor' in locals():
                cursor.close()
            if conn:
                conn.close()

    def insert_and_get_id(self, sql: str, params: tuple = None) -> int:
        """
        执行 INSERT 语句并返回新插入记录的自增 ID。
        仅用于 INSERT 操作！
        成功返回 ID（int >= 1），失败返回 0。
        """
        conn = self.get_connection()
        if not conn:
            return 0
        
        try:
            cursor = conn.cursor()
            cursor.execute(sql, params or ())
            new_id = cursor.lastrowid
            # 由于 autocommit=True，无需手动 commit
            return new_id if new_id is not None else 0
        except Exception as e:
            logger.error(f"INSERT 失败: {e}, SQL: {sql}, Params: {params}")
            try:
                conn.rollback()
            except:
                pass
            return 0
        finally:
            if 'cursor' in locals():
                cursor.close()
            if conn:
                conn.close()

    def close_pool(self):
        """关闭连接池（Lifespan shutdown 调用）"""
        if self.pool:
            try:
                self.pool._remove_connections()  # 清理所有连接
                logger.info("数据库连接池已关闭")
            except:
                pass

db = DatabaseManager()
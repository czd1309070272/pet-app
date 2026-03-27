# 定义统一返回的数据格式的请求体模型
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class JsonTool(BaseModel):      # 统一返回的数据格式模型
    code:int                    # 状态码 200表示成功，400表示请求错误，500表示服务器错误等，201表示可以访问数据库但是数据有异常
    data:Optional[dict] = None  # 返回的数据，默认为None
    msg:str                     # 返回的信息

class CommunityHistoryRequest(BaseModel):
    # user_id: int                # 用户ID
    token: str                 # 账号token  
    limit: int                  # 每次获取多少数据
    offset: Optional[int] = 0   # 分页偏移量，默认为0

class CommunityHistoryItem (BaseModel):
  id: str
  postId: int
  author: str
  authorAvatar: str
  contentSnippet: str
  time: str
  type: str
  commentText: str
  image: str

class CommunityDetail(BaseModel):
    # user_id: int
    token: str
    post_id: int
    top_limit: int      # 获取的顶级评论数量
    replies_limit: int  # 获取的子评论数量


class CommunityCommentRequest(BaseModel):
    # user_id: int                    # 当前用户 ID（用于权限/个性化）
    token: str                      # 账号token
    post_id: int                    # 主内容 ID（视频、帖子等）
    timenode: Optional[str] = None                        # 页码，从 1 开始（前端点击“加载更多”时 +1）
    page_size: int                  # 每页数量，建议默认 20
    top_comment_id: Optional[int] = None     # 父评论 ID：
    # - 如果为 None → 请求该 post_id 下的【顶级评论】（分页）
    # - 如果为具体 ID（如 1001）→ 请求该顶级评论下的【子评论】（分页）

class CommunityCommentItem(BaseModel):
    id: int
    user_id: int
    parent_id: Optional[int]
    reply_to_uid: Optional[int]  # 用于前端显示 "@某某"
    content: str
    likes_count: int
    created_at: datetime

class CommunityRequestComment(BaseModel):       # 前端请求帖子的模型
    # user_id: int                                # 用户ID
    token: str                                  # 账号token
    num: int                                    # 获取评论的数量
    offset: Optional[int] = 0                   # 分页偏移量，默认为0
    exclude_post_ids: Optional[List[int]] = []  # 要排除的帖子ID列表，默认为空

class CommunityRequestComment2(BaseModel):      # 前端请求帖子的模型
    # user_id: int                                # 用户ID
    token: str                                  # 账号token
    limit: int                                  # 获取评论的数量
    timenode: Optional[datetime] = None         # 基于时间节点进行分页查询            
    exclude_post_ids: Optional[List[int]] = []  # 要排除的帖子ID列表，默认为空
    datatype:str                                # 需要获取的数据类型，分为获取比timenode时间点更新的数据或者获取比timenode时间点更早的数据

class CommunityRequest(BaseModel):  # 发布新帖子的请求体模型
    # user_id: int                    # 用户ID
    token: str                      # 账号token
    content: str                    # 内容
    images: Optional[List[str]] = [] # 图片URL列表，默认为空数组
    tags: Optional[List[str]] = []   # 标签列表，默认为空数组

class LoginAccount(BaseModel):  # 登录请求体模型
    username: str               # 用户名，可以是邮箱或手机号
    password_hash: str          # 密码哈希

class RegisterRequest(BaseModel):   # 注册请求模型
    username: str                   # 手机号 或 邮箱
    password_hash: str
    nickname: str

class likePost(BaseModel):
    # user_id: int    # 用户ID
    token: str
    target_id: int  # 目标ID（帖子ID或评论ID）
    target_type: str    # 目标类型，"post"表示帖子，"comment"表示评论

class commentPost(BaseModel):
    id: Optional[int] = None            # 评论ID，新增评论时可不传
    post_id: int                        # 帖子ID
    token: str                          # 账号token
    # user_id: int                        # 用户ID
    parent_id: Optional[int] = None     # 父评论ID，若为顶级评论则为None
    reply_to_id: Optional[int] = None   # 回复的评论ID，若不回复则为None
    content: str                        # 评论内容
    root_id: Optional[str] = None       # 顶级评论ID

class Comment(BaseModel):
    id: int
    author: str
    avatar: str
    content: str
    time: str
    likes: int
    isLiked: bool
    isVIP: bool
    vipLevel: str
    replyToName: str
    replies: List['Comment'] = []  # 子评论列表，默认为空
    replyToContent: str
    top_comment_id: Optional[int] = None     #顶级评论ID

class newPost(BaseModel):   # 新帖子模型
    id: int
    author: str
    avatar: str
    time: str
    content: str
    fullContent: str
    images: List[str]
    likes: int
    comments: int
    isLiked: bool
    userTags: List[str]
    commentList: List[Comment]
    isV: bool
    isVIP: bool                                                   
    vipLevel: str

class DiscoveryRequest(BaseModel): # 商品、订单数据请求结构
    pages: int       # 页码
    limit: int      # 每页数量
    # user_id: int    # 用户ID
    token: str      # 账号token
    category:str    # 分类

class DiscoverySearchRequest(BaseModel):
    keyword: str
    pages: int
    limit: int
    # user_id: int
    token: str

class DiscoveryShopMes(BaseModel):    # 商品具体信息请求数据结构
    # user_id: int    # 用户ID
    token: str      # 账号token
    product_id: int # 商品ID

class DeleteCarts(BaseModel):    # 删除购物车请求数据结构
    # user_id: int
    token: str
    cartsId_list: List[int]

class DiscoveryBuildCarts(BaseModel):    # 购物车数据结构
    # user_id: int
    token: str
    product_id: str
    num:int

class CartItem(BaseModel):   # 前端根据购物车数据结构
    id: str
    productId: str
    name: str
    price: float
    quantity: int
    imageUrl: str
    selected: bool

class DiscoveryBuildOrder(BaseModel):    #  订单数据结构
    # user_id: int                    # 用户ID
    token: str                      # 账号token
    cart_items: List[CartItem]      # 前端构建的购物车数据结构
    address_id:  str                # 收货地址ID

class Product(BaseModel):
    id: int
    product_id: str
    name: str
    price: float
    original_price: float
    imageUrl:  str
    category: str
    tags: str
    rating: float
    sales:  int
    description: str



class OrderItem (BaseModel):
  name: str
  price: float
  quantity: int
  imageUrl: str

class Order(BaseModel):
    id: str
    status: str
    items:  List[OrderItem]
    totalPrice: float
    date: str
    trackingNumber: str
    addressId: int

# ✅ 新增：包含 user_id 和 order 的请求体
class UpdateOrderRequest(BaseModel):
    # user_id: str  # 或 int，根据你的系统设计
    token: str          # 账号token
    order: Order

class CartItem(BaseModel):
    id: int
    productId: str 
    name: str 
    price: float 
    quantity: int 
    imageUrl: str 
    selected:bool

class Address (BaseModel):
  id: str
  receiverName: str
  phone: str
  area: str
  detail: str
  isDefault: bool
  label: str
#   user_id: int
  token: str

class Medication (BaseModel):
  id: str
  name: str
  date: str
  time: str
  dosage: str
  isTaken: bool
  petName: str
#   user_id: int
  token: str

class PetProfile (BaseModel):
  id:str
  name: str
  breed: str
  avatar: str
  isMemorial: bool
  gender: str
  birthday: str
  hobbies:str
  memorialDate:str

class VipProfile(BaseModel):
    # user_id: int    # 用户ID
    vip_combo: str  # vip套餐
    pay_status: bool # 是否支付
    token: str      # 账号token

class PetProfile (BaseModel):
  id: str
  name: str
  breed: str
  avatar: str
  isMemorial: bool
  gender: str
  birthday:str
  hobbies: str
  memorialDate:str
#   user_id: int
  token: str

class WeightEntry (BaseModel):
  id: str
  date: str
  weight: float
#   user_id: int
  token: str

# class Product(BaseModel):
#     id: int
#     productId: int
#     name:  str
#     price:  float
#     originalPrice: float 
#     imageUrl: str 
#     category: str
#     tag: str 
#     rating: float 
#     sales: int 
#     description: str 
#     detailImages: List[str] 

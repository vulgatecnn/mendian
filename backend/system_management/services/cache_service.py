"""
缓存服务
提供统一的缓存管理功能，包括部门树、用户权限、企微访问令牌等
"""
import json
import logging
from typing import Optional, Dict, List, Any
from django.core.cache import cache
from django.conf import settings
from ..models import Department, User, Permission

logger = logging.getLogger(__name__)


class CacheService:
    """缓存服务"""
    
    # 缓存键前缀
    CACHE_PREFIX = 'system_mgmt'
    
    # 缓存过期时间（秒）
    DEPARTMENT_TREE_TIMEOUT = 3600  # 1小时
    USER_PERMISSIONS_TIMEOUT = 1800  # 30分钟
    WECHAT_TOKEN_TIMEOUT = 7200  # 2小时（企微令牌默认2小时过期）
    PERMISSION_LIST_TIMEOUT = 3600  # 1小时
    
    def __init__(self):
        """初始化缓存服务"""
        self.cache = cache
    
    def _make_key(self, key_type: str, *args) -> str:
        """
        生成缓存键
        
        Args:
            key_type: 缓存类型
            *args: 额外参数
            
        Returns:
            完整的缓存键
        """
        parts = [self.CACHE_PREFIX, key_type]
        parts.extend(str(arg) for arg in args)
        return ':'.join(parts)
    
    # ==================== 部门树缓存 ====================
    
    def get_department_tree(self) -> Optional[List[Dict]]:
        """
        获取缓存的部门树
        
        Returns:
            部门树列表，如果缓存未命中则返回 None
        """
        cache_key = self._make_key('dept_tree')
        try:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug("部门树缓存命中")
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"获取部门树缓存失败: {e}")
        
        return None
    
    def set_department_tree(self, tree_data: List[Dict]) -> bool:
        """
        设置部门树缓存
        
        Args:
            tree_data: 部门树数据
            
        Returns:
            是否设置成功
        """
        cache_key = self._make_key('dept_tree')
        try:
            cached_data = json.dumps(tree_data, ensure_ascii=False)
            self.cache.set(cache_key, cached_data, self.DEPARTMENT_TREE_TIMEOUT)
            logger.debug(f"部门树缓存已设置，过期时间: {self.DEPARTMENT_TREE_TIMEOUT}秒")
            return True
        except Exception as e:
            logger.error(f"设置部门树缓存失败: {e}")
            return False
    
    def clear_department_tree(self) -> bool:
        """
        清除部门树缓存
        
        Returns:
            是否清除成功
        """
        cache_key = self._make_key('dept_tree')
        try:
            self.cache.delete(cache_key)
            logger.debug("部门树缓存已清除")
            return True
        except Exception as e:
            logger.error(f"清除部门树缓存失败: {e}")
            return False
    
    # ==================== 用户权限缓存 ====================
    
    def get_user_permissions(self, user_id: int) -> Optional[set]:
        """
        获取用户权限缓存
        
        Args:
            user_id: 用户ID
            
        Returns:
            权限编码集合，如果缓存未命中则返回 None
        """
        cache_key = self._make_key('user_perms', user_id)
        try:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug(f"用户 {user_id} 权限缓存命中")
                return set(json.loads(cached_data))
        except Exception as e:
            logger.error(f"获取用户权限缓存失败: {e}")
        
        return None
    
    def set_user_permissions(self, user_id: int, permissions: set) -> bool:
        """
        设置用户权限缓存
        
        Args:
            user_id: 用户ID
            permissions: 权限编码集合
            
        Returns:
            是否设置成功
        """
        cache_key = self._make_key('user_perms', user_id)
        try:
            cached_data = json.dumps(list(permissions))
            self.cache.set(cache_key, cached_data, self.USER_PERMISSIONS_TIMEOUT)
            logger.debug(f"用户 {user_id} 权限缓存已设置，过期时间: {self.USER_PERMISSIONS_TIMEOUT}秒")
            return True
        except Exception as e:
            logger.error(f"设置用户权限缓存失败: {e}")
            return False
    
    def clear_user_permissions(self, user_id: int) -> bool:
        """
        清除用户权限缓存
        
        Args:
            user_id: 用户ID
            
        Returns:
            是否清除成功
        """
        cache_key = self._make_key('user_perms', user_id)
        try:
            self.cache.delete(cache_key)
            logger.debug(f"用户 {user_id} 权限缓存已清除")
            return True
        except Exception as e:
            logger.error(f"清除用户权限缓存失败: {e}")
            return False
    
    def clear_all_user_permissions(self) -> bool:
        """
        清除所有用户权限缓存
        
        Returns:
            是否清除成功
        """
        try:
            # 由于 Django 的内存缓存不支持 keys() 方法，
            # 我们通过清除所有系统管理模块的缓存来实现
            # 在生产环境中建议使用 Redis 缓存
            if hasattr(self.cache, 'keys'):
                # 支持 keys 方法的缓存后端（如 Redis）
                pattern = self._make_key('user_perms', '*')
                keys = self.cache.keys(pattern)
                
                if keys:
                    self.cache.delete_many(keys)
                    logger.debug(f"已清除 {len(keys)} 个用户权限缓存")
            else:
                # 不支持 keys 方法的缓存后端（如内存缓存）
                # 只能记录日志，无法精确清除
                logger.warning("当前缓存后端不支持批量清除用户权限缓存")
            
            return True
        except Exception as e:
            logger.error(f"清除所有用户权限缓存失败: {e}")
            return False
    
    # ==================== 企微访问令牌缓存 ====================
    
    def get_wechat_token(self) -> Optional[Dict]:
        """
        获取企微访问令牌缓存
        
        Returns:
            令牌信息字典，包含 token 和 expires_at，如果缓存未命中则返回 None
        """
        cache_key = self._make_key('wechat_token')
        try:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug("企微访问令牌缓存命中")
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"获取企微访问令牌缓存失败: {e}")
        
        return None
    
    def set_wechat_token(self, token: str, expires_in: int) -> bool:
        """
        设置企微访问令牌缓存
        
        Args:
            token: 访问令牌
            expires_in: 过期时间（秒）
            
        Returns:
            是否设置成功
        """
        cache_key = self._make_key('wechat_token')
        try:
            import time
            expires_at = int(time.time()) + expires_in
            
            token_data = {
                'token': token,
                'expires_at': expires_at,
                'expires_in': expires_in,
            }
            
            cached_data = json.dumps(token_data)
            # 缓存时间比实际过期时间少5分钟，确保提前刷新
            cache_timeout = max(expires_in - 300, 60)
            
            self.cache.set(cache_key, cached_data, cache_timeout)
            logger.debug(f"企微访问令牌缓存已设置，过期时间: {cache_timeout}秒")
            return True
        except Exception as e:
            logger.error(f"设置企微访问令牌缓存失败: {e}")
            return False
    
    def clear_wechat_token(self) -> bool:
        """
        清除企微访问令牌缓存
        
        Returns:
            是否清除成功
        """
        cache_key = self._make_key('wechat_token')
        try:
            self.cache.delete(cache_key)
            logger.debug("企微访问令牌缓存已清除")
            return True
        except Exception as e:
            logger.error(f"清除企微访问令牌缓存失败: {e}")
            return False
    
    # ==================== 权限列表缓存 ====================
    
    def get_permission_list(self) -> Optional[List[Dict]]:
        """
        获取权限列表缓存
        
        Returns:
            权限列表，如果缓存未命中则返回 None
        """
        cache_key = self._make_key('perm_list')
        try:
            cached_data = self.cache.get(cache_key)
            if cached_data:
                logger.debug("权限列表缓存命中")
                return json.loads(cached_data)
        except Exception as e:
            logger.error(f"获取权限列表缓存失败: {e}")
        
        return None
    
    def set_permission_list(self, permissions: List[Dict]) -> bool:
        """
        设置权限列表缓存
        
        Args:
            permissions: 权限列表
            
        Returns:
            是否设置成功
        """
        cache_key = self._make_key('perm_list')
        try:
            cached_data = json.dumps(permissions, ensure_ascii=False)
            self.cache.set(cache_key, cached_data, self.PERMISSION_LIST_TIMEOUT)
            logger.debug(f"权限列表缓存已设置，过期时间: {self.PERMISSION_LIST_TIMEOUT}秒")
            return True
        except Exception as e:
            logger.error(f"设置权限列表缓存失败: {e}")
            return False
    
    def clear_permission_list(self) -> bool:
        """
        清除权限列表缓存
        
        Returns:
            是否清除成功
        """
        cache_key = self._make_key('perm_list')
        try:
            self.cache.delete(cache_key)
            logger.debug("权限列表缓存已清除")
            return True
        except Exception as e:
            logger.error(f"清除权限列表缓存失败: {e}")
            return False
    
    # ==================== 批量操作 ====================
    
    def clear_all_cache(self) -> bool:
        """
        清除所有缓存
        
        Returns:
            是否清除成功
        """
        try:
            if hasattr(self.cache, 'keys'):
                # 支持 keys 方法的缓存后端（如 Redis）
                pattern = f"{self.CACHE_PREFIX}:*"
                keys = self.cache.keys(pattern)
                
                if keys:
                    self.cache.delete_many(keys)
                    logger.info(f"已清除 {len(keys)} 个系统管理模块缓存")
            else:
                # 不支持 keys 方法的缓存后端（如内存缓存）
                # 逐个清除已知的缓存键
                cache_keys = [
                    self._make_key('dept_tree'),
                    self._make_key('wechat_token'),
                    self._make_key('perm_list'),
                ]
                
                cleared_count = 0
                for key in cache_keys:
                    try:
                        self.cache.delete(key)
                        cleared_count += 1
                    except Exception:
                        pass
                
                logger.info(f"已清除 {cleared_count} 个系统管理模块缓存")
            
            return True
        except Exception as e:
            logger.error(f"清除所有缓存失败: {e}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        获取缓存统计信息
        
        Returns:
            缓存统计信息字典
        """
        stats = {
            'department_tree': False,
            'wechat_token': False,
            'permission_list': False,
            'user_permissions_count': 0,
        }
        
        try:
            # 检查部门树缓存
            dept_key = self._make_key('dept_tree')
            stats['department_tree'] = self.cache.get(dept_key) is not None
            
            # 检查企微令牌缓存
            token_key = self._make_key('wechat_token')
            stats['wechat_token'] = self.cache.get(token_key) is not None
            
            # 检查权限列表缓存
            perm_key = self._make_key('perm_list')
            stats['permission_list'] = self.cache.get(perm_key) is not None
            
            # 统计用户权限缓存数量
            if hasattr(self.cache, 'keys'):
                # 支持 keys 方法的缓存后端
                user_perm_pattern = self._make_key('user_perms', '*')
                user_perm_keys = self.cache.keys(user_perm_pattern)
                stats['user_permissions_count'] = len(user_perm_keys) if user_perm_keys else 0
            else:
                # 不支持 keys 方法的缓存后端，无法精确统计
                stats['user_permissions_count'] = -1  # -1 表示无法统计
            
        except Exception as e:
            logger.error(f"获取缓存统计信息失败: {e}")
        
        return stats


# 全局缓存服务实例
cache_service = CacheService()
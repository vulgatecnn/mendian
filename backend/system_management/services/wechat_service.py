"""
企业微信集成服务
统一的企业微信集成服务，提供部门和用户同步功能
"""
import time
import logging
from typing import Dict, Optional
from django.utils import timezone
from .wechat_config import wechat_config
from .wechat_token import token_manager
from .wechat_department import department_service
from .wechat_user import user_service
from .wechat_exceptions import (
    WeChatException,
    WeChatConfigError,
    WeChatTimeoutError,
    WeChatSyncError,
)

logger = logging.getLogger(__name__)


class WeChatService:
    """企业微信集成服务"""
    
    # 超时阈值（秒）
    TIMEOUT_THRESHOLD = 30
    
    def __init__(self):
        """初始化企业微信服务"""
        self.config = wechat_config
        self.token_manager = token_manager
        self.department_service = department_service
        self.user_service = user_service
    
    def sync_departments(self, department_id: Optional[int] = None) -> Dict:
        """
        同步部门信息（带错误处理和超时监控）
        
        Args:
            department_id: 部门 ID，如果为 None 则同步所有部门
            
        Returns:
            同步结果字典
        """
        start_time = time.time()
        
        try:
            # 验证配置
            is_valid, error_msg = self.config.validate_config()
            if not is_valid:
                logger.error(f"企业微信配置无效: {error_msg}")
                raise WeChatConfigError(error_msg)
            
            logger.info("=" * 60)
            logger.info("开始同步企业微信部门信息")
            logger.info(f"同步时间: {timezone.now()}")
            logger.info(f"部门 ID: {department_id or '全部'}")
            logger.info("=" * 60)
            
            # 执行同步
            result = self.department_service.sync_departments(department_id)
            
            # 计算耗时
            elapsed_time = time.time() - start_time
            result['elapsed_time'] = round(elapsed_time, 2)
            
            # 超时监控
            if elapsed_time > self.TIMEOUT_THRESHOLD:
                logger.warning(
                    f"部门同步耗时过长: {elapsed_time:.2f} 秒 "
                    f"(阈值: {self.TIMEOUT_THRESHOLD} 秒)"
                )
                result['timeout_warning'] = True
            
            logger.info("=" * 60)
            logger.info("部门同步完成")
            logger.info(f"总数: {result['total']}, 新增: {result['created']}, "
                       f"更新: {result['updated']}, 失败: {result['failed']}")
            logger.info(f"耗时: {elapsed_time:.2f} 秒")
            logger.info("=" * 60)
            
            return result
            
        except WeChatException as e:
            # 企业微信相关异常
            elapsed_time = time.time() - start_time
            logger.error(f"同步部门失败: {e}", exc_info=True)
            
            return {
                'success': False,
                'total': 0,
                'created': 0,
                'updated': 0,
                'failed': 0,
                'errors': [str(e)],
                'elapsed_time': round(elapsed_time, 2),
            }
            
        except Exception as e:
            # 其他未知异常
            elapsed_time = time.time() - start_time
            logger.error(f"同步部门时发生未知错误: {e}", exc_info=True)
            
            return {
                'success': False,
                'total': 0,
                'created': 0,
                'updated': 0,
                'failed': 0,
                'errors': [f"未知错误: {str(e)}"],
                'elapsed_time': round(elapsed_time, 2),
            }
    
    def sync_users(self, department_id: Optional[int] = None, fetch_child: bool = True) -> Dict:
        """
        同步用户信息（带错误处理和超时监控）
        
        Args:
            department_id: 部门 ID，如果为 None 则同步所有部门的用户
            fetch_child: 是否递归获取子部门的用户
            
        Returns:
            同步结果字典
        """
        start_time = time.time()
        
        try:
            # 验证配置
            is_valid, error_msg = self.config.validate_config()
            if not is_valid:
                logger.error(f"企业微信配置无效: {error_msg}")
                raise WeChatConfigError(error_msg)
            
            logger.info("=" * 60)
            logger.info("开始同步企业微信用户信息")
            logger.info(f"同步时间: {timezone.now()}")
            logger.info(f"部门 ID: {department_id or '全部'}")
            logger.info(f"递归子部门: {fetch_child}")
            logger.info("=" * 60)
            
            # 执行同步
            result = self.user_service.sync_users(department_id, fetch_child)
            
            # 计算耗时
            elapsed_time = time.time() - start_time
            result['elapsed_time'] = round(elapsed_time, 2)
            
            # 超时监控
            if elapsed_time > self.TIMEOUT_THRESHOLD:
                logger.warning(
                    f"用户同步耗时过长: {elapsed_time:.2f} 秒 "
                    f"(阈值: {self.TIMEOUT_THRESHOLD} 秒)"
                )
                result['timeout_warning'] = True
            
            logger.info("=" * 60)
            logger.info("用户同步完成")
            logger.info(f"总数: {result['total']}, 新增: {result['created']}, "
                       f"更新: {result['updated']}, 失败: {result['failed']}")
            logger.info(f"耗时: {elapsed_time:.2f} 秒")
            logger.info("=" * 60)
            
            return result
            
        except WeChatException as e:
            # 企业微信相关异常
            elapsed_time = time.time() - start_time
            logger.error(f"同步用户失败: {e}", exc_info=True)
            
            return {
                'success': False,
                'total': 0,
                'created': 0,
                'updated': 0,
                'failed': 0,
                'errors': [str(e)],
                'elapsed_time': round(elapsed_time, 2),
            }
            
        except Exception as e:
            # 其他未知异常
            elapsed_time = time.time() - start_time
            logger.error(f"同步用户时发生未知错误: {e}", exc_info=True)
            
            return {
                'success': False,
                'total': 0,
                'created': 0,
                'updated': 0,
                'failed': 0,
                'errors': [f"未知错误: {str(e)}"],
                'elapsed_time': round(elapsed_time, 2),
            }
    
    def sync_all(self) -> Dict:
        """
        同步所有数据（部门 + 用户）
        
        Returns:
            同步结果字典
        """
        start_time = time.time()
        
        logger.info("=" * 60)
        logger.info("开始完整同步（部门 + 用户）")
        logger.info(f"同步时间: {timezone.now()}")
        logger.info("=" * 60)
        
        # 先同步部门
        dept_result = self.sync_departments()
        
        # 再同步用户
        user_result = self.sync_users()
        
        # 汇总结果
        elapsed_time = time.time() - start_time
        
        result = {
            'success': dept_result['success'] and user_result['success'],
            'department': dept_result,
            'user': user_result,
            'elapsed_time': round(elapsed_time, 2),
        }
        
        # 超时监控
        if elapsed_time > self.TIMEOUT_THRESHOLD:
            logger.warning(
                f"完整同步耗时过长: {elapsed_time:.2f} 秒 "
                f"(阈值: {self.TIMEOUT_THRESHOLD} 秒)"
            )
            result['timeout_warning'] = True
        
        logger.info("=" * 60)
        logger.info("完整同步完成")
        logger.info(f"部门: 总数={dept_result['total']}, 新增={dept_result['created']}, "
                   f"更新={dept_result['updated']}, 失败={dept_result['failed']}")
        logger.info(f"用户: 总数={user_result['total']}, 新增={user_result['created']}, "
                   f"更新={user_result['updated']}, 失败={user_result['failed']}")
        logger.info(f"总耗时: {elapsed_time:.2f} 秒")
        logger.info("=" * 60)
        
        return result
    
    def get_department_tree(self) -> list:
        """
        获取部门树形结构
        
        Returns:
            部门树形结构列表
        """
        try:
            return self.department_service.get_department_tree()
        except Exception as e:
            logger.error(f"获取部门树失败: {e}", exc_info=True)
            raise WeChatSyncError(f"获取部门树失败: {str(e)}")
    
    def validate_config(self) -> tuple[bool, str]:
        """
        验证企业微信配置
        
        Returns:
            (是否有效, 错误信息)
        """
        return self.config.validate_config()
    
    def test_connection(self) -> Dict:
        """
        测试企业微信连接
        
        Returns:
            测试结果字典
        """
        result = {
            'success': False,
            'config_valid': False,
            'token_valid': False,
            'errors': [],
        }
        
        try:
            # 验证配置
            is_valid, error_msg = self.config.validate_config()
            if not is_valid:
                result['errors'].append(f"配置无效: {error_msg}")
                return result
            
            result['config_valid'] = True
            
            # 尝试获取访问令牌
            try:
                token = self.token_manager.get_access_token()
                
                # 验证令牌
                is_valid, error_msg = self.token_manager.validate_token(token)
                if is_valid:
                    result['token_valid'] = True
                    result['success'] = True
                else:
                    result['errors'].append(f"令牌无效: {error_msg}")
                    
            except Exception as e:
                result['errors'].append(f"获取令牌失败: {str(e)}")
            
        except Exception as e:
            result['errors'].append(f"测试连接失败: {str(e)}")
        
        return result


# 全局服务实例
wechat_service = WeChatService()

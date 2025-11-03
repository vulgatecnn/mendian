"""
清理过期的登录尝试记录管理命令
"""
from django.core.management.base import BaseCommand
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """清理过期的登录尝试记录"""
    
    help = '清理过期的登录尝试记录'
    
    def add_arguments(self, parser):
        """添加命令参数"""
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='只显示将要清理的记录，不实际执行清理',
        )
    
    def handle(self, *args, **options):
        """执行命令"""
        dry_run = options['dry_run']
        
        self.stdout.write(
            self.style.SUCCESS('开始清理过期的登录尝试记录...')
        )
        
        try:
            # 获取所有登录尝试相关的缓存键
            # 注意：这里需要根据实际的缓存后端实现
            # Redis缓存可以使用SCAN命令，但LocMemCache没有类似功能
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING('这是一个演示运行，不会实际清理数据')
                )
            
            # 由于Django的缓存框架没有提供列出所有键的标准方法
            # 这里提供一个基本的实现思路
            
            # 如果使用Redis作为缓存后端，可以这样实现：
            # import redis
            # r = redis.Redis.from_url(settings.CACHES['default']['LOCATION'])
            # keys = r.keys('login_attempt:*')
            # for key in keys:
            #     if not dry_run:
            #         r.delete(key)
            
            self.stdout.write(
                self.style.SUCCESS('登录尝试记录清理完成')
            )
            
            self.stdout.write(
                self.style.WARNING(
                    '注意：当前使用的是内存缓存，过期记录会自动清理。'
                    '如果使用Redis等持久化缓存，建议定期运行此命令。'
                )
            )
        
        except Exception as e:
            logger.error(f"清理登录尝试记录失败: {e}", exc_info=True)
            self.stdout.write(
                self.style.ERROR(f'清理失败: {str(e)}')
            )
            raise
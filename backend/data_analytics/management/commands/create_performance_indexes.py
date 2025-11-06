"""
创建性能优化索引的管理命令
"""
from django.core.management.base import BaseCommand
from django.db import connection


class Command(BaseCommand):
    help = '创建数据分析模块的性能优化索引'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--drop-existing',
            action='store_true',
            help='删除现有索引后重新创建'
        )
        parser.add_argument(
            '--analyze-only',
            action='store_true',
            help='仅分析索引使用情况，不创建索引'
        )
    
    def handle(self, *args, **options):
        drop_existing = options.get('drop_existing', False)
        analyze_only = options.get('analyze_only', False)
        
        if analyze_only:
            self.stdout.write('分析现有索引使用情况...')
            self._analyze_indexes()
            return
        
        self.stdout.write('开始创建性能优化索引...')
        
        try:
            with connection.cursor() as cursor:
                # 分析缓存表索引
                self._create_analytics_cache_indexes(cursor, drop_existing)
                
                # 外部销售数据表索引
                self._create_external_sales_data_indexes(cursor, drop_existing)
                
                # 报表任务表索引
                self._create_report_task_indexes(cursor, drop_existing)
                
                # 数据同步日志表索引
                self._create_data_sync_log_indexes(cursor, drop_existing)
                
                # 更新表统计信息
                self._update_table_statistics(cursor)
            
            self.stdout.write(self.style.SUCCESS('性能优化索引创建完成！'))
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'创建索引失败: {e}')
            )
            raise
    
    def _create_analytics_cache_indexes(self, cursor, drop_existing):
        """创建分析缓存表索引"""
        self.stdout.write('创建分析缓存表索引...')
        
        indexes = [
            {
                'name': 'idx_analytics_cache_type_expires',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_type_expires ON analytics_cache (cache_type, expires_at)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_analytics_cache_type_expires'
            },
            {
                'name': 'idx_analytics_cache_expires_at',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_expires_at ON analytics_cache (expires_at)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_analytics_cache_expires_at'
            },
            {
                'name': 'idx_analytics_cache_created_at',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_cache_created_at ON analytics_cache (created_at DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_analytics_cache_created_at'
            }
        ]
        
        self._execute_index_operations(cursor, indexes, drop_existing)
    
    def _create_external_sales_data_indexes(self, cursor, drop_existing):
        """创建外部销售数据表索引"""
        self.stdout.write('创建外部销售数据表索引...')
        
        indexes = [
            {
                'name': 'idx_external_sales_store_date',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_sales_store_date ON external_sales_data (store_id, data_date DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_external_sales_store_date'
            },
            {
                'name': 'idx_external_sales_data_date',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_sales_data_date ON external_sales_data (data_date DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_external_sales_data_date'
            },
            {
                'name': 'idx_external_sales_created_at',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_sales_created_at ON external_sales_data (created_at DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_external_sales_created_at'
            },
            {
                'name': 'idx_external_sales_sync_status',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_external_sales_sync_status ON external_sales_data (sync_status)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_external_sales_sync_status'
            }
        ]
        
        self._execute_index_operations(cursor, indexes, drop_existing)
    
    def _create_report_task_indexes(self, cursor, drop_existing):
        """创建报表任务表索引"""
        self.stdout.write('创建报表任务表索引...')
        
        indexes = [
            {
                'name': 'idx_report_task_status_created',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_task_status_created ON report_tasks (status, created_at DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_report_task_status_created'
            },
            {
                'name': 'idx_report_task_created_by',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_task_created_by ON report_tasks (created_by_id, created_at DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_report_task_created_by'
            },
            {
                'name': 'idx_report_task_type_status',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_task_type_status ON report_tasks (report_type, status)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_report_task_type_status'
            },
            {
                'name': 'idx_report_task_completed_at',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_report_task_completed_at ON report_tasks (completed_at DESC) WHERE completed_at IS NOT NULL',
                'drop_sql': 'DROP INDEX IF EXISTS idx_report_task_completed_at'
            }
        ]
        
        self._execute_index_operations(cursor, indexes, drop_existing)
    
    def _create_data_sync_log_indexes(self, cursor, drop_existing):
        """创建数据同步日志表索引"""
        self.stdout.write('创建数据同步日志表索引...')
        
        indexes = [
            {
                'name': 'idx_data_sync_log_type_start',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_sync_log_type_start ON data_sync_logs (sync_type, start_time DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_data_sync_log_type_start'
            },
            {
                'name': 'idx_data_sync_log_status_start',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_sync_log_status_start ON data_sync_logs (status, start_time DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_data_sync_log_status_start'
            },
            {
                'name': 'idx_data_sync_log_start_time',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_sync_log_start_time ON data_sync_logs (start_time DESC)',
                'drop_sql': 'DROP INDEX IF EXISTS idx_data_sync_log_start_time'
            },
            {
                'name': 'idx_data_sync_log_created_by',
                'sql': 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_data_sync_log_created_by ON data_sync_logs (created_by_id) WHERE created_by_id IS NOT NULL',
                'drop_sql': 'DROP INDEX IF EXISTS idx_data_sync_log_created_by'
            }
        ]
        
        self._execute_index_operations(cursor, indexes, drop_existing)
    
    def _execute_index_operations(self, cursor, indexes, drop_existing):
        """执行索引操作"""
        for index in indexes:
            try:
                if drop_existing:
                    self.stdout.write(f'  删除索引: {index["name"]}')
                    cursor.execute(index['drop_sql'])
                
                self.stdout.write(f'  创建索引: {index["name"]}')
                cursor.execute(index['sql'])
                self.stdout.write(f'    ✓ {index["name"]} 创建成功')
                
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'    ✗ {index["name"]} 创建失败: {e}')
                )
    
    def _update_table_statistics(self, cursor):
        """更新表统计信息"""
        self.stdout.write('更新表统计信息...')
        
        tables = [
            'analytics_cache',
            'external_sales_data',
            'report_tasks',
            'data_sync_logs'
        ]
        
        for table in tables:
            try:
                cursor.execute(f'ANALYZE {table}')
                self.stdout.write(f'  ✓ {table} 统计信息更新完成')
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'  ✗ {table} 统计信息更新失败: {e}')
                )
    
    def _analyze_indexes(self):
        """分析索引使用情况"""
        self.stdout.write('分析索引使用情况...')
        
        with connection.cursor() as cursor:
            # 查询索引使用统计
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    idx_scan,
                    idx_tup_read,
                    idx_tup_fetch
                FROM pg_stat_user_indexes 
                WHERE schemaname = 'public'
                AND (tablename LIKE '%analytics%' 
                     OR tablename LIKE '%report%' 
                     OR tablename LIKE '%external%'
                     OR tablename LIKE '%sync%')
                ORDER BY idx_scan DESC
            """)
            
            results = cursor.fetchall()
            
            if results:
                self.stdout.write('\n索引使用统计:')
                self.stdout.write('-' * 80)
                self.stdout.write(f'{"表名":<20} {"索引名":<30} {"扫描次数":<10} {"读取行数":<10}')
                self.stdout.write('-' * 80)
                
                for row in results:
                    schema, table, index, scan_count, tup_read, tup_fetch = row
                    self.stdout.write(f'{table:<20} {index:<30} {scan_count:<10} {tup_read:<10}')
            else:
                self.stdout.write('未找到相关索引统计信息')
            
            # 查询未使用的索引
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    indexname
                FROM pg_stat_user_indexes 
                WHERE schemaname = 'public'
                AND idx_scan = 0
                AND (tablename LIKE '%analytics%' 
                     OR tablename LIKE '%report%' 
                     OR tablename LIKE '%external%'
                     OR tablename LIKE '%sync%')
                ORDER BY tablename, indexname
            """)
            
            unused_indexes = cursor.fetchall()
            
            if unused_indexes:
                self.stdout.write('\n未使用的索引:')
                self.stdout.write('-' * 60)
                for schema, table, index in unused_indexes:
                    self.stdout.write(f'{table}.{index}')
                    
                self.stdout.write(f'\n建议考虑删除 {len(unused_indexes)} 个未使用的索引以节省存储空间')
            else:
                self.stdout.write('\n所有索引都有被使用')
"""
性能优化管理命令
"""
import json
from django.core.management.base import BaseCommand
from data_analytics.monitoring import PerformanceOptimizationService


class Command(BaseCommand):
    help = '执行系统性能优化'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--optimization-type',
            type=str,
            choices=['database', 'cache', 'precomputation', 'all'],
            default='all',
            help='优化类型：database, cache, precomputation 或 all'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='仅显示优化建议，不执行实际优化'
        )
        parser.add_argument(
            '--output-format',
            type=str,
            choices=['json', 'table'],
            default='table',
            help='输出格式：json 或 table'
        )
    
    def handle(self, *args, **options):
        optimization_type = options.get('optimization_type', 'all')
        dry_run = options.get('dry_run', False)
        output_format = options.get('output_format', 'table')
        
        if dry_run:
            self.stdout.write('执行性能优化分析（仅分析，不执行优化）...')
        else:
            self.stdout.write('开始执行性能优化...')
        
        try:
            optimization_service = PerformanceOptimizationService()
            results = {}
            
            if optimization_type in ['database', 'all']:
                self.stdout.write('\n正在优化数据库查询性能...')
                if not dry_run:
                    db_results = optimization_service.optimize_database_queries()
                    results['database'] = db_results
                    self._display_optimization_results('数据库优化', db_results, output_format)
                else:
                    self.stdout.write('  [模拟] 分析慢查询和缺失索引')
                    self.stdout.write('  [模拟] 清理过期数据')
                    self.stdout.write('  [模拟] 更新表统计信息')
            
            if optimization_type in ['cache', 'all']:
                self.stdout.write('\n正在优化缓存策略...')
                if not dry_run:
                    cache_results = optimization_service.optimize_cache_strategy()
                    results['cache'] = cache_results
                    self._display_optimization_results('缓存优化', cache_results, output_format)
                else:
                    self.stdout.write('  [模拟] 清理过期缓存')
                    self.stdout.write('  [模拟] 预热热点数据缓存')
                    self.stdout.write('  [模拟] 分析缓存使用情况')
            
            if optimization_type in ['precomputation', 'all']:
                self.stdout.write('\n正在实现数据预计算...')
                if not dry_run:
                    precomp_results = optimization_service.implement_data_precomputation()
                    results['precomputation'] = precomp_results
                    self._display_optimization_results('数据预计算', precomp_results, output_format)
                else:
                    self.stdout.write('  [模拟] 预计算经营大屏数据')
                    self.stdout.write('  [模拟] 预计算地图数据')
                    self.stdout.write('  [模拟] 预计算漏斗数据')
            
            if output_format == 'json' and not dry_run:
                self.stdout.write('\n完整优化结果:')
                self.stdout.write(json.dumps(results, indent=2, ensure_ascii=False))
            
            if dry_run:
                self.stdout.write(f'\n{self.style.SUCCESS("性能优化分析完成（未执行实际优化）")}')
            else:
                self.stdout.write(f'\n{self.style.SUCCESS("性能优化执行完成")}')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'性能优化失败: {e}')
            )
            raise
    
    def _display_optimization_results(self, title, results, output_format):
        """显示优化结果"""
        if output_format == 'json':
            self.stdout.write(json.dumps({title: results}, indent=2, ensure_ascii=False))
            return
        
        self.stdout.write(f'\n{title}结果:')
        self.stdout.write('-' * 50)
        
        # 显示已应用的优化
        optimizations = results.get('optimizations_applied', [])
        if optimizations:
            self.stdout.write('已应用的优化:')
            for opt in optimizations:
                self.stdout.write(f'  ✓ {opt}')
        else:
            self.stdout.write('  无需要应用的优化')
        
        # 显示建议
        recommendations = results.get('recommendations', [])
        if recommendations:
            self.stdout.write('\n优化建议:')
            for rec in recommendations:
                self.stdout.write(f'  • {rec}')
        
        # 显示性能改进信息
        performance = results.get('performance_improvement', {})
        if performance:
            self.stdout.write('\n性能改进:')
            for key, value in performance.items():
                self.stdout.write(f'  {key}: {value}')
        
        # 显示预计算指标
        precomputed = results.get('precomputed_metrics', [])
        if precomputed:
            self.stdout.write('\n预计算指标:')
            for metric in precomputed:
                name = metric.get('metric', '未知')
                time = metric.get('computation_time', 0)
                self.stdout.write(f'  {name}: {time}秒')
        
        # 显示缓存统计
        cache_stats = results.get('cache_stats', {})
        if cache_stats:
            self.stdout.write('\n缓存统计:')
            hit_rate = cache_stats.get('hit_rate', 0)
            total_caches = cache_stats.get('total_caches', 0)
            self.stdout.write(f'  命中率: {hit_rate}%')
            self.stdout.write(f'  缓存总数: {total_caches}')
        
        # 显示错误信息
        error = results.get('error')
        if error:
            self.stdout.write(f'\n{self.style.ERROR(f"错误: {error}")}')
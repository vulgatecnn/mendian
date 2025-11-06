"""
数据分析模块视图
"""
import os
from datetime import timedelta
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.http import Http404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import AnalyticsCache, ReportTask, ExternalSalesData, DataSyncLog
from .permissions import AnalyticsPermissionManager
from .services import DataAggregationService, ROICalculationService, ExternalDataValidationService


class DashboardDataView(APIView):
    """经营大屏数据接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.data_service = DataAggregationService()
    
    @extend_schema(
        summary="获取经营大屏数据",
        description="获取经营大屏的综合数据，包括开店地图、跟进漏斗、计划进度等",
        responses={200: "成功返回大屏数据"}
    )
    def get(self, request):
        """获取经营大屏数据"""
        try:
            # 获取用户权限信息
            permission_manager = AnalyticsPermissionManager(request.user)
            user_permissions = permission_manager.get_user_permissions()
            
            # 获取大屏数据
            data = self.data_service.get_dashboard_data(user_permissions)
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': data
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取大屏数据失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StoreMapDataView(APIView):
    """开店地图数据接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.data_service = DataAggregationService()
    
    @extend_schema(
        summary="获取开店地图数据",
        description="获取门店地理分布和状态数据",
        parameters=[
            OpenApiParameter('region', OpenApiTypes.STR, description='区域筛选'),
            OpenApiParameter('time_range', OpenApiTypes.STR, description='时间范围，格式：YYYY-MM-DD,YYYY-MM-DD'),
        ],
        responses={200: "成功返回地图数据"}
    )
    def get(self, request):
        """获取开店地图数据"""
        try:
            # 获取查询参数
            region_id = request.query_params.get('region')
            time_range_str = request.query_params.get('time_range')
            
            # 解析时间范围
            time_range = None
            if time_range_str:
                try:
                    start_str, end_str = time_range_str.split(',')
                    start_date = timezone.datetime.strptime(start_str.strip(), '%Y-%m-%d')
                    end_date = timezone.datetime.strptime(end_str.strip(), '%Y-%m-%d')
                    time_range = (start_date, end_date)
                except ValueError:
                    return Response({
                        'code': 400,
                        'message': '时间范围格式错误，请使用 YYYY-MM-DD,YYYY-MM-DD 格式',
                        'data': {}
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # 转换区域ID
            region_id = int(region_id) if region_id and region_id.isdigit() else None
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            user_permissions = permission_manager.get_user_permissions()
            if not permission_manager.can_access_region(region_id):
                return Response({
                    'code': 403,
                    'message': '您没有权限访问该区域的数据',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取地图数据
            data = self.data_service.get_store_map_data(region_id, time_range)
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': data
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取地图数据失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FollowUpFunnelDataView(APIView):
    """跟进漏斗数据接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.data_service = DataAggregationService()
    
    @extend_schema(
        summary="获取跟进漏斗数据",
        description="获取拓店流程各环节的转化数据",
        parameters=[
            OpenApiParameter('start_date', OpenApiTypes.DATE, description='开始日期'),
            OpenApiParameter('end_date', OpenApiTypes.DATE, description='结束日期'),
            OpenApiParameter('region', OpenApiTypes.STR, description='区域筛选'),
        ],
        responses={200: "成功返回漏斗数据"}
    )
    def get(self, request):
        """获取跟进漏斗数据"""
        try:
            # 获取查询参数
            start_date_str = request.query_params.get('start_date')
            end_date_str = request.query_params.get('end_date')
            region_id = request.query_params.get('region')
            
            # 解析日期参数
            time_range = None
            if start_date_str and end_date_str:
                try:
                    start_date = timezone.datetime.strptime(start_date_str, '%Y-%m-%d')
                    end_date = timezone.datetime.strptime(end_date_str, '%Y-%m-%d')
                    time_range = (start_date, end_date)
                except ValueError:
                    return Response({
                        'code': 400,
                        'message': '日期格式错误，请使用 YYYY-MM-DD 格式',
                        'data': {}
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # 转换区域ID
            region_id = int(region_id) if region_id and region_id.isdigit() else None
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_access_region(region_id):
                return Response({
                    'code': 403,
                    'message': '您没有权限访问该区域的数据',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取漏斗数据
            data = self.data_service.get_follow_up_funnel_data(region_id, time_range)
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': data
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取漏斗数据失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PlanProgressDataView(APIView):
    """计划完成进度数据接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.data_service = DataAggregationService()
    
    @extend_schema(
        summary="获取计划完成进度数据",
        description="获取开店计划的执行进度分析",
        parameters=[
            OpenApiParameter('plan_id', OpenApiTypes.INT, description='计划ID，不传则获取当前活跃计划'),
            OpenApiParameter('contribution_rate_type', OpenApiTypes.STR, description='贡献率类型筛选：high/medium/low'),
        ],
        responses={200: "成功返回进度数据"}
    )
    def get(self, request):
        """获取计划完成进度数据"""
        try:
            # 获取查询参数
            plan_id = request.query_params.get('plan_id')
            contribution_rate_type = request.query_params.get('contribution_rate_type')
            
            # 转换计划ID
            plan_id = int(plan_id) if plan_id and plan_id.isdigit() else None
            
            # 验证贡献率类型参数
            if contribution_rate_type and contribution_rate_type not in ['high', 'medium', 'low']:
                return Response({
                    'code': 400,
                    'message': '贡献率类型参数错误，支持的值：high/medium/low',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            user_permissions = permission_manager.get_user_permissions()
            if not permission_manager.can_access_data_type('plan_progress'):
                return Response({
                    'code': 403,
                    'message': '您没有权限访问该计划的数据',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取计划进度数据
            data = self.data_service.get_plan_progress_data(plan_id, contribution_rate_type)
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': data
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取计划进度数据失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GenerateReportView(APIView):
    """报表生成接口"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="生成报表",
        description="创建报表生成任务",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'report_type': {
                        'type': 'string', 
                        'description': '报表类型：plan/follow_up/preparation/assets',
                        'enum': ['plan', 'follow_up', 'preparation', 'assets']
                    },
                    'filters': {
                        'type': 'object', 
                        'description': '筛选条件',
                        'properties': {
                            'date_range': {'type': 'string', 'description': '日期范围，格式：YYYY-MM-DD,YYYY-MM-DD'},
                            'regions': {'type': 'array', 'items': {'type': 'integer'}, 'description': '区域ID列表'},
                            'store_types': {'type': 'array', 'items': {'type': 'string'}, 'description': '门店类型列表'},
                            'statuses': {'type': 'array', 'items': {'type': 'string'}, 'description': '状态列表'},
                            'assigned_users': {'type': 'array', 'items': {'type': 'integer'}, 'description': '负责人ID列表'}
                        }
                    },
                    'format': {
                        'type': 'string', 
                        'description': '导出格式：excel/pdf',
                        'enum': ['excel', 'pdf'],
                        'default': 'excel'
                    }
                },
                'required': ['report_type']
            }
        },
        responses={201: "成功创建报表任务"}
    )
    def post(self, request):
        """创建报表生成任务"""
        try:
            # 验证请求参数
            report_type = request.data.get('report_type')
            if not report_type:
                return Response({
                    'code': 400,
                    'message': '报表类型不能为空',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            valid_report_types = ['plan', 'follow_up', 'preparation', 'assets']
            if report_type not in valid_report_types:
                return Response({
                    'code': 400,
                    'message': f'报表类型错误，支持的类型：{"/".join(valid_report_types)}',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            format_type = request.data.get('format', 'excel')
            if format_type not in ['excel', 'pdf']:
                return Response({
                    'code': 400,
                    'message': '导出格式错误，支持的格式：excel/pdf',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            filters = request.data.get('filters', {})
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_generate_report(report_type):
                return Response({
                    'code': 403,
                    'message': '您没有权限生成该类型的报表',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 创建报表任务
            task = ReportTask.objects.create(
                report_type=report_type,
                filters=filters,
                format=format_type,
                created_by=request.user
            )
            
            # 启动异步任务
            from .tasks import generate_report_task
            generate_report_task.delay(
                str(task.task_id),
                report_type,
                filters,
                format_type,
                request.user.id
            )
            
            return Response({
                'code': 0,
                'message': '报表任务创建成功',
                'data': {
                    'task_id': str(task.task_id),
                    'report_type': report_type,
                    'format': format_type,
                    'estimated_time': self._get_estimated_time(report_type),
                    'created_at': task.created_at.isoformat()
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'创建报表任务失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_estimated_time(self, report_type: str) -> int:
        """获取预估生成时间（秒）"""
        time_estimates = {
            'plan': 30,
            'follow_up': 60,
            'preparation': 45,
            'assets': 90,
        }
        return time_estimates.get(report_type, 60)


class ReportStatusView(APIView):
    """报表状态查询接口"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="查询报表状态",
        description="查询报表生成任务的状态和进度",
        responses={200: "成功返回任务状态"}
    )
    def get(self, request, task_id):
        """查询报表任务状态"""
        try:
            task = ReportTask.objects.get(task_id=task_id, created_by=request.user)
        except ReportTask.DoesNotExist:
            raise Http404("报表任务不存在")
        
        data = {
            'task_id': str(task.task_id),
            'status': task.status,
            'progress': task.progress,
            'created_at': task.created_at.isoformat(),
        }
        
        if task.status == 'completed' and task.file_path:
            data['download_url'] = f"/api/analytics/reports/download/{task.task_id}/"
        
        if task.status == 'failed':
            data['error_message'] = task.error_message
        
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': data
        })


class DownloadReportView(APIView):
    """报表下载接口"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="下载报表",
        description="下载已生成的报表文件",
        responses={200: "成功下载报表文件"}
    )
    def get(self, request, task_id):
        """下载报表文件"""
        try:
            task = ReportTask.objects.get(
                task_id=task_id, 
                created_by=request.user,
                status='completed'
            )
        except ReportTask.DoesNotExist:
            raise Http404("报表文件不存在或未完成")
        
        if not task.file_path or not os.path.exists(task.file_path):
            return Response({
                'code': 404,
                'message': '报表文件不存在',
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            from django.http import FileResponse
            import mimetypes
            
            # 确定文件类型
            content_type, _ = mimetypes.guess_type(task.file_path)
            if not content_type:
                content_type = 'application/octet-stream'
            
            # 生成下载文件名
            filename = f"{task.get_report_type_display()}_{task.created_at.strftime('%Y%m%d_%H%M%S')}"
            if task.format == 'excel':
                filename += '.xlsx'
            else:
                filename += '.pdf'
            
            # 返回文件响应
            response = FileResponse(
                open(task.file_path, 'rb'),
                content_type=content_type,
                as_attachment=True,
                filename=filename
            )
            
            # 设置文件大小头
            if task.file_size:
                response['Content-Length'] = task.file_size
            
            return response
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'文件下载失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ExternalSalesDataView(APIView):
    """外部销售数据接入接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.data_validation_service = ExternalDataValidationService()
    
    @extend_schema(
        summary="接入外部销售数据",
        description="接收外部系统推送的销售数据",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'store_id': {'type': 'string', 'description': '门店ID或门店编码'},
                    'store_code': {'type': 'string', 'description': '门店编码（可选，用于匹配门店）'},
                    'data_date': {'type': 'string', 'description': '数据日期，格式：YYYY-MM-DD'},
                    'daily_revenue': {'type': 'number', 'description': '日营业额'},
                    'daily_orders': {'type': 'integer', 'description': '日订单数'},
                    'daily_customers': {'type': 'integer', 'description': '日客流量（可选）'},
                    'monthly_revenue': {'type': 'number', 'description': '月营业额（可选）'},
                    'monthly_orders': {'type': 'integer', 'description': '月订单数（可选）'},
                    'data_source': {'type': 'string', 'description': '数据来源标识（可选）'},
                    'batch_id': {'type': 'string', 'description': '批次ID（可选）'}
                },
                'required': ['store_id', 'data_date', 'daily_revenue']
            }
        },
        responses={201: "成功接入销售数据"}
    )
    def post(self, request):
        """接入外部销售数据"""
        try:
            # 检查API访问权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_access_external_data_api():
                return Response({
                    'code': 403,
                    'message': '您没有权限访问外部数据接入API',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 验证和解析请求数据
            validation_result = self.data_validation_service.validate_sales_data(request.data)
            if not validation_result['is_valid']:
                return Response({
                    'code': 400,
                    'message': '数据验证失败',
                    'data': {
                        'errors': validation_result['errors']
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            validated_data = validation_result['data']
            
            # 匹配门店
            store_match_result = self.data_validation_service.match_store(
                validated_data.get('store_id'),
                validated_data.get('store_code')
            )
            
            if not store_match_result['found']:
                return Response({
                    'code': 404,
                    'message': store_match_result['message'],
                    'data': {}
                }, status=status.HTTP_404_NOT_FOUND)
            
            store = store_match_result['store']
            
            # 创建或更新销售数据
            sales_data, created = ExternalSalesData.objects.update_or_create(
                store=store,
                data_date=validated_data['data_date'],
                defaults={
                    'daily_revenue': validated_data['daily_revenue'],
                    'daily_orders': validated_data.get('daily_orders', 0),
                    'daily_customers': validated_data.get('daily_customers', 0),
                    'monthly_revenue': validated_data.get('monthly_revenue', 0),
                    'monthly_orders': validated_data.get('monthly_orders', 0),
                    'data_source': validated_data.get('data_source', 'external_api'),
                    'sync_status': 'success',
                    'sync_batch_id': validated_data.get('batch_id', ''),
                    'sync_message': '数据接入成功',
                }
            )
            
            # 计算客单价
            sales_data.calculate_average_order_value()
            
            # 验证数据合理性
            is_data_valid = sales_data.validate_data()
            sales_data.save()
            
            # 记录同步日志
            DataSyncLog.objects.create(
                sync_type='sales_data',
                status='success',
                start_time=timezone.now(),
                end_time=timezone.now(),
                records_processed=1,
                records_success=1,
                error_details={
                    'store_id': validated_data.get('store_id'),
                    'store_code': store.store_code,
                    'data_date': validated_data['data_date'].isoformat(),
                    'operation': 'created' if created else 'updated',
                    'data_valid': is_data_valid,
                    'validation_errors': sales_data.validation_errors
                },
                created_by=request.user
            )
            
            return Response({
                'code': 0,
                'message': '销售数据接入成功',
                'data': {
                    'store_id': store.id,
                    'store_code': store.store_code,
                    'store_name': store.store_name,
                    'data_date': validated_data['data_date'].isoformat(),
                    'operation': 'created' if created else 'updated',
                    'data_valid': is_data_valid,
                    'validation_warnings': sales_data.validation_errors if not is_data_valid else {},
                    'synced_at': timezone.now().isoformat()
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            # 记录失败日志
            DataSyncLog.objects.create(
                sync_type='sales_data',
                status='failed',
                start_time=timezone.now(),
                end_time=timezone.now(),
                records_processed=1,
                records_failed=1,
                error_details={
                    'store_id': request.data.get('store_id'),
                    'data_date': request.data.get('data_date'),
                    'error': str(e)
                },
                created_by=request.user
            )
            
            return Response({
                'code': 500,
                'message': f'销售数据接入失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="批量接入外部销售数据",
        description="批量接收外部系统推送的销售数据",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'data_batch': {
                        'type': 'array',
                        'items': {
                            'type': 'object',
                            'properties': {
                                'store_id': {'type': 'string', 'description': '门店ID'},
                                'data_date': {'type': 'string', 'description': '数据日期'},
                                'daily_revenue': {'type': 'number', 'description': '日营业额'},
                                'daily_orders': {'type': 'integer', 'description': '日订单数'}
                            }
                        }
                    }
                }
            }
        },
        responses={201: "成功接入批量销售数据"}
    )
    def put(self, request):
        """批量接入外部销售数据"""
        try:
            # 检查API访问权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_access_external_data_api():
                return Response({
                    'code': 403,
                    'message': '您没有权限访问外部数据接入API',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            data_batch = request.data.get('data_batch', [])
            if not data_batch:
                return Response({
                    'code': 400,
                    'message': '数据批次不能为空',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证批量数据
            validation_service = ExternalDataValidationService()
            batch_validation = validation_service.validate_batch_data(data_batch)
            
            if not batch_validation['is_valid'] and batch_validation['valid_count'] == 0:
                return Response({
                    'code': 400,
                    'message': '批量数据验证失败，没有有效记录',
                    'data': {
                        'validation_result': batch_validation
                    }
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 生成批次ID
            import uuid
            batch_id = str(uuid.uuid4())
            
            # 启动异步任务处理批量数据
            from .tasks import sync_external_sales_data
            task_result = sync_external_sales_data.delay(
                data_batch, 
                batch_id, 
                request.user.id
            )
            
            return Response({
                'code': 0,
                'message': '批量销售数据接入任务已启动',
                'data': {
                    'task_id': task_result.id,
                    'batch_id': batch_id,
                    'batch_size': len(data_batch),
                    'valid_count': batch_validation['valid_count'],
                    'invalid_count': batch_validation['invalid_count'],
                    'validation_warnings': batch_validation['errors'] if batch_validation['invalid_count'] > 0 else [],
                    'started_at': timezone.now().isoformat()
                }
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'批量销售数据接入失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DataSyncStatusView(APIView):
    """数据同步状态接口"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="获取数据同步状态",
        description="获取外部数据同步的状态信息",
        parameters=[
            OpenApiParameter('sync_type', OpenApiTypes.STR, description='同步类型筛选'),
            OpenApiParameter('hours', OpenApiTypes.INT, description='查询时间范围（小时），默认24小时'),
        ],
        responses={200: "成功返回同步状态"}
    )
    def get(self, request):
        """获取数据同步状态"""
        try:
            sync_type = request.query_params.get('sync_type')
            hours = int(request.query_params.get('hours', 24))
            
            # 构建查询条件
            queryset = DataSyncLog.objects.all()
            if sync_type:
                queryset = queryset.filter(sync_type=sync_type)
            
            # 获取最近的同步日志
            latest_sync = queryset.order_by('-start_time').first()
            
            # 获取指定时间范围内的同步统计
            time_threshold = timezone.now() - timedelta(hours=hours)
            recent_syncs = queryset.filter(start_time__gte=time_threshold)
            
            sync_stats = recent_syncs.aggregate(
                total_syncs=Count('id'),
                success_syncs=Count('id', filter=Q(status='success')),
                failed_syncs=Count('id', filter=Q(status='failed')),
                partial_syncs=Count('id', filter=Q(status='partial')),
                total_processed=Sum('records_processed'),
                total_success=Sum('records_success'),
                total_failed=Sum('records_failed'),
            )
            
            # 获取失败的同步记录详情
            failed_syncs = recent_syncs.filter(status='failed').values(
                'sync_type', 'start_time', 'error_details', 'records_failed'
            ).order_by('-start_time')[:10]  # 最近10条失败记录
            
            # 获取各同步类型的状态
            sync_type_stats = recent_syncs.values('sync_type').annotate(
                count=Count('id'),
                success_count=Count('id', filter=Q(status='success')),
                failed_count=Count('id', filter=Q(status='failed')),
                success_rate=Case(
                    When(count=0, then=0),
                    default=F('success_count') * 100.0 / F('count')
                )
            ).order_by('sync_type')
            
            # 获取缓存更新状态
            cache_status = self._get_cache_update_status()
            
            # 获取外部销售数据统计
            sales_data_stats = self._get_sales_data_stats(hours)
            
            # 计算系统健康状态
            system_status = self._calculate_system_status(sync_stats, failed_syncs)
            
            data = {
                'latest_sync': {
                    'sync_type': latest_sync.get_sync_type_display() if latest_sync else None,
                    'status': latest_sync.get_status_display() if latest_sync else None,
                    'start_time': latest_sync.start_time.isoformat() if latest_sync else None,
                    'duration': str(latest_sync.duration) if latest_sync and latest_sync.duration else None,
                    'records_processed': latest_sync.records_processed if latest_sync else 0,
                } if latest_sync else None,
                
                'sync_statistics': {
                    'time_range_hours': hours,
                    'total_syncs': sync_stats['total_syncs'] or 0,
                    'success_syncs': sync_stats['success_syncs'] or 0,
                    'failed_syncs': sync_stats['failed_syncs'] or 0,
                    'partial_syncs': sync_stats['partial_syncs'] or 0,
                    'success_rate': round((sync_stats['success_syncs'] or 0) / max(sync_stats['total_syncs'] or 1, 1) * 100, 2),
                    'total_records_processed': sync_stats['total_processed'] or 0,
                    'total_records_success': sync_stats['total_success'] or 0,
                    'total_records_failed': sync_stats['total_failed'] or 0,
                },
                
                'sync_type_breakdown': list(sync_type_stats),
                'recent_failures': list(failed_syncs),
                'cache_status': cache_status,
                'sales_data_stats': sales_data_stats,
                'system_status': system_status,
                'checked_at': timezone.now().isoformat(),
            }
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': data
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取同步状态失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_cache_update_status(self):
        """获取缓存更新状态"""
        try:
            # 获取各类型缓存的最后更新时间
            cache_types = ['dashboard', 'store_map', 'funnel', 'plan_progress']
            cache_status = {}
            
            for cache_type in cache_types:
                latest_cache = AnalyticsCache.objects.filter(
                    cache_type=cache_type
                ).order_by('-created_at').first()
                
                cache_status[cache_type] = {
                    'last_updated': latest_cache.created_at.isoformat() if latest_cache else None,
                    'expires_at': latest_cache.expires_at.isoformat() if latest_cache else None,
                    'is_expired': latest_cache.expires_at < timezone.now() if latest_cache else True,
                    'status': 'expired' if (latest_cache and latest_cache.expires_at < timezone.now()) else 'fresh' if latest_cache else 'missing'
                }
            
            return cache_status
            
        except Exception as e:
            return {'error': str(e)}
    
    def _get_sales_data_stats(self, hours: int):
        """获取销售数据统计"""
        try:
            time_threshold = timezone.now() - timedelta(hours=hours)
            
            # 获取最近接入的销售数据统计
            recent_sales_data = ExternalSalesData.objects.filter(
                created_at__gte=time_threshold
            )
            
            stats = recent_sales_data.aggregate(
                total_records=Count('id'),
                unique_stores=Count('store', distinct=True),
                success_records=Count('id', filter=Q(sync_status='success')),
                failed_records=Count('id', filter=Q(sync_status='failed')),
                validated_records=Count('id', filter=Q(is_validated=True)),
            )
            
            # 获取最新数据日期
            latest_data = recent_sales_data.order_by('-data_date').first()
            
            return {
                'time_range_hours': hours,
                'total_records': stats['total_records'] or 0,
                'unique_stores': stats['unique_stores'] or 0,
                'success_records': stats['success_records'] or 0,
                'failed_records': stats['failed_records'] or 0,
                'validated_records': stats['validated_records'] or 0,
                'validation_rate': round((stats['validated_records'] or 0) / max(stats['total_records'] or 1, 1) * 100, 2),
                'latest_data_date': latest_data.data_date.isoformat() if latest_data else None,
            }
            
        except Exception as e:
            return {'error': str(e)}
    
    def _calculate_system_status(self, sync_stats: Dict, failed_syncs: List) -> str:
        """计算系统健康状态"""
        try:
            total_syncs = sync_stats.get('total_syncs', 0)
            failed_syncs_count = sync_stats.get('failed_syncs', 0)
            
            if total_syncs == 0:
                return 'unknown'
            
            failure_rate = failed_syncs_count / total_syncs
            
            if failure_rate == 0:
                return 'healthy'
            elif failure_rate < 0.1:  # 失败率小于10%
                return 'warning'
            else:
                return 'critical'
                
        except Exception:
            return 'unknown'


class DataUpdateStatusView(APIView):
    """数据更新状态接口"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="获取数据更新状态",
        description="获取各模块数据的最后更新时间和状态",
        responses={200: "成功返回更新状态"}
    )
    def get(self, request):
        """获取数据更新状态"""
        try:
            # 获取各模块的数据更新状态
            update_status = {
                'dashboard': self._get_module_update_status('dashboard'),
                'store_map': self._get_module_update_status('store_map'),
                'follow_up_funnel': self._get_module_update_status('funnel'),
                'plan_progress': self._get_module_update_status('plan_progress'),
            }
            
            # 计算整体更新状态
            overall_status = self._calculate_overall_status(update_status)
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': {
                    'modules': update_status,
                    'overall_status': overall_status,
                    'checked_at': timezone.now().isoformat()
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取数据更新状态失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _get_module_update_status(self, module_type):
        """获取模块更新状态"""
        try:
            # 从缓存表获取最后更新时间
            latest_cache = AnalyticsCache.objects.filter(
                cache_type=module_type
            ).order_by('-created_at').first()
            
            if latest_cache:
                is_expired = latest_cache.expires_at < timezone.now()
                last_updated = latest_cache.created_at
                next_update = latest_cache.expires_at
            else:
                is_expired = True
                last_updated = None
                next_update = None
            
            return {
                'last_updated': last_updated.isoformat() if last_updated else None,
                'next_update': next_update.isoformat() if next_update else None,
                'is_expired': is_expired,
                'status': 'expired' if is_expired else 'fresh'
            }
            
        except Exception:
            return {
                'last_updated': None,
                'next_update': None,
                'is_expired': True,
                'status': 'error'
            }
    
    def _calculate_overall_status(self, update_status):
        """计算整体更新状态"""
        statuses = [module['status'] for module in update_status.values()]
        
        if 'error' in statuses:
            return 'error'
        elif 'expired' in statuses:
            return 'needs_update'
        else:
            return 'up_to_date'


class ScheduledReportView(APIView):
    """定时报表管理接口"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="获取定时报表列表",
        description="获取用户创建的定时报表配置列表",
        responses={200: "成功返回定时报表列表"}
    )
    def get(self, request):
        """获取定时报表列表"""
        try:
            from .models import ScheduledReport
            
            reports = ScheduledReport.objects.filter(
                created_by=request.user
            ).order_by('-created_at')
            
            report_list = []
            for report in reports:
                report_data = {
                    'id': report.id,
                    'name': report.name,
                    'report_type': report.report_type,
                    'report_type_display': report.get_report_type_display(),
                    'frequency': report.frequency,
                    'frequency_display': report.get_frequency_display(),
                    'format': report.format,
                    'is_active': report.is_active,
                    'recipients': report.recipients,
                    'created_at': report.created_at.isoformat(),
                    'last_generated': report.last_generated.isoformat() if report.last_generated else None,
                }
                report_list.append(report_data)
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': {
                    'reports': report_list,
                    'total': len(report_list)
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取定时报表列表失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="创建定时报表",
        description="创建新的定时报表配置",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string', 'description': '报表名称'},
                    'report_type': {'type': 'string', 'description': '报表类型'},
                    'frequency': {'type': 'string', 'description': '生成频率'},
                    'filters': {'type': 'object', 'description': '筛选条件'},
                    'format': {'type': 'string', 'description': '导出格式'},
                    'recipients': {'type': 'array', 'items': {'type': 'string'}, 'description': '收件人邮箱列表'},
                },
                'required': ['name', 'report_type', 'frequency']
            }
        },
        responses={201: "成功创建定时报表"}
    )
    def post(self, request):
        """创建定时报表"""
        try:
            from .models import ScheduledReport
            
            # 验证必需参数
            name = request.data.get('name')
            report_type = request.data.get('report_type')
            frequency = request.data.get('frequency')
            
            if not all([name, report_type, frequency]):
                return Response({
                    'code': 400,
                    'message': '缺少必需参数：name, report_type, frequency',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 验证参数值
            valid_report_types = ['plan', 'follow_up', 'preparation', 'assets']
            if report_type not in valid_report_types:
                return Response({
                    'code': 400,
                    'message': f'报表类型错误，支持的类型：{"/".join(valid_report_types)}',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            valid_frequencies = ['daily', 'weekly', 'monthly']
            if frequency not in valid_frequencies:
                return Response({
                    'code': 400,
                    'message': f'生成频率错误，支持的频率：{"/".join(valid_frequencies)}',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 创建定时报表
            scheduled_report = ScheduledReport.objects.create(
                name=name,
                report_type=report_type,
                frequency=frequency,
                filters=request.data.get('filters', {}),
                format=request.data.get('format', 'excel'),
                recipients=request.data.get('recipients', []),
                created_by=request.user
            )
            
            return Response({
                'code': 0,
                'message': '定时报表创建成功',
                'data': {
                    'id': scheduled_report.id,
                    'name': scheduled_report.name,
                    'report_type': scheduled_report.report_type,
                    'frequency': scheduled_report.frequency,
                    'created_at': scheduled_report.created_at.isoformat()
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'创建定时报表失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ScheduledReportDetailView(APIView):
    """定时报表详情管理接口"""
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        summary="更新定时报表",
        description="更新定时报表配置",
        responses={200: "成功更新定时报表"}
    )
    def put(self, request, report_id):
        """更新定时报表"""
        try:
            from .models import ScheduledReport
            
            report = ScheduledReport.objects.get(
                id=report_id, 
                created_by=request.user
            )
            
            # 更新字段
            if 'name' in request.data:
                report.name = request.data['name']
            if 'frequency' in request.data:
                valid_frequencies = ['daily', 'weekly', 'monthly']
                if request.data['frequency'] in valid_frequencies:
                    report.frequency = request.data['frequency']
            if 'filters' in request.data:
                report.filters = request.data['filters']
            if 'format' in request.data:
                if request.data['format'] in ['excel', 'pdf']:
                    report.format = request.data['format']
            if 'recipients' in request.data:
                report.recipients = request.data['recipients']
            if 'is_active' in request.data:
                report.is_active = request.data['is_active']
            
            report.save()
            
            return Response({
                'code': 0,
                'message': '定时报表更新成功',
                'data': {
                    'id': report.id,
                    'name': report.name,
                    'updated_at': report.updated_at.isoformat()
                }
            })
            
        except ScheduledReport.DoesNotExist:
            return Response({
                'code': 404,
                'message': '定时报表不存在',
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'更新定时报表失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="删除定时报表",
        description="删除定时报表配置",
        responses={200: "成功删除定时报表"}
    )
    def delete(self, request, report_id):
        """删除定时报表"""
        try:
            from .models import ScheduledReport
            
            report = ScheduledReport.objects.get(
                id=report_id, 
                created_by=request.user
            )
            
            report.delete()
            
            return Response({
                'code': 0,
                'message': '定时报表删除成功',
                'data': {}
            })
            
        except ScheduledReport.DoesNotExist:
            return Response({
                'code': 404,
                'message': '定时报表不存在',
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'删除定时报表失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshCacheView(APIView):
    """缓存刷新接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.data_service = DataAggregationService()
    
    @extend_schema(
        summary="刷新数据缓存",
        description="手动触发数据缓存刷新",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'cache_type': {
                        'type': 'string', 
                        'description': '缓存类型：dashboard/store_map/funnel/plan_progress，不传则刷新全部'
                    }
                }
            }
        },
        responses={200: "成功刷新缓存"}
    )
    def post(self, request):
        """刷新数据缓存"""
        try:
            cache_type = request.data.get('cache_type')
            
            # 验证缓存类型参数
            valid_cache_types = ['dashboard', 'store_map', 'funnel', 'plan_progress']
            if cache_type and cache_type not in valid_cache_types:
                return Response({
                    'code': 400,
                    'message': f'缓存类型参数错误，支持的值：{"/".join(valid_cache_types)}',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 执行缓存刷新
            self.data_service.refresh_cache(cache_type)
            
            return Response({
                'code': 0,
                'message': f'缓存刷新成功: {cache_type or "全部"}',
                'data': {
                    'cache_type': cache_type or 'all',
                    'refreshed_at': timezone.now().isoformat()
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'缓存刷新失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ROICalculationView(APIView):
    """投资回报率计算接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.roi_service = ROICalculationService()
    
    @extend_schema(
        summary="计算门店投资回报率",
        description="计算指定门店的投资回报率",
        parameters=[
            OpenApiParameter('store_id', OpenApiTypes.INT, description='门店ID', required=True),
            OpenApiParameter('period_months', OpenApiTypes.INT, description='计算周期（月），默认12个月'),
        ],
        responses={200: "成功返回ROI计算结果"}
    )
    def get(self, request):
        """计算门店投资回报率"""
        try:
            store_id = request.query_params.get('store_id')
            period_months = int(request.query_params.get('period_months', 12))
            
            if not store_id:
                return Response({
                    'code': 400,
                    'message': '门店ID不能为空',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                store_id = int(store_id)
            except ValueError:
                return Response({
                    'code': 400,
                    'message': '门店ID格式错误',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if period_months <= 0 or period_months > 60:
                return Response({
                    'code': 400,
                    'message': '计算周期必须在1-60个月之间',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_access_data_type('financial'):
                return Response({
                    'code': 403,
                    'message': '您没有权限查看财务数据',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 计算ROI
            roi_result = self.roi_service.calculate_store_roi(store_id, period_months)
            
            # 根据用户权限脱敏数据
            sanitized_result = permission_manager.sanitize_data(roi_result, 'financial')
            
            return Response({
                'code': 0,
                'message': '计算成功',
                'data': sanitized_result
            })
            
        except ValueError as e:
            return Response({
                'code': 404,
                'message': str(e),
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'ROI计算失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="批量计算门店投资回报率",
        description="批量计算多个门店的投资回报率",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'store_ids': {
                        'type': 'array',
                        'items': {'type': 'integer'},
                        'description': '门店ID列表'
                    },
                    'period_months': {
                        'type': 'integer',
                        'description': '计算周期（月），默认12个月'
                    }
                },
                'required': ['store_ids']
            }
        },
        responses={200: "成功返回批量ROI计算结果"}
    )
    def post(self, request):
        """批量计算门店投资回报率"""
        try:
            store_ids = request.data.get('store_ids', [])
            period_months = request.data.get('period_months', 12)
            
            if not store_ids:
                return Response({
                    'code': 400,
                    'message': '门店ID列表不能为空',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if len(store_ids) > 100:
                return Response({
                    'code': 400,
                    'message': '单次批量计算不能超过100个门店',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if period_months <= 0 or period_months > 60:
                return Response({
                    'code': 400,
                    'message': '计算周期必须在1-60个月之间',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_access_data_type('financial'):
                return Response({
                    'code': 403,
                    'message': '您没有权限查看财务数据',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 批量计算ROI
            roi_results = self.roi_service.calculate_batch_roi(store_ids, period_months)
            
            # 根据用户权限脱敏数据
            sanitized_results = []
            for result in roi_results:
                sanitized_result = permission_manager.sanitize_data(result, 'financial')
                sanitized_results.append(sanitized_result)
            
            # 统计结果
            success_count = sum(1 for r in roi_results if 'error' not in r)
            error_count = len(roi_results) - success_count
            
            return Response({
                'code': 0,
                'message': f'批量计算完成，成功{success_count}个，失败{error_count}个',
                'data': {
                    'results': sanitized_results,
                    'summary': {
                        'total_count': len(roi_results),
                        'success_count': success_count,
                        'error_count': error_count,
                        'period_months': period_months,
                    }
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'批量ROI计算失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ROIComparisonView(APIView):
    """ROI对比分析接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.roi_service = ROICalculationService()
    
    @extend_schema(
        summary="获取门店ROI对比分析",
        description="获取门店不同周期的ROI对比数据",
        parameters=[
            OpenApiParameter('store_id', OpenApiTypes.INT, description='门店ID', required=True),
            OpenApiParameter('periods', OpenApiTypes.STR, description='对比周期列表，用逗号分隔，如：3,6,12'),
        ],
        responses={200: "成功返回ROI对比数据"}
    )
    def get(self, request):
        """获取门店ROI对比分析"""
        try:
            store_id = request.query_params.get('store_id')
            periods_str = request.query_params.get('periods', '3,6,12')
            
            if not store_id:
                return Response({
                    'code': 400,
                    'message': '门店ID不能为空',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                store_id = int(store_id)
                periods = [int(p.strip()) for p in periods_str.split(',') if p.strip().isdigit()]
            except ValueError:
                return Response({
                    'code': 400,
                    'message': '参数格式错误',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not periods:
                periods = [3, 6, 12]  # 默认对比周期
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_access_data_type('financial'):
                return Response({
                    'code': 403,
                    'message': '您没有权限查看财务数据',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取ROI对比数据
            comparison_result = self.roi_service.get_roi_comparison(store_id, periods)
            
            # 根据用户权限脱敏数据
            sanitized_result = permission_manager.sanitize_data(comparison_result, 'financial')
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': sanitized_result
            })
            
        except ValueError as e:
            return Response({
                'code': 404,
                'message': str(e),
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取ROI对比数据失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ROITrendView(APIView):
    """ROI趋势分析接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        self.roi_service = ROICalculationService()
    
    @extend_schema(
        summary="获取门店ROI趋势分析",
        description="获取门店ROI的历史趋势数据",
        parameters=[
            OpenApiParameter('store_id', OpenApiTypes.INT, description='门店ID', required=True),
            OpenApiParameter('months', OpenApiTypes.INT, description='分析月数，默认12个月'),
        ],
        responses={200: "成功返回ROI趋势数据"}
    )
    def get(self, request):
        """获取门店ROI趋势分析"""
        try:
            store_id = request.query_params.get('store_id')
            months = int(request.query_params.get('months', 12))
            
            if not store_id:
                return Response({
                    'code': 400,
                    'message': '门店ID不能为空',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                store_id = int(store_id)
            except ValueError:
                return Response({
                    'code': 400,
                    'message': '门店ID格式错误',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if months <= 0 or months > 36:
                return Response({
                    'code': 400,
                    'message': '分析月数必须在1-36个月之间',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 检查用户权限
            permission_manager = AnalyticsPermissionManager(request.user)
            if not permission_manager.can_access_data_type('financial'):
                return Response({
                    'code': 403,
                    'message': '您没有权限查看财务数据',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取ROI趋势数据
            trend_result = self.roi_service.get_roi_trend(store_id, months)
            
            # 根据用户权限脱敏数据
            sanitized_result = permission_manager.sanitize_data(trend_result, 'financial')
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': sanitized_result
            })
            
        except ValueError as e:
            return Response({
                'code': 404,
                'message': str(e),
                'data': {}
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取ROI趋势数据失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    """系统健康状态接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        from .monitoring import SystemMonitoringService
        self.monitoring_service = SystemMonitoringService()
    
    @extend_schema(
        summary="获取系统健康状态",
        description="获取系统整体健康状态，包括各组件状态、性能指标和告警信息",
        parameters=[
            OpenApiParameter('component', OpenApiTypes.STR, description='指定组件：database, cache, system, data_tasks, reports'),
        ],
        responses={200: "成功返回系统健康状态"}
    )
    def get(self, request):
        """获取系统健康状态"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以查看系统健康状态',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            component = request.query_params.get('component')
            
            # 获取系统健康状态
            health_status = self.monitoring_service.get_system_health_status()
            
            # 如果指定了组件，只返回该组件的状态
            if component:
                component_status = health_status.get('components', {}).get(component)
                if not component_status:
                    return Response({
                        'code': 404,
                        'message': f'未找到组件: {component}',
                        'data': {}
                    }, status=status.HTTP_404_NOT_FOUND)
                
                return Response({
                    'code': 0,
                    'message': '获取成功',
                    'data': {
                        'component': component,
                        'status': component_status,
                        'timestamp': health_status.get('timestamp')
                    }
                })
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': health_status
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取系统健康状态失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PerformanceOptimizationView(APIView):
    """性能优化接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        from .monitoring import PerformanceOptimizationService
        self.optimization_service = PerformanceOptimizationService()
    
    @extend_schema(
        summary="执行性能优化",
        description="执行系统性能优化，包括数据库查询优化、缓存策略优化和数据预计算",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'optimization_type': {
                        'type': 'string',
                        'enum': ['database', 'cache', 'precomputation', 'all'],
                        'description': '优化类型'
                    },
                    'dry_run': {
                        'type': 'boolean',
                        'description': '是否仅分析不执行'
                    }
                }
            }
        },
        responses={200: "成功执行性能优化"}
    )
    def post(self, request):
        """执行性能优化"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以执行性能优化',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            optimization_type = request.data.get('optimization_type', 'all')
            dry_run = request.data.get('dry_run', False)
            
            results = {}
            
            if not dry_run:
                # 执行实际优化
                if optimization_type in ['all', 'database']:
                    results['database'] = self.optimization_service.optimize_database_queries()
                
                if optimization_type in ['all', 'cache']:
                    results['cache'] = self.optimization_service.optimize_cache_strategy()
                
                if optimization_type in ['all', 'precomputation']:
                    results['precomputation'] = self.optimization_service.implement_data_precomputation()
            else:
                # 仅分析，不执行
                results = {
                    'dry_run': True,
                    'analysis': {
                        'database': '将分析慢查询和缺失索引，清理过期数据',
                        'cache': '将清理过期缓存，预热热点数据',
                        'precomputation': '将预计算常用统计指标'
                    }
                }
            
            return Response({
                'code': 0,
                'message': '性能优化执行成功' if not dry_run else '性能优化分析完成',
                'data': {
                    'optimization_results': results,
                    'optimized_at': timezone.now().isoformat(),
                    'dry_run': dry_run
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'执行性能优化失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemMetricsView(APIView):
    """系统性能指标接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        from .monitoring import SystemMonitoringService
        self.monitoring_service = SystemMonitoringService()
    
    @extend_schema(
        summary="获取系统性能指标",
        description="获取系统性能指标，包括数据库、缓存、API和数据量统计",
        responses={200: "成功返回性能指标"}
    )
    def get(self, request):
        """获取系统性能指标"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以查看系统性能指标',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取系统健康状态（包含性能指标）
            health_status = self.monitoring_service.get_system_health_status()
            metrics = health_status.get('metrics', {})
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': {
                    'metrics': metrics,
                    'collected_at': health_status.get('timestamp')
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取系统性能指标失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemAlertsView(APIView):
    """系统告警接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        from .monitoring import SystemMonitoringService
        self.monitoring_service = SystemMonitoringService()
    
    @extend_schema(
        summary="获取系统告警信息",
        description="获取当前系统告警信息和历史告警统计",
        parameters=[
            OpenApiParameter('days', OpenApiTypes.INT, description='查询天数，默认7天'),
        ],
        responses={200: "成功返回告警信息"}
    )
    def get(self, request):
        """获取系统告警信息"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以查看系统告警',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            days = int(request.query_params.get('days', 7))
            
            # 获取当前告警
            health_status = self.monitoring_service.get_system_health_status()
            current_alerts = health_status.get('alerts', [])
            
            # 获取历史告警（从同步日志中提取）
            recent_time = timezone.now() - timedelta(days=days)
            alert_logs = DataSyncLog.objects.filter(
                sync_type='system_health_check',
                start_time__gte=recent_time,
                error_details__has_key='alerts'
            ).order_by('-start_time')
            
            historical_alerts = []
            for log in alert_logs:
                alerts = log.error_details.get('alerts', [])
                for alert in alerts:
                    alert['log_time'] = log.start_time.isoformat()
                    historical_alerts.append(alert)
            
            # 统计告警信息
            alert_stats = {
                'current_alerts_count': len(current_alerts),
                'historical_alerts_count': len(historical_alerts),
                'critical_alerts': len([a for a in current_alerts if a.get('level') == 'critical']),
                'warning_alerts': len([a for a in current_alerts if a.get('level') == 'warning']),
                'alert_types': {}
            }
            
            all_alerts = current_alerts + historical_alerts
            for alert in all_alerts:
                alert_type = alert.get('type', 'unknown')
                if alert_type not in alert_stats['alert_types']:
                    alert_stats['alert_types'][alert_type] = 0
                alert_stats['alert_types'][alert_type] += 1
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': {
                    'current_alerts': current_alerts,
                    'historical_alerts': historical_alerts[:50],  # 限制返回数量
                    'statistics': alert_stats,
                    'query_period_days': days
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取系统告警信息失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="发送告警通知",
        description="手动发送告警通知",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'alert_type': {'type': 'string', 'description': '告警类型'},
                    'level': {'type': 'string', 'enum': ['info', 'warning', 'critical'], 'description': '告警级别'},
                    'message': {'type': 'string', 'description': '告警消息'}
                },
                'required': ['alert_type', 'level', 'message']
            }
        },
        responses={200: "成功发送告警通知"}
    )
    def post(self, request):
        """发送告警通知"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以发送告警通知',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            alert_type = request.data.get('alert_type')
            level = request.data.get('level')
            message = request.data.get('message')
            
            if not all([alert_type, level, message]):
                return Response({
                    'code': 400,
                    'message': '告警类型、级别和消息不能为空',
                    'data': {}
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # 构建告警信息
            alert = {
                'type': alert_type,
                'level': level,
                'message': message,
                'timestamp': timezone.now().isoformat(),
                'manual': True,
                'created_by': request.user.username
            }
            
            # 发送告警通知
            success = self.monitoring_service.send_alert_notification(alert)
            
            return Response({
                'code': 0,
                'message': '告警通知发送成功' if success else '告警通知发送失败',
                'data': {
                    'alert': alert,
                    'sent': success
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'发送告警通知失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemHealthView(APIView):
    """系统健康状态接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        from .monitoring import SystemMonitoringService
        self.monitoring_service = SystemMonitoringService()
    
    @extend_schema(
        summary="获取系统健康状态",
        description="获取系统整体健康状态，包括各组件状态、性能指标和告警信息",
        parameters=[
            OpenApiParameter('component', OpenApiTypes.STR, description='指定组件：database, cache, system, data_tasks, reports'),
        ],
        responses={200: "成功返回系统健康状态"}
    )
    def get(self, request):
        """获取系统健康状态"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以查看系统健康状态',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            component = request.query_params.get('component')
            
            # 获取系统健康状态
            health_status = self.monitoring_service.get_system_health_status()
            
            # 如果指定了组件，只返回该组件的状态
            if component:
                component_status = health_status.get('components', {}).get(component)
                if not component_status:
                    return Response({
                        'code': 404,
                        'message': f'未找到组件: {component}',
                        'data': {}
                    }, status=status.HTTP_404_NOT_FOUND)
                
                return Response({
                    'code': 0,
                    'message': '获取成功',
                    'data': {
                        'component': component,
                        'status': component_status,
                        'timestamp': health_status.get('timestamp')
                    }
                })
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': health_status
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取系统健康状态失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PerformanceOptimizationView(APIView):
    """性能优化接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        from .monitoring import PerformanceOptimizationService
        self.optimization_service = PerformanceOptimizationService()
    
    @extend_schema(
        summary="执行性能优化",
        description="执行系统性能优化，包括数据库查询优化、缓存策略优化和数据预计算",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'optimization_type': {
                        'type': 'string',
                        'enum': ['database', 'cache', 'precomputation', 'all'],
                        'description': '优化类型'
                    },
                    'dry_run': {
                        'type': 'boolean',
                        'description': '是否仅分析不执行'
                    }
                }
            }
        },
        responses={200: "成功执行性能优化"}
    )
    def post(self, request):
        """执行性能优化"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以执行性能优化',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            optimization_type = request.data.get('optimization_type', 'all')
            dry_run = request.data.get('dry_run', False)
            
            results = {}
            
            if not dry_run:
                # 执行实际优化
                if optimization_type in ['all', 'database']:
                    results['database'] = self.optimization_service.optimize_database_queries()
                
                if optimization_type in ['all', 'cache']:
                    results['cache'] = self.optimization_service.optimize_cache_strategy()
                
                if optimization_type in ['all', 'precomputation']:
                    results['precomputation'] = self.optimization_service.implement_data_precomputation()
            else:
                # 仅分析，不执行
                results = {
                    'dry_run': True,
                    'analysis': {
                        'database': '将分析慢查询和缺失索引，清理过期数据',
                        'cache': '将清理过期缓存，预热热点数据',
                        'precomputation': '将预计算常用统计指标'
                    }
                }
            
            return Response({
                'code': 0,
                'message': '性能优化执行成功' if not dry_run else '性能优化分析完成',
                'data': {
                    'optimization_results': results,
                    'optimized_at': timezone.now().isoformat(),
                    'dry_run': dry_run
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'执行性能优化失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemMetricsView(APIView):
    """系统性能指标接口"""
    permission_classes = [IsAuthenticated]
    
    def __init__(self):
        super().__init__()
        from .monitoring import SystemMonitoringService
        self.monitoring_service = SystemMonitoringService()
    
    @extend_schema(
        summary="获取系统性能指标",
        description="获取系统性能指标，包括数据库、缓存、API和数据量统计",
        responses={200: "成功返回性能指标"}
    )
    def get(self, request):
        """获取系统性能指标"""
        try:
            # 检查用户权限
            if not request.user.is_staff:
                return Response({
                    'code': 403,
                    'message': '权限不足，只有管理员可以查看系统性能指标',
                    'data': {}
                }, status=status.HTTP_403_FORBIDDEN)
            
            # 获取系统健康状态（包含性能指标）
            health_status = self.monitoring_service.get_system_health_status()
            metrics = health_status.get('metrics', {})
            
            return Response({
                'code': 0,
                'message': '获取成功',
                'data': {
                    'metrics': metrics,
                    'collected_at': health_status.get('timestamp')
                }
            })
            
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取系统性能指标失败: {str(e)}',
                'data': {}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
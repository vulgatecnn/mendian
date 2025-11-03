"""
拓店管理模块视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction

from .models import CandidateLocation, FollowUpRecord, ProfitCalculation
from .serializers import (
    CandidateLocationSerializer,
    FollowUpRecordSerializer,
    FollowUpRecordListSerializer,
    ProfitCalculationSerializer,
    SurveyDataSerializer,
    ProfitCalculationRequestSerializer,
    ContractInfoSerializer,
    AbandonFollowUpSerializer,
)
from .services.profit_calculation_engine import ProfitCalculationEngine, FormulaConfigManager
from .services.warning_service import LowContributionWarningService


class CandidateLocationViewSet(viewsets.ModelViewSet):
    """
    候选点位管理视图集
    
    提供候选点位的 CRUD 操作
    """
    queryset = CandidateLocation.objects.select_related(
        'business_region',
        'created_by'
    ).all()
    serializer_class = CandidateLocationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'business_region', 'province', 'city', 'district']
    search_fields = ['name', 'address']
    ordering_fields = ['created_at', 'area', 'rent']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        """创建时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """删除前检查是否已关联跟进单"""
        instance = self.get_object()
        
        # 检查是否有关联的跟进单
        if instance.follow_up_records.exists():
            return Response(
                {
                    'code': 1001,
                    'message': '该点位已关联跟进单，无法删除',
                    'data': None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)


class FollowUpRecordViewSet(viewsets.ModelViewSet):
    """
    铺位跟进单管理视图集
    
    提供跟进单的 CRUD 操作和业务操作
    """
    queryset = FollowUpRecord.objects.select_related(
        'location',
        'location__business_region',
        'profit_calculation',
        'legal_entity',
        'created_by'
    ).all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'is_abandoned', 'location__business_region']
    search_fields = ['record_no', 'location__name', 'location__address']
    ordering_fields = ['created_at', 'survey_date', 'contract_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据操作返回不同的序列化器"""
        if self.action == 'list':
            return FollowUpRecordListSerializer
        return FollowUpRecordSerializer
    
    def perform_create(self, serializer):
        """创建时自动设置创建人"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='survey')
    def record_survey(self, request, pk=None):
        """
        录入调研信息
        
        POST /api/expansion/follow-ups/{id}/survey/
        """
        follow_up = self.get_object()
        serializer = SurveyDataSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'code': 1001,
                    'message': '参数错误',
                    'data': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 更新调研信息
        follow_up.survey_data = serializer.validated_data['survey_data']
        follow_up.survey_date = serializer.validated_data['survey_date']
        follow_up.status = FollowUpRecord.STATUS_CALCULATING
        follow_up.save()
        
        return Response({
            'code': 0,
            'message': '调研信息录入成功',
            'data': FollowUpRecordSerializer(follow_up).data
        })
    
    @action(detail=True, methods=['post'], url_path='calculate')
    def calculate_profit(self, request, pk=None):
        """
        执行盈利测算
        
        POST /api/expansion/follow-ups/{id}/calculate/
        """
        follow_up = self.get_object()
        serializer = ProfitCalculationRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'code': 1001,
                    'message': '参数错误',
                    'data': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # 获取当前公式配置
                formula_config = FormulaConfigManager.get_current_config()
                
                # 创建计算引擎
                engine = ProfitCalculationEngine(formula_config)
                
                # 执行计算
                calculation = engine.calculate(
                    serializer.validated_data['business_terms'],
                    serializer.validated_data['sales_forecast']
                )
                
                # 保存计算结果
                calculation.save()
                
                # 更新跟进单
                follow_up.business_terms = serializer.validated_data['business_terms']
                follow_up.profit_calculation = calculation
                follow_up.save()
                
                return Response({
                    'code': 0,
                    'message': '盈利测算完成',
                    'data': {
                        'follow_up': FollowUpRecordSerializer(follow_up).data,
                        'calculation': ProfitCalculationSerializer(calculation).data
                    }
                })
        
        except Exception as e:
            return Response(
                {
                    'code': 1000,
                    'message': f'盈利测算失败：{str(e)}',
                    'data': None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], url_path='contract')
    def record_contract(self, request, pk=None):
        """
        录入签约信息
        
        POST /api/expansion/follow-ups/{id}/contract/
        """
        follow_up = self.get_object()
        serializer = ContractInfoSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'code': 1001,
                    'message': '参数错误',
                    'data': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 更新签约信息
        follow_up.contract_info = serializer.validated_data['contract_info']
        follow_up.contract_date = serializer.validated_data['contract_date']
        follow_up.contract_reminders = serializer.validated_data.get('contract_reminders', [])
        
        if serializer.validated_data.get('legal_entity'):
            follow_up.legal_entity_id = serializer.validated_data['legal_entity']
        
        follow_up.status = FollowUpRecord.STATUS_SIGNED
        follow_up.save()
        
        # 更新候选点位状态
        follow_up.location.status = CandidateLocation.STATUS_SIGNED
        follow_up.location.save()
        
        return Response({
            'code': 0,
            'message': '签约信息录入成功',
            'data': FollowUpRecordSerializer(follow_up).data
        })
    
    @action(detail=True, methods=['post'], url_path='abandon')
    def abandon_follow_up(self, request, pk=None):
        """
        标记放弃跟进
        
        POST /api/expansion/follow-ups/{id}/abandon/
        """
        follow_up = self.get_object()
        serializer = AbandonFollowUpSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {
                    'code': 1001,
                    'message': '参数错误',
                    'data': serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 标记为放弃
        from django.utils import timezone
        follow_up.is_abandoned = True
        follow_up.abandon_reason = serializer.validated_data['abandon_reason']
        follow_up.abandon_date = timezone.now().date()
        follow_up.status = FollowUpRecord.STATUS_ABANDONED
        follow_up.save()
        
        # 更新候选点位状态
        follow_up.location.status = CandidateLocation.STATUS_ABANDONED
        follow_up.location.save()
        
        return Response({
            'code': 0,
            'message': '已标记为放弃跟进',
            'data': FollowUpRecordSerializer(follow_up).data
        })
    
    @action(detail=True, methods=['post'], url_path='submit-approval')
    def submit_approval(self, request, pk=None):
        """
        发起报店审批
        
        POST /api/expansion/follow-ups/{id}/submit-approval/
        """
        follow_up = self.get_object()
        
        # 检查是否已完成盈利测算
        if not follow_up.profit_calculation:
            return Response(
                {
                    'code': 1001,
                    'message': '请先完成盈利测算',
                    'data': None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 检查低贡献率预警
        warning_service = LowContributionWarningService()
        warning_result = warning_service.check_warning(
            follow_up.location.business_region_id,
            follow_up.profit_calculation.contribution_rate
        )
        
        # TODO: 集成审批中心模块，创建审批实例
        # 目前只返回预警信息
        
        return Response({
            'code': 0,
            'message': '报店审批发起成功',
            'data': {
                'follow_up': FollowUpRecordSerializer(follow_up).data,
                'warning': warning_result
            }
        })


class ProfitFormulaViewSet(viewsets.ViewSet):
    """
    盈利测算公式配置视图集
    """
    
    def list(self, request):
        """
        获取当前公式配置
        
        GET /api/expansion/profit-formulas/
        """
        config = FormulaConfigManager.get_current_config()
        return Response({
            'code': 0,
            'message': '获取成功',
            'data': config
        })
    
    def update(self, request, pk=None):
        """
        更新公式配置
        
        PUT /api/expansion/profit-formulas/current/
        """
        config = request.data
        
        # 验证配置
        if not ProfitCalculationEngine.validate_config(config):
            return Response(
                {
                    'code': 1001,
                    'message': '公式配置格式错误',
                    'data': None
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 更新配置
        success = FormulaConfigManager.update_config(config)
        
        if success:
            return Response({
                'code': 0,
                'message': '公式配置更新成功',
                'data': config
            })
        else:
            return Response(
                {
                    'code': 1000,
                    'message': '公式配置更新失败',
                    'data': None
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='reset')
    def reset(self, request):
        """
        重置为默认配置
        
        POST /api/expansion/profit-formulas/reset/
        """
        config = FormulaConfigManager.reset_to_default()
        return Response({
            'code': 0,
            'message': '已重置为默认配置',
            'data': config
        })

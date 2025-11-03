"""
审批台账导出服务
"""
import io
import xlsxwriter
from datetime import datetime
from django.http import HttpResponse
from django.db.models import Q

from ..models import ApprovalInstance, ApprovalTemplate


class ApprovalExportService:
    """审批台账导出服务"""
    
    def __init__(self):
        """初始化导出服务"""
        pass
    
    def export_approval_ledger(self, template_id=None, start_date=None, end_date=None, 
                              status=None, business_type=None, user=None):
        """
        导出审批台账
        
        Args:
            template_id: 审批模板ID（可选）
            start_date: 开始日期（可选）
            end_date: 结束日期（可选）
            status: 审批状态（可选）
            business_type: 业务类型（可选）
            user: 当前用户（用于权限过滤）
            
        Returns:
            HttpResponse: Excel文件响应
        """
        # 构建查询条件
        queryset = ApprovalInstance.objects.all()
        
        # 根据用户权限过滤数据
        if user and not user.is_superuser:
            queryset = queryset.filter(
                Q(initiator=user) |  # 自己发起的
                Q(nodes__approvers__user=user) |  # 自己需要审批的
                Q(nodes__cc_users__user=user) |  # 抄送给自己的
                Q(follows__user=user)  # 自己关注的
            ).distinct()
        
        # 应用过滤条件
        if template_id:
            queryset = queryset.filter(template_id=template_id)
        
        if start_date:
            queryset = queryset.filter(initiated_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(initiated_at__lte=end_date)
        
        if status:
            queryset = queryset.filter(status=status)
        
        if business_type:
            queryset = queryset.filter(business_type=business_type)
        
        # 排序
        queryset = queryset.order_by('-initiated_at')
        
        # 预加载相关数据
        queryset = queryset.select_related(
            'template', 'initiator', 'current_node'
        ).prefetch_related('nodes', 'nodes__approvers__user')
        
        # 创建Excel文件
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        
        # 创建工作表
        worksheet = self._create_worksheet(workbook, queryset)
        
        # 关闭工作簿
        workbook.close()
        output.seek(0)
        
        # 生成文件名
        filename = self._generate_filename(template_id)
        
        # 创建HTTP响应
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    
    def _create_worksheet(self, workbook, queryset):
        """创建工作表"""
        worksheet = workbook.add_worksheet('审批台账')
        
        # 定义样式
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#D7E4BC',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        cell_format = workbook.add_format({
            'border': 1,
            'align': 'left',
            'valign': 'vcenter',
            'text_wrap': True
        })
        
        date_format = workbook.add_format({
            'border': 1,
            'align': 'center',
            'valign': 'vcenter',
            'num_format': 'yyyy-mm-dd hh:mm:ss'
        })
        
        # 定义列标题
        headers = [
            '审批单号', '审批标题', '审批模板', '业务类型', '发起人',
            '发起时间', '当前节点', '审批状态', '完成时间', '最终结果',
            '审批历程'
        ]
        
        # 写入标题行
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        # 设置列宽
        column_widths = [15, 30, 15, 12, 12, 20, 15, 10, 20, 10, 40]
        for col, width in enumerate(column_widths):
            worksheet.set_column(col, col, width)
        
        # 写入数据行
        row = 1
        for instance in queryset:
            # 获取审批历程
            approval_history = self._get_approval_history(instance)
            
            worksheet.write(row, 0, instance.instance_no, cell_format)
            worksheet.write(row, 1, instance.title, cell_format)
            worksheet.write(row, 2, instance.template.template_name, cell_format)
            worksheet.write(row, 3, instance.business_type, cell_format)
            worksheet.write(row, 4, instance.initiator.real_name or instance.initiator.username, cell_format)
            worksheet.write(row, 5, instance.initiated_at, date_format)
            worksheet.write(row, 6, instance.current_node.node_name if instance.current_node else '已完成', cell_format)
            worksheet.write(row, 7, self._get_status_display(instance.status), cell_format)
            worksheet.write(row, 8, instance.completed_at or '', date_format if instance.completed_at else cell_format)
            worksheet.write(row, 9, self._get_result_display(instance.final_result), cell_format)
            worksheet.write(row, 10, approval_history, cell_format)
            
            row += 1
        
        return worksheet
    
    def _get_approval_history(self, instance):
        """获取审批历程"""
        history_items = []
        
        for node in instance.nodes.all():
            if node.status in ['approved', 'rejected']:
                approver_name = node.approved_by.real_name or node.approved_by.username if node.approved_by else '未知'
                approved_time = node.approved_at.strftime('%Y-%m-%d %H:%M') if node.approved_at else ''
                result = '通过' if node.approval_result == 'approved' else '拒绝'
                comment = f"（{node.approval_comment}）" if node.approval_comment else ''
                
                history_items.append(f"{node.node_name}: {approver_name} {result} {approved_time} {comment}")
        
        return '\n'.join(history_items)
    
    def _get_status_display(self, status):
        """获取状态显示名称"""
        status_map = {
            'pending': '待审批',
            'in_progress': '审批中',
            'approved': '已通过',
            'rejected': '已拒绝',
            'withdrawn': '已撤销',
        }
        return status_map.get(status, status)
    
    def _get_result_display(self, result):
        """获取结果显示名称"""
        if not result:
            return ''
        
        result_map = {
            'approved': '通过',
            'rejected': '拒绝',
            'withdrawn': '撤销',
        }
        return result_map.get(result, result)
    
    def _generate_filename(self, template_id=None):
        """生成文件名"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if template_id:
            try:
                template = ApprovalTemplate.objects.get(id=template_id)
                template_name = template.template_name
                return f"审批台账_{template_name}_{timestamp}.xlsx"
            except ApprovalTemplate.DoesNotExist:
                pass
        
        return f"审批台账_{timestamp}.xlsx"
    
    def export_template_statistics(self, user=None):
        """
        导出审批模板统计
        
        Args:
            user: 当前用户（用于权限过滤）
            
        Returns:
            HttpResponse: Excel文件响应
        """
        # 获取所有模板
        templates = ApprovalTemplate.objects.all()
        
        # 创建Excel文件
        output = io.BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})
        worksheet = workbook.add_worksheet('审批模板统计')
        
        # 定义样式
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#D7E4BC',
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        cell_format = workbook.add_format({
            'border': 1,
            'align': 'center',
            'valign': 'vcenter'
        })
        
        # 定义列标题
        headers = [
            '模板编码', '模板名称', '状态', '总申请数', '待审批数',
            '审批中数', '已通过数', '已拒绝数', '已撤销数'
        ]
        
        # 写入标题行
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        # 设置列宽
        for col in range(len(headers)):
            worksheet.set_column(col, col, 15)
        
        # 写入数据行
        row = 1
        for template in templates:
            # 统计各状态的审批数量
            instances = ApprovalInstance.objects.filter(template=template)
            
            # 根据用户权限过滤
            if user and not user.is_superuser:
                instances = instances.filter(
                    Q(initiator=user) |
                    Q(nodes__approvers__user=user) |
                    Q(nodes__cc_users__user=user) |
                    Q(follows__user=user)
                ).distinct()
            
            total_count = instances.count()
            pending_count = instances.filter(status='pending').count()
            in_progress_count = instances.filter(status='in_progress').count()
            approved_count = instances.filter(status='approved').count()
            rejected_count = instances.filter(status='rejected').count()
            withdrawn_count = instances.filter(status='withdrawn').count()
            
            worksheet.write(row, 0, template.template_code, cell_format)
            worksheet.write(row, 1, template.template_name, cell_format)
            worksheet.write(row, 2, '启用' if template.status == 'active' else '停用', cell_format)
            worksheet.write(row, 3, total_count, cell_format)
            worksheet.write(row, 4, pending_count, cell_format)
            worksheet.write(row, 5, in_progress_count, cell_format)
            worksheet.write(row, 6, approved_count, cell_format)
            worksheet.write(row, 7, rejected_count, cell_format)
            worksheet.write(row, 8, withdrawn_count, cell_format)
            
            row += 1
        
        # 关闭工作簿
        workbook.close()
        output.seek(0)
        
        # 生成文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"审批模板统计_{timestamp}.xlsx"
        
        # 创建HTTP响应
        response = HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
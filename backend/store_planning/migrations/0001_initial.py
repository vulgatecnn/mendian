# Generated manually for store_planning

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='BusinessRegion',
            fields=[
                ('id', models.BigAutoField(primary_key=True, verbose_name='区域ID')),
                ('name', models.CharField(max_length=100, verbose_name='区域名称')),
                ('code', models.CharField(max_length=20, unique=True, verbose_name='区域编码')),
                ('description', models.TextField(blank=True, verbose_name='区域描述')),
                ('is_active', models.BooleanField(default=True, verbose_name='启用状态')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
            ],
            options={
                'verbose_name': '经营区域',
                'verbose_name_plural': '经营区域',
                'db_table': 'business_regions',
                'ordering': ['code'],
            },
        ),
        migrations.CreateModel(
            name='StoreType',
            fields=[
                ('id', models.BigAutoField(primary_key=True, verbose_name='门店类型ID')),
                ('name', models.CharField(max_length=50, verbose_name='类型名称')),
                ('code', models.CharField(max_length=20, unique=True, verbose_name='类型编码')),
                ('description', models.TextField(blank=True, verbose_name='类型描述')),
                ('is_active', models.BooleanField(default=True, verbose_name='启用状态')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
            ],
            options={
                'verbose_name': '门店类型',
                'verbose_name_plural': '门店类型',
                'db_table': 'store_types',
                'ordering': ['code'],
            },
        ),
        migrations.CreateModel(
            name='StorePlan',
            fields=[
                ('id', models.BigAutoField(primary_key=True, verbose_name='计划ID')),
                ('name', models.CharField(max_length=200, verbose_name='计划名称')),
                ('plan_type', models.CharField(
                    choices=[('annual', '年度计划'), ('quarterly', '季度计划')],
                    max_length=20,
                    verbose_name='计划类型'
                )),
                ('status', models.CharField(
                    choices=[
                        ('draft', '草稿'),
                        ('published', '已发布'),
                        ('executing', '执行中'),
                        ('completed', '已完成'),
                        ('cancelled', '已取消')
                    ],
                    default='draft',
                    max_length=20,
                    verbose_name='计划状态'
                )),
                ('start_date', models.DateField(verbose_name='开始日期')),
                ('end_date', models.DateField(verbose_name='结束日期')),
                ('description', models.TextField(blank=True, verbose_name='计划描述')),
                ('total_target_count', models.PositiveIntegerField(default=0, verbose_name='总目标数量')),
                ('total_completed_count', models.PositiveIntegerField(default=0, verbose_name='总完成数量')),
                ('total_budget_amount', models.DecimalField(
                    decimal_places=2,
                    default=Decimal('0.00'),
                    max_digits=15,
                    validators=[MinValueValidator(Decimal('0.00'))],
                    verbose_name='总预算金额'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('published_at', models.DateTimeField(blank=True, null=True, verbose_name='发布时间')),
                ('cancelled_at', models.DateTimeField(blank=True, null=True, verbose_name='取消时间')),
                ('cancel_reason', models.TextField(blank=True, verbose_name='取消原因')),
                ('created_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='created_plans',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='创建人'
                )),
            ],
            options={
                'verbose_name': '开店计划',
                'verbose_name_plural': '开店计划',
                'db_table': 'store_plans',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='RegionalPlan',
            fields=[
                ('id', models.BigAutoField(primary_key=True, verbose_name='区域计划ID')),
                ('target_count', models.PositiveIntegerField(
                    validators=[MinValueValidator(1)],
                    verbose_name='目标数量'
                )),
                ('completed_count', models.PositiveIntegerField(
                    default=0,
                    validators=[MinValueValidator(0)],
                    verbose_name='完成数量'
                )),
                ('contribution_rate', models.DecimalField(
                    blank=True,
                    decimal_places=2,
                    max_digits=5,
                    null=True,
                    validators=[
                        MinValueValidator(Decimal('0.00')),
                        MaxValueValidator(Decimal('100.00'))
                    ],
                    verbose_name='贡献率(%)'
                )),
                ('budget_amount', models.DecimalField(
                    decimal_places=2,
                    default=Decimal('0.00'),
                    max_digits=15,
                    validators=[MinValueValidator(Decimal('0.00'))],
                    verbose_name='预算金额'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('plan', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='regional_plans',
                    to='store_planning.storeplan',
                    verbose_name='所属计划'
                )),
                ('region', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    to='store_planning.businessregion',
                    verbose_name='经营区域'
                )),
                ('store_type', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    to='store_planning.storetype',
                    verbose_name='门店类型'
                )),
            ],
            options={
                'verbose_name': '区域计划',
                'verbose_name_plural': '区域计划',
                'db_table': 'regional_plans',
                'ordering': ['plan', 'region__code', 'store_type__code'],
            },
        ),
        migrations.CreateModel(
            name='PlanExecutionLog',
            fields=[
                ('id', models.BigAutoField(primary_key=True, verbose_name='记录ID')),
                ('store_id', models.PositiveIntegerField(blank=True, null=True, verbose_name='门店ID')),
                ('action_type', models.CharField(
                    choices=[
                        ('store_opened', '门店开业'),
                        ('store_closed', '门店关闭'),
                        ('plan_created', '计划创建'),
                        ('plan_updated', '计划更新'),
                        ('plan_published', '计划发布'),
                        ('plan_cancelled', '计划取消'),
                        ('progress_updated', '进度更新')
                    ],
                    max_length=50,
                    verbose_name='操作类型'
                )),
                ('action_description', models.TextField(verbose_name='操作描述')),
                ('previous_count', models.PositiveIntegerField(blank=True, null=True, verbose_name='变更前数量')),
                ('current_count', models.PositiveIntegerField(blank=True, null=True, verbose_name='变更后数量')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='操作人'
                )),
                ('plan', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='execution_logs',
                    to='store_planning.storeplan',
                    verbose_name='所属计划'
                )),
                ('regional_plan', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='execution_logs',
                    to='store_planning.regionalplan',
                    verbose_name='区域计划'
                )),
            ],
            options={
                'verbose_name': '计划执行记录',
                'verbose_name_plural': '计划执行记录',
                'db_table': 'plan_execution_logs',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='PlanApproval',
            fields=[
                ('id', models.BigAutoField(primary_key=True, verbose_name='审批ID')),
                ('approval_type', models.CharField(
                    choices=[
                        ('plan_publish', '计划发布审批'),
                        ('plan_cancel', '计划取消审批'),
                        ('plan_modify', '计划修改审批')
                    ],
                    max_length=50,
                    verbose_name='审批类型'
                )),
                ('status', models.CharField(
                    choices=[
                        ('pending', '待审批'),
                        ('approved', '已通过'),
                        ('rejected', '已拒绝'),
                        ('cancelled', '已取消')
                    ],
                    default='pending',
                    max_length=20,
                    verbose_name='审批状态'
                )),
                ('submitted_at', models.DateTimeField(auto_now_add=True, verbose_name='提交时间')),
                ('approved_at', models.DateTimeField(blank=True, null=True, verbose_name='审批时间')),
                ('rejection_reason', models.TextField(blank=True, verbose_name='拒绝原因')),
                ('approval_notes', models.TextField(blank=True, verbose_name='审批备注')),
                ('approved_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='approved_approvals',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='审批人'
                )),
                ('plan', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='approvals',
                    to='store_planning.storeplan',
                    verbose_name='所属计划'
                )),
                ('submitted_by', models.ForeignKey(
                    on_delete=django.db.models.deletion.PROTECT,
                    related_name='submitted_approvals',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='提交人'
                )),
            ],
            options={
                'verbose_name': '计划审批记录',
                'verbose_name_plural': '计划审批记录',
                'db_table': 'plan_approvals',
                'ordering': ['-submitted_at'],
            },
        ),
        # 添加索引
        migrations.AddIndex(
            model_name='businessregion',
            index=models.Index(fields=['code'], name='idx_region_code'),
        ),
        migrations.AddIndex(
            model_name='businessregion',
            index=models.Index(fields=['is_active'], name='idx_region_active'),
        ),
        migrations.AddIndex(
            model_name='storetype',
            index=models.Index(fields=['code'], name='idx_store_type_code'),
        ),
        migrations.AddIndex(
            model_name='storetype',
            index=models.Index(fields=['is_active'], name='idx_store_type_active'),
        ),
        migrations.AddIndex(
            model_name='storeplan',
            index=models.Index(fields=['status'], name='idx_plan_status'),
        ),
        migrations.AddIndex(
            model_name='storeplan',
            index=models.Index(fields=['start_date', 'end_date'], name='idx_plan_dates'),
        ),
        migrations.AddIndex(
            model_name='storeplan',
            index=models.Index(fields=['created_by'], name='idx_plan_created_by'),
        ),
        migrations.AddIndex(
            model_name='storeplan',
            index=models.Index(fields=['plan_type'], name='idx_plan_type'),
        ),
        migrations.AddIndex(
            model_name='storeplan',
            index=models.Index(fields=['created_at'], name='idx_plan_created_at'),
        ),
        migrations.AddIndex(
            model_name='regionalplan',
            index=models.Index(fields=['plan'], name='idx_regional_plan_plan'),
        ),
        migrations.AddIndex(
            model_name='regionalplan',
            index=models.Index(fields=['region'], name='idx_regional_plan_region'),
        ),
        migrations.AddIndex(
            model_name='regionalplan',
            index=models.Index(fields=['store_type'], name='idx_regional_plan_store_type'),
        ),
        migrations.AddIndex(
            model_name='planexecutionlog',
            index=models.Index(fields=['plan'], name='idx_execution_log_plan'),
        ),
        migrations.AddIndex(
            model_name='planexecutionlog',
            index=models.Index(fields=['regional_plan'], name='idx_execution_log_regional'),
        ),
        migrations.AddIndex(
            model_name='planexecutionlog',
            index=models.Index(fields=['action_type'], name='idx_execution_log_action'),
        ),
        migrations.AddIndex(
            model_name='planexecutionlog',
            index=models.Index(fields=['created_at'], name='idx_execution_log_date'),
        ),
        migrations.AddIndex(
            model_name='planexecutionlog',
            index=models.Index(fields=['store_id'], name='idx_execution_log_store'),
        ),
        migrations.AddIndex(
            model_name='planapproval',
            index=models.Index(fields=['plan'], name='idx_approval_plan'),
        ),
        migrations.AddIndex(
            model_name='planapproval',
            index=models.Index(fields=['status'], name='idx_approval_status'),
        ),
        migrations.AddIndex(
            model_name='planapproval',
            index=models.Index(fields=['approval_type'], name='idx_approval_type'),
        ),
        migrations.AddIndex(
            model_name='planapproval',
            index=models.Index(fields=['submitted_at'], name='idx_approval_submitted'),
        ),
        # 添加约束
        migrations.AddConstraint(
            model_name='storeplan',
            constraint=models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='valid_date_range'
            ),
        ),
        migrations.AddConstraint(
            model_name='storeplan',
            constraint=models.CheckConstraint(
                check=models.Q(total_target_count__gte=0),
                name='valid_target_count'
            ),
        ),
        migrations.AddConstraint(
            model_name='storeplan',
            constraint=models.CheckConstraint(
                check=models.Q(total_completed_count__gte=0),
                name='valid_completed_count'
            ),
        ),
        migrations.AddConstraint(
            model_name='regionalplan',
            constraint=models.UniqueConstraint(
                fields=['plan', 'region', 'store_type'],
                name='unique_plan_region_store_type'
            ),
        ),
        migrations.AddConstraint(
            model_name='regionalplan',
            constraint=models.CheckConstraint(
                check=models.Q(target_count__gt=0),
                name='valid_regional_target_count'
            ),
        ),
        migrations.AddConstraint(
            model_name='regionalplan',
            constraint=models.CheckConstraint(
                check=models.Q(completed_count__gte=0),
                name='valid_regional_completed_count'
            ),
        ),
        migrations.AddConstraint(
            model_name='planapproval',
            constraint=models.UniqueConstraint(
                fields=['plan', 'approval_type'],
                condition=models.Q(status='pending'),
                name='unique_pending_approval'
            ),
        ),
    ]
"""
创建性能优化索引的脚本

使用方法：
python manage.py shell < create_performance_indexes.py
"""

from django.db import connection

# 定义需要创建的索引
INDEXES = [
    # 拓店管理模块
    {
        'table': 'candidate_location',
        'name': 'idx_candidate_location_region_status',
        'columns': ['business_region_id', 'status']
    },
    {
        'table': 'candidate_location',
        'name': 'idx_candidate_location_created_at',
        'columns': ['created_at']
    },
    {
        'table': 'follow_up_record',
        'name': 'idx_follow_up_location_status',
        'columns': ['location_id', 'status']
    },
    {
        'table': 'follow_up_record',
        'name': 'idx_follow_up_priority_status',
        'columns': ['priority', 'status']
    },
    {
        'table': 'follow_up_record',
        'name': 'idx_follow_up_created_by',
        'columns': ['created_by_id']
    },
    {
        'table': 'follow_up_record',
        'name': 'idx_follow_up_created_at',
        'columns': ['created_at']
    },
    {
        'table': 'profit_calculation',
        'name': 'idx_profit_calc_roi',
        'columns': ['roi']
    },
    {
        'table': 'profit_calculation',
        'name': 'idx_profit_calc_contribution',
        'columns': ['contribution_rate']
    },
    
    # 开店筹备模块
    {
        'table': 'construction_order',
        'name': 'idx_construction_follow_up',
        'columns': ['follow_up_record_id']
    },
    {
        'table': 'construction_order',
        'name': 'idx_construction_supplier_status',
        'columns': ['supplier_id', 'status']
    },
    {
        'table': 'construction_order',
        'name': 'idx_construction_created_at',
        'columns': ['created_at']
    },
    {
        'table': 'construction_milestone',
        'name': 'idx_milestone_order_date',
        'columns': ['construction_order_id', 'planned_date']
    },
    {
        'table': 'construction_milestone',
        'name': 'idx_milestone_status',
        'columns': ['status']
    },
    {
        'table': 'delivery_checklist',
        'name': 'idx_delivery_construction',
        'columns': ['construction_order_id']
    },
    {
        'table': 'delivery_checklist',
        'name': 'idx_delivery_status',
        'columns': ['status']
    },
    
    # 门店档案模块
    {
        'table': 'store_profile',
        'name': 'idx_store_code',
        'columns': ['store_code']
    },
    {
        'table': 'store_profile',
        'name': 'idx_store_region_status',
        'columns': ['business_region_id', 'status']
    },
    {
        'table': 'store_profile',
        'name': 'idx_store_opening_date',
        'columns': ['opening_date']
    },
    {
        'table': 'store_profile',
        'name': 'idx_store_created_at',
        'columns': ['created_at']
    },
    
    # 审批中心模块
    {
        'table': 'approval_instance',
        'name': 'idx_approval_template_status',
        'columns': ['template_id', 'status']
    },
    {
        'table': 'approval_instance',
        'name': 'idx_approval_initiator',
        'columns': ['initiator_id']
    },
    {
        'table': 'approval_instance',
        'name': 'idx_approval_business',
        'columns': ['business_type', 'business_id']
    },
    {
        'table': 'approval_instance',
        'name': 'idx_approval_initiated_at',
        'columns': ['initiated_at']
    },
    {
        'table': 'approval_node',
        'name': 'idx_approval_node_instance',
        'columns': ['instance_id', 'sequence']
    },
    {
        'table': 'approval_node',
        'name': 'idx_approval_node_status',
        'columns': ['status']
    },
    
    # 基础数据模块
    {
        'table': 'business_region',
        'name': 'idx_region_code',
        'columns': ['code']
    },
    {
        'table': 'business_region',
        'name': 'idx_region_active',
        'columns': ['is_active']
    },
    {
        'table': 'supplier',
        'name': 'idx_supplier_code',
        'columns': ['code']
    },
    {
        'table': 'supplier',
        'name': 'idx_supplier_status',
        'columns': ['cooperation_status']
    },
    {
        'table': 'legal_entity',
        'name': 'idx_entity_code',
        'columns': ['code']
    },
    {
        'table': 'legal_entity',
        'name': 'idx_entity_credit_code',
        'columns': ['unified_social_credit_code']
    },
    {
        'table': 'legal_entity',
        'name': 'idx_entity_status',
        'columns': ['operation_status']
    },
    {
        'table': 'customer',
        'name': 'idx_customer_code',
        'columns': ['code']
    },
    {
        'table': 'customer',
        'name': 'idx_customer_status',
        'columns': ['cooperation_status']
    },
    
    # 系统管理模块
    {
        'table': 'department',
        'name': 'idx_dept_wechat_id',
        'columns': ['wechat_dept_id']
    },
    {
        'table': 'department',
        'name': 'idx_dept_parent',
        'columns': ['parent_id']
    },
    {
        'table': 'department',
        'name': 'idx_dept_active',
        'columns': ['is_active']
    },
    {
        'table': 'auth_user',  # Django User 表
        'name': 'idx_user_phone',
        'columns': ['phone']
    },
    {
        'table': 'auth_user',
        'name': 'idx_user_wechat_id',
        'columns': ['wechat_user_id']
    },
    {
        'table': 'auth_user',
        'name': 'idx_user_department',
        'columns': ['department_id']
    },
    {
        'table': 'auth_user',
        'name': 'idx_user_active',
        'columns': ['is_active']
    },
    {
        'table': 'role',
        'name': 'idx_role_code',
        'columns': ['code']
    },
    {
        'table': 'role',
        'name': 'idx_role_active',
        'columns': ['is_active']
    },
    
    # 消息通知模块
    {
        'table': 'message',
        'name': 'idx_message_recipient_read',
        'columns': ['recipient_id', 'is_read']
    },
    {
        'table': 'message',
        'name': 'idx_message_type',
        'columns': ['message_type']
    },
    {
        'table': 'message',
        'name': 'idx_message_created_at',
        'columns': ['created_at']
    },
    
    # 操作日志模块
    {
        'table': 'operation_log',
        'name': 'idx_log_user_type',
        'columns': ['user_id', 'operation_type']
    },
    {
        'table': 'operation_log',
        'name': 'idx_log_content_type',
        'columns': ['content_type_id', 'object_id']
    },
    {
        'table': 'operation_log',
        'name': 'idx_log_created_at',
        'columns': ['created_at']
    },
]


def create_index(cursor, index_info):
    """创建单个索引"""
    table = index_info['table']
    name = index_info['name']
    columns = ', '.join(index_info['columns'])
    
    # 检查索引是否已存在
    cursor.execute(f"""
        SELECT 1 FROM pg_indexes 
        WHERE indexname = '{name}'
    """)
    
    if cursor.fetchone():
        print(f"索引 {name} 已存在，跳过")
        return
    
    # 创建索引
    sql = f"CREATE INDEX {name} ON {table} ({columns})"
    
    try:
        cursor.execute(sql)
        print(f"✓ 创建索引: {name}")
    except Exception as e:
        print(f"✗ 创建索引失败 {name}: {str(e)}")


def main():
    """主函数"""
    print("开始创建性能优化索引...")
    print(f"共需创建 {len(INDEXES)} 个索引\n")
    
    with connection.cursor() as cursor:
        success_count = 0
        skip_count = 0
        fail_count = 0
        
        for index_info in INDEXES:
            try:
                create_index(cursor, index_info)
                success_count += 1
            except Exception as e:
                if "已存在" in str(e):
                    skip_count += 1
                else:
                    fail_count += 1
                    print(f"错误: {str(e)}")
    
    print(f"\n索引创建完成!")
    print(f"成功: {success_count}, 跳过: {skip_count}, 失败: {fail_count}")


if __name__ == '__main__':
    main()

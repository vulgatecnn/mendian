"""
基础数据管理 Admin 配置
"""
from django.contrib import admin
from .models import BusinessRegion, Supplier, LegalEntity, Customer, Budget


@admin.register(BusinessRegion)
class BusinessRegionAdmin(admin.ModelAdmin):
    """业务大区管理"""
    list_display = ['code', 'name', 'manager', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code']
    ordering = ['code']
    readonly_fields = ['created_by', 'created_at', 'updated_at']


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    """供应商管理"""
    list_display = ['code', 'name', 'supplier_type', 'status', 'contact_person', 'created_at']
    list_filter = ['supplier_type', 'status', 'created_at']
    search_fields = ['name', 'code', 'contact_person']
    ordering = ['code']
    readonly_fields = ['created_by', 'created_at', 'updated_at']


@admin.register(LegalEntity)
class LegalEntityAdmin(admin.ModelAdmin):
    """法人主体管理"""
    list_display = ['code', 'name', 'credit_code', 'legal_representative', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'code', 'credit_code', 'legal_representative']
    ordering = ['code']
    readonly_fields = ['created_by', 'created_at', 'updated_at']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    """客户管理"""
    list_display = ['code', 'name', 'customer_type', 'status', 'contact_person', 'created_at']
    list_filter = ['customer_type', 'status', 'created_at']
    search_fields = ['name', 'code', 'contact_person']
    ordering = ['code']
    readonly_fields = ['created_by', 'created_at', 'updated_at']


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    """商务预算管理"""
    list_display = ['code', 'name', 'total_amount', 'business_region', 'valid_from', 'valid_to', 'status', 'created_at']
    list_filter = ['status', 'business_region', 'created_at']
    search_fields = ['name', 'code']
    ordering = ['-valid_from', 'code']
    readonly_fields = ['created_by', 'created_at', 'updated_at']

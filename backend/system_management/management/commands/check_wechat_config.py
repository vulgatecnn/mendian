"""
检查企业微信配置的管理命令

使用方法:
python manage.py check_wechat_config

该命令会验证企业微信配置是否正确，包括：
- 检查必需的配置参数
- 测试API连接
- 验证访问令牌获取
"""

from django.core.management.base import BaseCommand
from django.conf import settings
import requests
import json


class Command(BaseCommand):
    help = '检查企业微信配置是否正确'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-api',
            action='store_true',
            help='测试API连接（需要有效的配置）',
        )

    def handle(self, *args, **options):
        """执行配置检查"""
        test_api = options.get('test_api', False)
        
        self.stdout.write(
            self.style.SUCCESS('企业微信配置检查')
        )
        self.stdout.write('=' * 50)
        
        # 检查配置参数
        config_valid = self._check_config_parameters()
        
        if config_valid and test_api:
            # 测试API连接
            self._test_api_connection()
        elif not config_valid:
            self.stdout.write(
                self.style.WARNING(
                    '\n配置参数不完整，跳过API连接测试。'
                    '\n请先配置所有必需参数，然后使用 --test-api 选项测试连接。'
                )
            )
        
        # 输出配置指南
        self._show_configuration_guide()

    def _check_config_parameters(self):
        """检查配置参数"""
        self.stdout.write('\n1. 检查配置参数')
        self.stdout.write('-' * 30)
        
        # 必需的配置参数
        required_configs = [
            ('WECHAT_CORP_ID', '企业ID'),
            ('WECHAT_AGENT_ID', '应用AgentId'),
            ('WECHAT_SECRET', '应用Secret'),
        ]
        
        all_configured = True
        
        for config_key, config_name in required_configs:
            value = getattr(settings, config_key, '')
            
            if value:
                # 隐藏敏感信息
                if config_key == 'WECHAT_SECRET':
                    display_value = value[:4] + '*' * (len(value) - 4) if len(value) > 4 else '****'
                else:
                    display_value = value
                
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ {config_name}: {display_value}')
                )
            else:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ {config_name}: 未配置')
                )
                all_configured = False
        
        # 检查可选配置
        optional_configs = [
            ('WECHAT_API_BASE_URL', 'API基础URL'),
            ('WECHAT_API_TIMEOUT', 'API超时时间'),
            ('WECHAT_TOKEN_EXPIRES_IN', '令牌有效期'),
        ]
        
        self.stdout.write('\n可选配置:')
        for config_key, config_name in optional_configs:
            value = getattr(settings, config_key, None)
            if value:
                self.stdout.write(f'  • {config_name}: {value}')
        
        return all_configured

    def _test_api_connection(self):
        """测试API连接"""
        self.stdout.write('\n2. 测试API连接')
        self.stdout.write('-' * 30)
        
        try:
            # 测试获取访问令牌
            corp_id = settings.WECHAT_CORP_ID
            secret = settings.WECHAT_SECRET
            
            token_url = f"{settings.WECHAT_API_BASE_URL}/gettoken"
            params = {
                'corpid': corp_id,
                'corpsecret': secret
            }
            
            self.stdout.write('  正在获取访问令牌...')
            
            response = requests.get(
                token_url, 
                params=params, 
                timeout=settings.WECHAT_API_TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('errcode') == 0:
                    access_token = data.get('access_token')
                    expires_in = data.get('expires_in')
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✓ 访问令牌获取成功'
                            f'\n    令牌: {access_token[:10]}...'
                            f'\n    有效期: {expires_in}秒'
                        )
                    )
                    
                    # 测试获取部门列表
                    self._test_department_api(access_token)
                    
                else:
                    error_code = data.get('errcode')
                    error_msg = data.get('errmsg')
                    self.stdout.write(
                        self.style.ERROR(
                            f'  ✗ API错误: {error_code} - {error_msg}'
                        )
                    )
                    self._show_error_help(error_code)
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ✗ HTTP错误: {response.status_code}'
                    )
                )
                
        except requests.exceptions.Timeout:
            self.stdout.write(
                self.style.ERROR('  ✗ 请求超时，请检查网络连接')
            )
        except requests.exceptions.ConnectionError:
            self.stdout.write(
                self.style.ERROR('  ✗ 连接失败，请检查网络连接和防火墙设置')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ✗ 未知错误: {str(e)}')
            )

    def _test_department_api(self, access_token):
        """测试部门API"""
        try:
            dept_url = f"{settings.WECHAT_API_BASE_URL}/department/list"
            params = {
                'access_token': access_token
            }
            
            self.stdout.write('  正在测试部门API...')
            
            response = requests.get(
                dept_url, 
                params=params, 
                timeout=settings.WECHAT_API_TIMEOUT
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('errcode') == 0:
                    departments = data.get('department', [])
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✓ 部门API测试成功，获取到 {len(departments)} 个部门'
                        )
                    )
                else:
                    error_code = data.get('errcode')
                    error_msg = data.get('errmsg')
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠ 部门API错误: {error_code} - {error_msg}'
                        )
                    )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ⚠ 部门API HTTP错误: {response.status_code}'
                    )
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'  ⚠ 部门API测试失败: {str(e)}')
            )

    def _show_error_help(self, error_code):
        """显示错误代码帮助信息"""
        error_help = {
            40013: '企业ID (WECHAT_CORP_ID) 不正确',
            40001: '应用Secret (WECHAT_SECRET) 不正确',
            40014: '访问令牌无效，请检查Secret配置',
            60011: '应用AgentId (WECHAT_AGENT_ID) 不正确',
            60020: '应用未启用或权限不足',
        }
        
        if error_code in error_help:
            self.stdout.write(
                self.style.WARNING(f'    建议: {error_help[error_code]}')
            )

    def _show_configuration_guide(self):
        """显示配置指南"""
        self.stdout.write('\n3. 配置指南')
        self.stdout.write('-' * 30)
        
        self.stdout.write(
            '如需配置企业微信集成，请参考以下步骤：\n'
            '1. 登录企业微信管理后台: https://work.weixin.qq.com/\n'
            '2. 获取企业ID: "我的企业" → "企业信息"\n'
            '3. 创建应用: "应用管理" → "自建" → "创建应用"\n'
            '4. 获取AgentId和Secret: 在应用详情页面查看\n'
            '5. 配置环境变量或修改settings.py\n'
            '6. 运行: python manage.py check_wechat_config --test-api\n'
            '\n详细配置说明请参考: backend/WECHAT_CONFIG.md'
        )
        
        # 显示配置模板
        self.stdout.write('\n环境变量配置模板:')
        self.stdout.write(
            'WECHAT_CORP_ID=你的企业ID\n'
            'WECHAT_AGENT_ID=你的应用AgentId\n'
            'WECHAT_SECRET=你的应用Secret'
        )
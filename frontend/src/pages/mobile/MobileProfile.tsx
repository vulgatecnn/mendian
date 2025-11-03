/**
 * 移动端个人中心
 * 支持个人信息查看、设置管理
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Avatar, 
  List,
  Switch,
  Modal,
  Form,
  Input,
  Button,
  Message,
  Divider
} from '@arco-design/web-react';
import { 
  IconUser,
  IconPhone,
  IconEmail,
  IconLock,
  IconSettings,
  IconPoweroff,
  IconRight,
  IconNotification,
  IconLanguage
} from '@arco-design/web-react/icon';
import { useAuth } from '../../contexts';
import ProfileService from '../../api/profileService';
import './mobile.css';

const FormItem = Form.Item;

/**
 * 移动端个人中心组件
 */
export const MobileProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  // 修改密码
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validate();
      setSubmitting(true);

      await ProfileService.changePassword({
        old_password: values.old_password,
        new_password: values.new_password
      });

      Message.success('密码修改成功');
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error) {
      Message.error('密码修改失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 退出登录
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？',
      onOk: async () => {
        await logout();
        navigate('/mobile/login');
      }
    });
  };

  // 个人信息项
  const profileItems = [
    {
      key: 'name',
      icon: <IconUser />,
      label: '姓名',
      value: user?.real_name || user?.username,
      onClick: () => navigate('/mobile/profile/edit')
    },
    {
      key: 'phone',
      icon: <IconPhone />,
      label: '手机号',
      value: user?.phone,
      onClick: () => navigate('/mobile/profile/edit')
    },
    {
      key: 'email',
      icon: <IconEmail />,
      label: '邮箱',
      value: user?.email || '未设置',
      onClick: () => navigate('/mobile/profile/edit')
    },
    {
      key: 'department',
      icon: <IconSettings />,
      label: '部门',
      value: user?.department?.dept_name || '未设置'
    }
  ];

  // 设置项
  const settingItems = [
    {
      key: 'password',
      icon: <IconLock />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true)
    },
    {
      key: 'push',
      icon: <IconNotification />,
      label: '消息推送',
      extra: (
        <Switch
          checked={pushEnabled}
          onChange={setPushEnabled}
        />
      )
    },
    {
      key: 'language',
      icon: <IconLanguage />,
      label: '语言设置',
      value: '简体中文',
      onClick: () => Message.info('暂不支持切换语言')
    }
  ];

  return (
    <div className="mobile-profile">
      {/* 用户信息卡片 */}
      <Card className="mobile-profile-card">
        <div className="mobile-profile-header">
          <Avatar size={64}>
            {user?.real_name?.charAt(0) || user?.username?.charAt(0)}
          </Avatar>
          <div className="mobile-profile-info">
            <div className="mobile-profile-name">
              {user?.real_name || user?.username}
            </div>
            <div className="mobile-profile-role">
              {user?.roles?.map((r: any) => r.role_name).join('、') || '普通用户'}
            </div>
          </div>
        </div>
      </Card>

      {/* 个人信息 */}
      <Card title="个人信息" className="mobile-profile-section">
        <List>
          {profileItems.map(item => (
            <List.Item
              key={item.key}
              extra={item.onClick ? <IconRight /> : null}
              onClick={item.onClick}
              style={{ cursor: item.onClick ? 'pointer' : 'default' }}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={item.label}
                description={item.value}
              />
            </List.Item>
          ))}
        </List>
      </Card>

      {/* 设置 */}
      <Card title="设置" className="mobile-profile-section">
        <List>
          {settingItems.map(item => (
            <List.Item
              key={item.key}
              extra={item.extra || (item.onClick ? <IconRight /> : null)}
              onClick={item.onClick}
              style={{ cursor: item.onClick ? 'pointer' : 'default' }}
            >
              <List.Item.Meta
                avatar={item.icon}
                title={item.label}
                description={item.value}
              />
            </List.Item>
          ))}
        </List>
      </Card>

      {/* 退出登录 */}
      <div className="mobile-profile-logout">
        <Button
          type="primary"
          status="danger"
          icon={<IconPoweroff />}
          onClick={handleLogout}
          long
        >
          退出登录
        </Button>
      </div>

      {/* 修改密码弹窗 */}
      <Modal
        title="修改密码"
        visible={passwordModalVisible}
        onOk={handleChangePassword}
        onCancel={() => setPasswordModalVisible(false)}
        confirmLoading={submitting}
      >
        <Form form={passwordForm} layout="vertical">
          <FormItem
            label="原密码"
            field="old_password"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </FormItem>

          <FormItem
            label="新密码"
            field="new_password"
            rules={[
              { required: true, message: '请输入新密码' },
              { minLength: 8, message: '密码长度至少8位' },
              { 
                validator: (value, cb) => {
                  if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) {
                    cb('密码必须包含字母和数字');
                  }
                  cb();
                }
              }
            ]}
          >
            <Input.Password placeholder="请输入新密码（至少8位，包含字母和数字）" />
          </FormItem>

          <FormItem
            label="确认密码"
            field="confirm_password"
            rules={[
              { required: true, message: '请确认新密码' },
              {
                validator: (value, cb) => {
                  if (value !== passwordForm.getFieldValue('new_password')) {
                    cb('两次输入的密码不一致');
                  }
                  cb();
                }
              }
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};

export default MobileProfile;

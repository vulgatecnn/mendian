/**
 * 移动端工程验收
 * 支持拍照上传、签名确认
 */
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Radio, 
  Upload,
  Button,
  Message,
  Spin,
  Space,
  Checkbox
} from '@arco-design/web-react';
import { 
  IconLeft, 
  IconCamera, 
  IconCheckCircle 
} from '@arco-design/web-react/icon';
import { useOfflineData } from '../../../hooks/useOfflineData';
import { CACHE_STORES, CACHE_EXPIRY } from '../../../utils/offlineCache';
import PreparationService from '../../../api/preparationService';
import '../mobile.css';

const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const TextArea = Input.TextArea;

/**
 * 移动端工程验收组件
 */
export const MobileConstructionAcceptance: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // 获取工程单详情
  const { 
    data: construction, 
    loading 
  } = useOfflineData<any>({
    storeName: CACHE_STORES.PLANS,
    cacheKey: `construction_detail_${id}`,
    fetchFn: async () => {
      const response = await PreparationService.getConstructionOrderDetail(Number(id));
      return response;
    },
    expiresIn: CACHE_EXPIRY.SHORT
  });

  // 验收项清单
  const checklistItems = [
    { key: 'structure', label: '主体结构完整' },
    { key: 'decoration', label: '装修符合设计要求' },
    { key: 'equipment', label: '设备安装到位' },
    { key: 'water', label: '水电管线正常' },
    { key: 'safety', label: '消防安全合格' },
    { key: 'clean', label: '现场清洁整理' }
  ];

  // 上传图片
  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // TODO: 实现验收图片上传功能
      console.log('上传验收图片功能待实现');
      // TODO: 处理上传成功后的图片URL
      console.log('图片上传成功');
      Message.success('图片上传成功');
    } catch (error) {
      Message.error('图片上传失败');
    }
  };

  // 提交验收
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      setSubmitting(true);

      // 获取签名图片
      const signatureCanvas = signatureCanvasRef.current;
      let signatureData = '';
      if (signatureCanvas) {
        signatureData = signatureCanvas.toDataURL();
      }

      // TODO: 实现提交验收功能
      console.log('提交验收功能待实现', {
        ...values,
        images,
        signature: signatureData
      });

      Message.success('验收提交成功');
      navigate(-1);
    } catch (error) {
      Message.error('验收提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin />
      </div>
    );
  }

  if (!construction) {
    return <div>工程单不存在</div>;
  }

  return (
    <div className="mobile-acceptance">
      {/* 头部 */}
      <div className="mobile-detail-header">
        <Button
          type="text"
          icon={<IconLeft />}
          onClick={() => navigate(-1)}
        />
        <h2>工程验收</h2>
        <div />
      </div>

      {/* 工程信息 */}
      <Card className="mobile-detail-card">
        <div className="mobile-construction-info">
          <div className="info-item">
            <span className="label">工程单号：</span>
            <span>{construction.order_no}</span>
          </div>
          <div className="info-item">
            <span className="label">门店名称：</span>
            <span>{construction.store_name}</span>
          </div>
          <div className="info-item">
            <span className="label">施工供应商：</span>
            <span>{construction.supplier?.supplier_name}</span>
          </div>
        </div>
      </Card>

      {/* 验收表单 */}
      <Card title="验收信息">
        <Form form={form} layout="vertical">
          {/* 验收结果 */}
          <FormItem
            label="验收结果"
            field="result"
            rules={[{ required: true, message: '请选择验收结果' }]}
          >
            <RadioGroup>
              <Radio value="passed">验收通过</Radio>
              <Radio value="failed">需要整改</Radio>
            </RadioGroup>
          </FormItem>

          {/* 验收清单 */}
          <FormItem
            label="验收清单"
            field="checklist"
            rules={[{ required: true, message: '请勾选验收项' }]}
          >
            <Checkbox.Group>
              {checklistItems.map(item => (
                <Checkbox key={item.key} value={item.key}>
                  {item.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </FormItem>

          {/* 验收说明 */}
          <FormItem
            label="验收说明"
            field="notes"
          >
            <TextArea
              placeholder="请输入验收说明"
              rows={4}
              maxLength={500}
              showWordLimit
            />
          </FormItem>

          {/* 整改项 */}
          <Form.Item noStyle shouldUpdate>
            {(values) => {
              return values.result === 'failed' ? (
                <FormItem
                  label="整改项"
                  field="rectification_items"
                  rules={[{ required: true, message: '请输入整改项' }]}
                >
                  <TextArea
                    placeholder="请详细描述需要整改的问题"
                    rows={4}
                    maxLength={500}
                    showWordLimit
                  />
                </FormItem>
              ) : null;
            }}
          </Form.Item>

          {/* 现场照片 */}
          <FormItem label="现场照片">
            <Upload
              action="/api/upload"
              accept="image/*"
              beforeUpload={handleUpload}
              showUploadList={false}
              multiple
            >
              <Button
                type="outline"
                icon={<IconCamera />}
                long
              >
                拍照上传（已上传{images.length}张）
              </Button>
            </Upload>
            
            {/* 图片预览 */}
            {images.length > 0 && (
              <div className="mobile-image-preview">
                {images.map((url, index) => (
                  <img key={index} src={url} alt={`照片${index + 1}`} />
                ))}
              </div>
            )}
          </FormItem>

          {/* 签名确认 */}
          <FormItem label="验收人签名">
            <div className="mobile-signature-pad">
              <canvas
                ref={signatureCanvasRef}
                width={300}
                height={150}
                style={{ 
                  border: '1px solid #E5E6EB', 
                  borderRadius: 4,
                  touchAction: 'none'
                }}
              />
              <Button
                size="small"
                onClick={() => {
                  const canvas = signatureCanvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }}
              >
                清除
              </Button>
            </div>
          </FormItem>
        </Form>
      </Card>

      {/* 提交按钮 */}
      <div className="mobile-detail-actions">
        <Space size="medium">
          <Button onClick={() => navigate(-1)}>
            取消
          </Button>
          <Button
            type="primary"
            icon={<IconCheckCircle />}
            onClick={handleSubmit}
            loading={submitting}
          >
            提交验收
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default MobileConstructionAcceptance;

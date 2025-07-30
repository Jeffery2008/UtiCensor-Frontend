import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { routerMappingAPI } from '@/lib/api';

export default function MappingConfigDialog({ open, onOpenChange, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'router_identifier_mapping',
    key: '',
    value: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!formData.key || !formData.value) {
      setError('请填写所有必填字段');
      return;
    }

    // 验证IP地址格式
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(formData.key)) {
      setError('请输入有效的IP地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await routerMappingAPI.add(formData);
      setFormData({
        type: 'router_identifier_mapping',
        key: '',
        value: ''
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.error || '添加映射失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMapping = async (type, key) => {
    if (!confirm('确定要删除这个映射吗？')) {
      return;
    }

    try {
      await routerMappingAPI.remove({ type, key });
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.error || '删除映射失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加路由器映射</DialogTitle>
          <DialogDescription>
            配置IP地址到路由器标识符的映射关系
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="type">映射类型</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="router_identifier_mapping">路由器标识符映射</SelectItem>
                <SelectItem value="router_mapping">路由器映射</SelectItem>
                <SelectItem value="interface_mapping">接口映射</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="key">IP地址</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              placeholder="例如：192.168.1.1"
            />
          </div>

          <div>
            <Label htmlFor="value">路由器标识符</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="例如：router_office_001"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? '添加中...' : '添加映射'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
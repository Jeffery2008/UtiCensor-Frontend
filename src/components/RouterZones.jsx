import { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Filter,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  X,
  Monitor
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { deviceAPI, routerZoneAPI, routerMappingAPI } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatRelativeTime, formatNumber } from '@/lib/utils';

export default function RouterZones() {
  const { selectedDevice, setSelectedDevice } = useAppStore();
  
  // 状态管理
  const [zones, setZones] = useState([]);
  const [devices, setDevices] = useState([]);
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZone, setFilterZone] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [formData, setFormData] = useState({
    zone_name: '',
    router_identifier: '',
    router_name: '',
    description: '',
    is_active: 1
  });

  // 加载路由器区域
  const loadZones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await routerZoneAPI.getAll();
      setZones(response.data.zones || []);
    } catch (error) {
      console.error('Failed to load router zones:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载设备
  const loadDevices = useCallback(async () => {
    try {
      const response = await deviceAPI.getAll({ is_active: 1 });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  }, []);

  // 加载映射配置
  const loadMappings = useCallback(async () => {
    try {
      const response = await routerMappingAPI.getConfig();
      setMappings(response.data.mappings || {});
    } catch (error) {
      console.error('Failed to load mappings:', error);
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    loadZones();
    loadDevices();
    loadMappings();
  }, [loadZones, loadDevices, loadMappings]);

  // 创建路由器区域
  const handleCreateZone = async () => {
    try {
      await routerZoneAPI.create(formData);
      setShowCreateDialog(false);
      setFormData({
        zone_name: '',
        router_identifier: '',
        router_name: '',
        description: '',
        is_active: 1
      });
      loadZones();
    } catch (error) {
      console.error('Failed to create router zone:', error);
    }
  };

  // 更新路由器区域
  const handleUpdateZone = async () => {
    if (!editingZone) return;
    
    try {
      await routerZoneAPI.update(editingZone.id, formData);
      setShowEditDialog(false);
      setEditingZone(null);
      setFormData({
        zone_name: '',
        router_identifier: '',
        router_name: '',
        description: '',
        is_active: 1
      });
      loadZones();
    } catch (error) {
      console.error('Failed to update router zone:', error);
    }
  };

  // 删除路由器区域
  const handleDeleteZone = async (zoneId) => {
    if (!confirm('确定要删除这个路由器区域吗？相关的设备将被移动到默认区域。')) {
      return;
    }
    
    try {
      await routerZoneAPI.delete(zoneId);
      loadZones();
    } catch (error) {
      console.error('Failed to delete router zone:', error);
    }
  };

  // 编辑区域
  const handleEditZone = (zone) => {
    setEditingZone(zone);
    setFormData({
      zone_name: zone.zone_name,
      router_identifier: zone.router_identifier,
      router_name: zone.router_name || '',
      description: zone.description || '',
      is_active: zone.is_active
    });
    setShowEditDialog(true);
  };

  // 筛选设备
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_identifier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = filterZone === 'all' || device.router_zone_id === parseInt(filterZone);
    return matchesSearch && matchesZone;
  });

  // 获取区域统计
  const getZoneStats = (zoneId) => {
    const zoneDevices = devices.filter(d => d.router_zone_id === zoneId);
    return {
      deviceCount: zoneDevices.length,
      activeDevices: zoneDevices.filter(d => d.is_active).length
    };
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">路由器区域管理</h1>
          <p className="text-muted-foreground">
            管理不同的局域网区域，按路由器分类设备和流量
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建区域
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总区域数</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总设备数</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃区域</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.filter(z => z.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">映射配置</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(mappings.router_identifier_mapping || {}).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">路由器区域</TabsTrigger>
          <TabsTrigger value="devices">设备管理</TabsTrigger>
          <TabsTrigger value="mappings">映射配置</TabsTrigger>
        </TabsList>

        {/* 路由器区域标签页 */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>路由器区域列表</CardTitle>
              <CardDescription>
                管理不同的路由器区域，每个区域代表一个独立的局域网
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zones.map((zone) => {
                  const stats = getZoneStats(zone.id);
                  return (
                    <div key={zone.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Globe className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{zone.zone_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            标识符: {zone.router_identifier}
                          </p>
                          {zone.description && (
                            <p className="text-sm text-muted-foreground">{zone.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant={zone.is_active ? "default" : "secondary"}>
                              {zone.is_active ? "活跃" : "禁用"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {stats.deviceCount} 个设备
                            </span>
                            <span className="text-sm text-muted-foreground">
                              创建于 {formatRelativeTime(zone.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditZone(zone)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {zone.router_identifier !== 'default' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteZone(zone.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设备管理标签页 */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>设备管理</CardTitle>
              <CardDescription>
                查看和管理所有设备，按路由器区域分组
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 筛选控件 */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="搜索设备名称或标识符..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <Select value={filterZone} onValueChange={setFilterZone}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="选择区域" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有区域</SelectItem>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id.toString()}>
                        {zone.zone_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterZone('all'); }}>
                  <X className="h-4 w-4 mr-2" />
                  清除筛选
                </Button>
              </div>

              {/* 设备表格 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备名称</TableHead>
                    <TableHead>标识符</TableHead>
                    <TableHead>所属区域</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDevices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell className="font-medium">{device.device_name}</TableCell>
                      <TableCell className="font-mono text-sm">{device.device_identifier}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {zones.find(z => z.id === device.router_zone_id)?.zone_name || '未知区域'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={device.is_active ? "default" : "secondary"}>
                          {device.is_active ? "活跃" : "禁用"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatRelativeTime(device.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDevice(device)}
                        >
                          选择
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredDevices.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">没有找到匹配的设备</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 映射配置标签页 */}
        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>路由器映射配置</CardTitle>
                  <CardDescription>
                    配置IP地址到路由器标识符的映射关系
                  </CardDescription>
                </div>
                <Button onClick={() => setShowMappingDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  添加映射
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">路由器标识符映射</h4>
                  <div className="space-y-2">
                    {Object.entries(mappings.router_identifier_mapping || {}).map(([ip, identifier]) => (
                      <div key={ip} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-mono">{ip}</span>
                          <span className="mx-2">→</span>
                          <span className="font-medium">{identifier}</span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {Object.keys(mappings.router_identifier_mapping || {}).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">暂无映射配置</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">安全设置</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>允许未知设备</span>
                        <Badge variant={mappings.netify_settings?.allow_unknown_devices ? "default" : "secondary"}>
                          {mappings.netify_settings?.allow_unknown_devices ? "是" : "否"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>允许未知区域</span>
                        <Badge variant={mappings.netify_settings?.allow_unknown_zones ? "default" : "secondary"}>
                          {mappings.netify_settings?.allow_unknown_zones ? "是" : "否"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>自动创建设备</span>
                        <Badge variant={mappings.netify_settings?.auto_create_devices ? "default" : "secondary"}>
                          {mappings.netify_settings?.auto_create_devices ? "是" : "否"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>自动创建区域</span>
                        <Badge variant={mappings.netify_settings?.auto_create_zones ? "default" : "secondary"}>
                          {mappings.netify_settings?.auto_create_zones ? "是" : "否"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 创建区域对话框 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建新的路由器区域</DialogTitle>
            <DialogDescription>
              创建一个新的路由器区域来管理特定的局域网
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">区域名称</label>
              <Input
                value={formData.zone_name}
                onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                placeholder="例如：办公室网络"
              />
            </div>
            <div>
              <label className="text-sm font-medium">路由器标识符</label>
              <Input
                value={formData.router_identifier}
                onChange={(e) => setFormData({ ...formData, router_identifier: e.target.value })}
                placeholder="例如：router_office_001"
              />
            </div>
            <div>
              <label className="text-sm font-medium">路由器名称</label>
              <Input
                value={formData.router_name}
                onChange={(e) => setFormData({ ...formData, router_name: e.target.value })}
                placeholder="例如：办公室路由器"
              />
            </div>
            <div>
              <label className="text-sm font-medium">描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="区域描述（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateZone}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑区域对话框 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑路由器区域</DialogTitle>
            <DialogDescription>
              修改路由器区域的配置信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">区域名称</label>
              <Input
                value={formData.zone_name}
                onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
                placeholder="例如：办公室网络"
              />
            </div>
            <div>
              <label className="text-sm font-medium">路由器标识符</label>
              <Input
                value={formData.router_identifier}
                onChange={(e) => setFormData({ ...formData, router_identifier: e.target.value })}
                placeholder="例如：router_office_001"
                disabled={editingZone?.router_identifier === 'default'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">路由器名称</label>
              <Input
                value={formData.router_name}
                onChange={(e) => setFormData({ ...formData, router_name: e.target.value })}
                placeholder="例如：办公室路由器"
              />
            </div>
            <div>
              <label className="text-sm font-medium">描述</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="区域描述（可选）"
              />
            </div>
            <div>
              <label className="text-sm font-medium">状态</label>
              <Select
                value={formData.is_active.toString()}
                onValueChange={(value) => setFormData({ ...formData, is_active: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">活跃</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateZone}>更新</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
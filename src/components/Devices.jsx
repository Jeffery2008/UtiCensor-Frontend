import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Wifi, 
  Search,
  Filter,
  RefreshCw,
  Eye,
  Activity,
  Globe,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { deviceAPI, routerZoneAPI } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'grouped', 'individual'
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    device_name: '',
    device_identifier: '',
    device_type: '',
    description: '',
    is_active: true,
    router_zone_id: null
  });

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { is_active: 1 };
      if (selectedZone !== 'all') {
        filters.router_zone_id = selectedZone;
      }
      const response = await deviceAPI.getAll(filters);
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  const loadZones = useCallback(async () => {
    try {
      const response = await routerZoneAPI.getAll();
      setZones(response.data.zones || []);
    } catch (error) {
      console.error('Failed to load router zones:', error);
    }
  }, []);

  useEffect(() => {
    loadDevices();
    loadZones();
  }, [loadDevices, loadZones]);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.device_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // 按区域分组的设备
  const groupedDevices = zones.map(zone => ({
    zone,
    devices: filteredDevices.filter(device => device.router_zone_id === zone.id)
  })).filter(group => group.devices.length > 0);

  const handleCreate = async () => {
    try {
      await deviceAPI.create(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        device_name: '',
        device_identifier: '',
        device_type: '',
        description: '',
        is_active: true,
        router_zone_id: null
      });
      loadDevices();
    } catch (error) {
      console.error('Failed to create device:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedDevice) return;
    
    try {
      await deviceAPI.update(selectedDevice.id, formData);
      setIsEditDialogOpen(false);
      setSelectedDevice(null);
      setFormData({
        device_name: '',
        device_identifier: '',
        device_type: '',
        description: '',
        is_active: true,
        router_zone_id: null
      });
      loadDevices();
    } catch (error) {
      console.error('Failed to update device:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;
    
    try {
      await deviceAPI.delete(selectedDevice.id);
      setIsDeleteDialogOpen(false);
      setSelectedDevice(null);
      loadDevices();
    } catch (error) {
      console.error('Failed to delete device:', error);
    }
  };

  const openEditDialog = (device) => {
    setSelectedDevice(device);
    setFormData({
      device_name: device.device_name,
      device_identifier: device.device_identifier,
      device_type: device.device_type || '',
      description: device.description || '',
      is_active: device.is_active,
      router_zone_id: device.router_zone_id
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (device) => {
    setSelectedDevice(device);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (device) => {
    setSelectedDevice(device);
    setIsViewDialogOpen(true);
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone ? zone.zone_name : '未知区域';
  };

  const renderDeviceTable = (deviceList) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>设备名称</TableHead>
          <TableHead>设备标识符</TableHead>
          <TableHead>设备类型</TableHead>
          <TableHead>所属区域</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>创建时间</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deviceList.map((device) => (
          <TableRow key={device.id}>
            <TableCell>
              <div>
                <div className="font-medium">{device.device_name}</div>
                {device.description && (
                  <div className="text-sm text-muted-foreground">{device.description}</div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{device.device_identifier}</Badge>
            </TableCell>
            <TableCell>{device.device_type || '-'}</TableCell>
            <TableCell>
              <Badge variant="secondary">{getZoneName(device.router_zone_id)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant={device.is_active ? "default" : "secondary"}>
                {device.is_active ? "激活" : "未激活"}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {formatRelativeTime(new Date(device.created_at))}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openViewDialog(device)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(device)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteDialog(device)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">设备管理</h1>
          <p className="text-muted-foreground">管理网络设备和按区域分组查看</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadDevices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新建设备
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新建设备</DialogTitle>
                <DialogDescription>
                  添加一个新的网络设备到系统中
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="device_name">设备名称</Label>
                  <Input
                    id="device_name"
                    value={formData.device_name}
                    onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
                    placeholder="例如：办公室电脑"
                  />
                </div>
                <div>
                  <Label htmlFor="device_identifier">设备标识符</Label>
                  <Input
                    id="device_identifier"
                    value={formData.device_identifier}
                    onChange={(e) => setFormData({ ...formData, device_identifier: e.target.value })}
                    placeholder="例如：MAC地址"
                  />
                </div>
                <div>
                  <Label htmlFor="device_type">设备类型</Label>
                  <Input
                    id="device_type"
                    value={formData.device_type}
                    onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                    placeholder="例如：PC、手机、路由器"
                  />
                </div>
                <div>
                  <Label htmlFor="router_zone_id">所属区域</Label>
                  <Select 
                    value={formData.router_zone_id?.toString() || ''} 
                    onValueChange={(value) => setFormData({ ...formData, router_zone_id: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择区域" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.zone_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="设备描述..."
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">激活状态</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总设备数</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">激活设备</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devices.filter(d => d.is_active).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">区域数量</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zones.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">筛选结果</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDevices.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索设备名称、标识符或类型..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部区域</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id.toString()}>
                    {zone.zone_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Mode Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>设备视图</CardTitle>
          <CardDescription>
            选择不同的视图模式来查看设备
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">全部设备</TabsTrigger>
              <TabsTrigger value="grouped">按区域分组</TabsTrigger>
              <TabsTrigger value="individual">单个设备</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">全部设备列表</h3>
                <Badge variant="outline">{filteredDevices.length} 个设备</Badge>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : filteredDevices.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm || selectedZone !== 'all' 
                      ? '没有找到匹配的设备' 
                      : '暂无设备数据'}
                  </AlertDescription>
                </Alert>
              ) : (
                renderDeviceTable(filteredDevices)
              )}
            </TabsContent>
            
            <TabsContent value="grouped" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">按区域分组</h3>
                <Badge variant="outline">{groupedDevices.length} 个区域</Badge>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : groupedDevices.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm || selectedZone !== 'all' 
                      ? '没有找到匹配的设备' 
                      : '暂无设备数据'}
                  </AlertDescription>
                </Alert>
              ) : (
                groupedDevices.map((group) => (
                  <Card key={group.zone.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{group.zone.zone_name}</span>
                        <Badge variant="secondary">{group.devices.length} 个设备</Badge>
                      </CardTitle>
                      <CardDescription>{group.zone.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderDeviceTable(group.devices)}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
            
            <TabsContent value="individual" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">单个设备详情</h3>
                <Badge variant="outline">{filteredDevices.length} 个设备</Badge>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">加载中...</span>
                </div>
              ) : filteredDevices.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    {searchTerm || selectedZone !== 'all' 
                      ? '没有找到匹配的设备' 
                      : '暂无设备数据'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDevices.map((device) => (
                    <Card key={device.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{device.device_name}</CardTitle>
                        <CardDescription>{device.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">标识符:</span>
                          <Badge variant="outline">{device.device_identifier}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">类型:</span>
                          <span>{device.device_type || '-'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">区域:</span>
                          <Badge variant="secondary">{getZoneName(device.router_zone_id)}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">状态:</span>
                          <Badge variant={device.is_active ? "default" : "secondary"}>
                            {device.is_active ? "激活" : "未激活"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">创建时间:</span>
                          <span className="text-sm">{formatRelativeTime(new Date(device.created_at))}</span>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openViewDialog(device)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => openEditDialog(device)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑设备</DialogTitle>
            <DialogDescription>
              修改设备的配置信息
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_device_name">设备名称</Label>
              <Input
                id="edit_device_name"
                value={formData.device_name}
                onChange={(e) => setFormData({ ...formData, device_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_device_identifier">设备标识符</Label>
              <Input
                id="edit_device_identifier"
                value={formData.device_identifier}
                onChange={(e) => setFormData({ ...formData, device_identifier: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_device_type">设备类型</Label>
              <Input
                id="edit_device_type"
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_router_zone_id">所属区域</Label>
              <Select 
                value={formData.router_zone_id?.toString() || ''} 
                onValueChange={(value) => setFormData({ ...formData, router_zone_id: value ? parseInt(value) : null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择区域" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.zone_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_description">描述</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="edit_is_active">激活状态</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>设备详情</DialogTitle>
            <DialogDescription>
              查看设备的详细信息
            </DialogDescription>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">设备名称</Label>
                  <p className="text-sm text-muted-foreground">{selectedDevice.device_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">设备标识符</Label>
                  <p className="text-sm text-muted-foreground">{selectedDevice.device_identifier}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">设备类型</Label>
                  <p className="text-sm text-muted-foreground">{selectedDevice.device_type || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">所属区域</Label>
                  <p className="text-sm text-muted-foreground">{getZoneName(selectedDevice.router_zone_id)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">状态</Label>
                  <Badge variant={selectedDevice.is_active ? "default" : "secondary"}>
                    {selectedDevice.is_active ? "激活" : "未激活"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">创建时间</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeTime(new Date(selectedDevice.created_at))}
                  </p>
                </div>
              </div>
              {selectedDevice.description && (
                <div>
                  <Label className="text-sm font-medium">描述</Label>
                  <p className="text-sm text-muted-foreground">{selectedDevice.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除设备</DialogTitle>
            <DialogDescription>
              确定要删除设备 "{selectedDevice?.device_name}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
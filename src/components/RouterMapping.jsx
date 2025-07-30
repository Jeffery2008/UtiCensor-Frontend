import { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  RefreshCw, 
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  TestTube
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { routerMappingAPI } from '@/lib/api';

export default function RouterMapping() {
  // 状态管理
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testIp, setTestIp] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [formData, setFormData] = useState({
    type: 'router_identifier_mapping',
    key: '',
    value: ''
  });

  // 加载映射配置
  const loadMappings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await routerMappingAPI.getConfig();
      setMappings(response.data.mappings || {});
    } catch (error) {
      console.error('Failed to load mappings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    loadMappings();
  }, [loadMappings]);

  // 添加映射
  const handleAddMapping = async () => {
    try {
      await routerMappingAPI.add(formData);
      setShowAddDialog(false);
      setFormData({
        type: 'router_identifier_mapping',
        key: '',
        value: ''
      });
      loadMappings();
    } catch (error) {
      console.error('Failed to add mapping:', error);
    }
  };

  // 删除映射
  const handleDeleteMapping = async (type, key) => {
    if (!confirm('确定要删除这个映射吗？')) {
      return;
    }
    
    try {
      await routerMappingAPI.remove({ type, key });
      loadMappings();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };

  // 更新安全设置
  const handleUpdateSecuritySettings = async (settings) => {
    try {
      await routerMappingAPI.update({
        netify_settings: settings
      });
      loadMappings();
    } catch (error) {
      console.error('Failed to update security settings:', error);
    }
  };

  // 测试IP映射
  const handleTestMapping = async () => {
    if (!testIp) return;
    
    try {
      const response = await routerMappingAPI.test({ ip: testIp });
      setTestResult(response.data.test_result);
    } catch (error) {
      console.error('Failed to test mapping:', error);
      setTestResult({ error: '测试失败' });
    }
  };

  // 获取映射统计
  const getMappingStats = () => {
    const routerIdentifierCount = Object.keys(mappings.router_identifier_mapping || {}).length;
    const routerMappingCount = Object.keys(mappings.router_mapping || {}).length;
    const interfaceMappingCount = Object.keys(mappings.interface_mapping || {}).length;
    
    return {
      routerIdentifierCount,
      routerMappingCount,
      interfaceMappingCount,
      total: routerIdentifierCount + routerMappingCount + interfaceMappingCount
    };
  };

  const stats = getMappingStats();

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">路由器映射配置</h1>
          <p className="text-muted-foreground">
            配置IP地址到路由器标识符的映射关系和Netify安全设置
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadMappings} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加映射
          </Button>
          <Button variant="outline" onClick={() => setShowTestDialog(true)}>
            <TestTube className="h-4 w-4 mr-2" />
            测试映射
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总映射数</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">路由器标识符映射</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.routerIdentifierCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">路由器映射</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.routerMappingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">接口映射</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interfaceMappingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <Tabs defaultValue="mappings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mappings">映射配置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        {/* 映射配置标签页 */}
        <TabsContent value="mappings" className="space-y-4">
          {/* 路由器标识符映射 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-primary" />
                路由器标识符映射
              </CardTitle>
              <CardDescription>
                配置IP地址到路由器标识符的映射关系
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(mappings.router_identifier_mapping || {}).length === 0 ? (
                <Alert>
                  <AlertDescription>
                    暂无路由器标识符映射配置
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP地址</TableHead>
                      <TableHead>路由器标识符</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(mappings.router_identifier_mapping || {}).map(([ip, identifier]) => (
                      <TableRow key={ip}>
                        <TableCell className="font-mono">{ip}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{identifier}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMapping('router_identifier_mapping', ip)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 路由器映射 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                路由器映射
              </CardTitle>
              <CardDescription>
                配置路由器相关的映射关系
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(mappings.router_mapping || {}).length === 0 ? (
                <Alert>
                  <AlertDescription>
                    暂无路由器映射配置
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>键</TableHead>
                      <TableHead>值</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(mappings.router_mapping || {}).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-mono">{key}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{value}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMapping('router_mapping', key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 接口映射 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                接口映射
              </CardTitle>
              <CardDescription>
                配置网络接口相关的映射关系
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(mappings.interface_mapping || {}).length === 0 ? (
                <Alert>
                  <AlertDescription>
                    暂无接口映射配置
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>接口</TableHead>
                      <TableHead>映射值</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(mappings.interface_mapping || {}).map(([interface_name, value]) => (
                      <TableRow key={interface_name}>
                        <TableCell className="font-mono">{interface_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{value}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMapping('interface_mapping', interface_name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置标签页 */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Netify安全设置
              </CardTitle>
              <CardDescription>
                配置Netify数据接收的安全策略
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h4 className="font-semibold">设备管理</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>允许未知设备</Label>
                          <p className="text-sm text-muted-foreground">
                            允许接收来自未知设备的网络流量数据
                          </p>
                        </div>
                        <Switch
                          checked={mappings.netify_settings?.allow_unknown_devices || false}
                          onCheckedChange={(checked) => 
                            handleUpdateSecuritySettings({
                              ...mappings.netify_settings,
                              allow_unknown_devices: checked
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>自动创建设备</Label>
                          <p className="text-sm text-muted-foreground">
                            自动为未知设备创建设备记录
                          </p>
                        </div>
                        <Switch
                          checked={mappings.netify_settings?.auto_create_devices || false}
                          onCheckedChange={(checked) => 
                            handleUpdateSecuritySettings({
                              ...mappings.netify_settings,
                              auto_create_devices: checked
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">区域管理</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>允许未知区域</Label>
                          <p className="text-sm text-muted-foreground">
                            允许接收来自未知路由器区域的数据
                          </p>
                        </div>
                        <Switch
                          checked={mappings.netify_settings?.allow_unknown_zones || false}
                          onCheckedChange={(checked) => 
                            handleUpdateSecuritySettings({
                              ...mappings.netify_settings,
                              allow_unknown_zones: checked
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>自动创建区域</Label>
                          <p className="text-sm text-muted-foreground">
                            自动为未知路由器创建区域记录
                          </p>
                        </div>
                        <Switch
                          checked={mappings.netify_settings?.auto_create_zones || false}
                          onCheckedChange={(checked) => 
                            handleUpdateSecuritySettings({
                              ...mappings.netify_settings,
                              auto_create_zones: checked
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-4">当前设置状态</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center space-x-2">
                      <Badge variant={mappings.netify_settings?.allow_unknown_devices ? "default" : "secondary"}>
                        {mappings.netify_settings?.allow_unknown_devices ? "允许未知设备" : "禁止未知设备"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={mappings.netify_settings?.auto_create_devices ? "default" : "secondary"}>
                        {mappings.netify_settings?.auto_create_devices ? "自动创建设备" : "手动创建设备"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={mappings.netify_settings?.allow_unknown_zones ? "default" : "secondary"}>
                        {mappings.netify_settings?.allow_unknown_zones ? "允许未知区域" : "禁止未知区域"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={mappings.netify_settings?.auto_create_zones ? "default" : "secondary"}>
                        {mappings.netify_settings?.auto_create_zones ? "自动创建区域" : "手动创建区域"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加映射对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加映射</DialogTitle>
            <DialogDescription>
              添加新的IP地址到路由器标识符映射
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">映射类型</label>
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
              <label className="text-sm font-medium">键</label>
              <Input
                value={formData.key}
                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                placeholder={formData.type === 'router_identifier_mapping' ? 'IP地址，如：192.168.1.1' : '键名'}
              />
            </div>
            <div>
              <label className="text-sm font-medium">值</label>
              <Input
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder={formData.type === 'router_identifier_mapping' ? '路由器标识符，如：router_office_001' : '映射值'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddMapping}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 测试映射对话框 */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>测试IP映射</DialogTitle>
            <DialogDescription>
              测试IP地址的映射配置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">IP地址</label>
              <Input
                value={testIp}
                onChange={(e) => setTestIp(e.target.value)}
                placeholder="输入要测试的IP地址，如：192.168.1.1"
              />
            </div>
            {testResult && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">测试结果</h4>
                {testResult.error ? (
                  <p className="text-red-600">{testResult.error}</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>IP地址:</span>
                      <span className="font-mono">{testResult.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>路由器标识符映射:</span>
                      <span className="font-mono">{testResult.router_identifier_mapping || '无'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>路由器映射:</span>
                      <span className="font-mono">{testResult.router_mapping || '无'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>接口映射:</span>
                      <span className="font-mono">{testResult.interface_mapping || '无'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              关闭
            </Button>
            <Button onClick={handleTestMapping}>测试</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
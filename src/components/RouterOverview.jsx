import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, Router, MapPin, Wifi, Server, Monitor, Smartphone } from 'lucide-react';
import { routerMappingAPI } from '@/lib/api';

export default function RouterOverview() {
  const [routers, setRouters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalRouters: 0,
    totalZones: 0,
    activeRouters: 0,
    totalDevices: 0
  });

  const loadRouterData = async () => {
    setLoading(true);
    try {
      // 获取路由器映射配置
      const configResponse = await routerMappingAPI.getConfig();
      const config = configResponse.data;
      
      // 获取路由器区域数据
      const zonesResponse = await routerMappingAPI.getZones();
      const zones = zonesResponse.data.zones || [];
      
      // 获取设备统计
      const devicesResponse = await routerMappingAPI.getDeviceStats();
      const deviceStats = devicesResponse.data.stats || {};
      
      // 处理路由器数据
      const routerData = zones.map(zone => ({
        id: zone.id,
        zoneName: zone.zone_name,
        routerName: zone.router_name,
        routerIdentifier: zone.router_identifier,
        description: zone.description,
        isActive: zone.is_active,
        deviceCount: deviceStats.router_zones?.find(z => z.id === zone.id)?.device_count || 0,
        activeDeviceCount: deviceStats.router_zones?.find(z => z.id === zone.id)?.active_device_count || 0,
        createdAt: zone.created_at,
        updatedAt: zone.updated_at
      }));
      
      setRouters(routerData);
      
      // 计算统计信息
      setStats({
        totalRouters: routerData.length,
        totalZones: routerData.length,
        activeRouters: routerData.filter(r => r.isActive).length,
        totalDevices: deviceStats.total_devices || 0
      });
      
    } catch (error) {
      console.error('Failed to load router data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouterData();
  }, []);

  const getRouterIcon = (zoneName) => {
    if (zoneName.includes('默认') || zoneName.includes('default')) return <Server className="h-4 w-4" />;
    if (zoneName.includes('办公室') || zoneName.includes('office')) return <Monitor className="h-4 w-4" />;
    if (zoneName.includes('家庭') || zoneName.includes('home')) return <Smartphone className="h-4 w-4" />;
    return <Router className="h-4 w-4" />;
  };

  const getStatusBadge = (isActive, deviceCount) => {
    if (!isActive) {
      return <Badge variant="destructive">禁用</Badge>;
    }
    if (deviceCount > 0) {
      return <Badge variant="default">活跃</Badge>;
    }
    return <Badge variant="secondary">无设备</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">路由器总数</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRouters}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeRouters} 活跃 / {stats.totalRouters - stats.activeRouters} 禁用
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">区域总数</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalZones}</div>
            <p className="text-xs text-muted-foreground">
              已配置的路由器区域
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃路由器</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRouters}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalRouters > 0 ? Math.round((stats.activeRouters / stats.totalRouters) * 100) : 0}% 活跃率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总设备数</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">
              所有路由器下的设备
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 路由器详细列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Router className="h-5 w-5 mr-2 text-primary" />
                路由器区域详情
              </CardTitle>
              <CardDescription>
                显示所有路由器及其对应的区域信息、设备分布和状态
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadRouterData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {routers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {loading ? (
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  加载中...
                </div>
              ) : (
                <div>
                  <Router className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>暂无路由器区域数据</p>
                  <p className="text-sm">请先配置路由器映射或等待路由器连接</p>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区域名称</TableHead>
                  <TableHead>路由器名称</TableHead>
                  <TableHead>标识符</TableHead>
                  <TableHead>设备数量</TableHead>
                  <TableHead>活跃设备</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routers.map((router) => (
                  <TableRow key={router.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getRouterIcon(router.zoneName)}
                        <span className="ml-2 font-medium">{router.zoneName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{router.routerName || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {router.routerIdentifier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{router.deviceCount}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-semibold">{router.activeDeviceCount}</span>
                        {router.deviceCount > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {Math.round((router.activeDeviceCount / router.deviceCount) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(router.isActive, router.deviceCount)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(router.createdAt).toLocaleDateString('zh-CN')}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 配置提示 */}
      {routers.length === 0 && !loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">📋 配置路由器映射</CardTitle>
            <CardDescription className="text-blue-700">
              要显示路由器信息，需要先配置路由器映射
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-700">
              <p>• 在"路由器映射"页面配置IP地址到路由器标识符的映射</p>
              <p>• 确保路由器脚本正确发送标识符</p>
              <p>• 系统会自动创建对应的路由器区域</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
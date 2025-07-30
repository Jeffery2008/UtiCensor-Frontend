import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, Router, Smartphone, Monitor, Server, Wifi } from 'lucide-react';
import { deviceAPI } from '@/lib/api';

export default function DeviceStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await deviceAPI.getStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to load device stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getDeviceIcon = (zoneName) => {
    if (zoneName.includes('默认') || zoneName.includes('default')) return <Server className="h-4 w-4" />;
    if (zoneName.includes('办公室') || zoneName.includes('office')) return <Monitor className="h-4 w-4" />;
    if (zoneName.includes('家庭') || zoneName.includes('home')) return <Smartphone className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总设备数</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_devices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active_devices} 活跃 / {stats.inactive_devices} 非活跃
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">路由器数量</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_routers}</div>
            <p className="text-xs text-muted-foreground">
              已配置的路由器区域
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃设备</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_devices}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_devices > 0 ? Math.round((stats.active_devices / stats.total_devices) * 100) : 0}% 活跃率
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未分配设备</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unassigned_devices}</div>
            <p className="text-xs text-muted-foreground">
              需要分配到路由器区域
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 路由器设备分布 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Router className="h-5 w-5 mr-2 text-primary" />
                路由器设备分布
              </CardTitle>
              <CardDescription>
                显示每个路由器下的设备数量和分布情况
              </CardDescription>
            </div>
            <Button variant="outline" onClick={loadStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.router_zones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无路由器区域数据
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>路由器区域</TableHead>
                  <TableHead>路由器名称</TableHead>
                  <TableHead>标识符</TableHead>
                  <TableHead>设备数量</TableHead>
                  <TableHead>活跃设备</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.router_zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div className="flex items-center">
                        {getDeviceIcon(zone.zone_name)}
                        <span className="ml-2 font-medium">{zone.zone_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{zone.router_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {zone.router_identifier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold">{zone.device_count}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="font-semibold">{zone.active_device_count}</span>
                        {zone.device_count > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {Math.round((zone.active_device_count / zone.device_count) * 100)}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={zone.device_count > 0 ? "default" : "secondary"}>
                        {zone.device_count > 0 ? "有设备" : "无设备"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 问题提示 */}
      {stats.unassigned_devices > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">⚠️ 设备分配问题</CardTitle>
            <CardDescription className="text-orange-700">
              发现 {stats.unassigned_devices} 个设备未分配到任何路由器区域
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-orange-700">
              <p>• 这些设备可能来自未配置的路由器</p>
              <p>• 建议检查路由器映射配置</p>
              <p>• 或者手动将这些设备分配到合适的区域</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
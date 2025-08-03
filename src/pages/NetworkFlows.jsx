import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Shield, Wifi, Users, Eye, Filter, RefreshCw, CheckCircle, Network } from 'lucide-react';

const NetworkFlows = () => {
  const [flows, setFlows] = useState([]);
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filters, setFilters] = useState({
    router_zone_id: '',
    device_id: '',
    protocol: '',
    is_blocked: ''
  });

  const { toast } = useToast();

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/flows?${params}`);
      if (response.data.success) {
        setFlows(response.data.data.flows || []);
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '获取流量数据失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.router_zone_id) params.append('router_zone_id', filters.router_zone_id);
      const response = await api.get(`/flows/stats?${params}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await api.get('/flows/zones');
      if (response.data.success) {
        setZones(response.data.data || []);
      }
    } catch (error) {
      console.error('获取路由器区域失败:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await api.get('/flows/devices');
      if (response.data.success) {
        setDevices(response.data.data || []);
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProtocolColor = (protocol) => {
    const colors = {
      'HTTP': '#FF6B6B', 'HTTPS': '#4ECDC4', 'TCP': '#45B7D1', 'UDP': '#96CEB4',
      'DNS': '#FFEAA7', 'SSH': '#DDA0DD', 'FTP': '#FF8C42', 'SMTP': '#9370DB'
    };
    return colors[protocol] || '#8884D8';
  };

  const securityScore = stats ? Math.max(0, 100 - ((stats.total?.blocked_flows || 0) / (stats.total?.total_flows || 1) * 30)) : 100;

  useEffect(() => {
    let interval;
    if (realTimeMode && autoRefresh) {
      interval = setInterval(() => {
        fetchFlows();
        fetchStats();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeMode, autoRefresh]);

  useEffect(() => {
    fetchFlows();
    fetchStats();
    fetchZones();
    fetchDevices();
  }, [filters]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">网络活动审查工具</h1>
          <p className="text-muted-foreground">实时监控和分析网络流量，识别安全威胁和异常行为</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch checked={realTimeMode} onCheckedChange={setRealTimeMode} />
            <Label>实时模式</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} disabled={!realTimeMode} />
            <Label>自动刷新</Label>
          </div>
          <Button onClick={() => { fetchFlows(); fetchStats(); }} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {realTimeMode && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            实时监控模式已启用 - 每30秒自动刷新数据
            {autoRefresh && (
              <span className="ml-2 text-green-600">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                自动刷新中
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              安全评分
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(securityScore)}</div>
            <Progress value={securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {securityScore >= 80 ? '安全' : securityScore >= 60 ? '注意' : '危险'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wifi className="w-4 h-4 mr-2" />
              网络健康度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85</div>
            <Progress value={85} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">良好</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              活跃设备
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.devices?.filter(d => d.count > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              总设备: {devices.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Network className="w-4 h-4 mr-2" />
              总流量数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total?.total_flows?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              被阻止: {stats?.total?.blocked_flows?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            过滤器
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="router_zone_id">路由器区域</Label>
              <Select value={filters.router_zone_id} onValueChange={(value) => setFilters({ ...filters, router_zone_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择区域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部区域</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.zone_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="device_id">设备</Label>
              <Select value={filters.device_id} onValueChange={(value) => setFilters({ ...filters, device_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择设备" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部设备</SelectItem>
                  {devices.map((device) => (
                    <SelectItem key={device.id} value={device.id.toString()}>
                      {device.device_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="protocol">协议</Label>
              <Input
                id="protocol"
                value={filters.protocol}
                onChange={(e) => setFilters({ ...filters, protocol: e.target.value })}
                placeholder="输入协议"
              />
            </div>

            <div>
              <Label htmlFor="is_blocked">阻止状态</Label>
              <Select value={filters.is_blocked} onValueChange={(value) => setFilters({ ...filters, is_blocked: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部</SelectItem>
                  <SelectItem value="true">被阻止</SelectItem>
                  <SelectItem value="false">正常</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="zones">区域分析</TabsTrigger>
          <TabsTrigger value="devices">设备分析</TabsTrigger>
          <TabsTrigger value="flows">流量详情</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">总发送流量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatBytes(stats.total?.total_bytes_sent || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    包数: {stats.total?.total_packets_sent?.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">总接收流量</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatBytes(stats.total?.total_bytes_received || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    包数: {stats.total?.total_packets_received?.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">活跃区域</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.zones?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    路由器区域数量
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">协议种类</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.protocols?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    检测到的协议类型
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {stats?.protocols && (
            <Card>
              <CardHeader>
                <CardTitle>协议分布</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.protocols.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.protocols.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getProtocolColor(entry.protocol)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {stats?.applications && (
            <Card>
              <CardHeader>
                <CardTitle>应用流量排行</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.applications.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="application" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatBytes(value)} />
                    <Bar dataKey="bytes_sent" fill="#8884d8" name="发送" />
                    <Bar dataKey="bytes_received" fill="#82ca9d" name="接收" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>路由器区域分析</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.zones && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats.zones}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatBytes(value)} />
                    <Legend />
                    <Bar dataKey="bytes_sent" fill="#8884d8" name="发送流量" />
                    <Bar dataKey="bytes_received" fill="#82ca9d" name="接收流量" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {stats?.zones && (
            <Card>
              <CardHeader>
                <CardTitle>区域详情</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>区域名称</TableHead>
                      <TableHead>流量数</TableHead>
                      <TableHead>发送流量</TableHead>
                      <TableHead>接收流量</TableHead>
                      <TableHead>被阻止流量</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.zones.map((zone) => (
                      <TableRow key={zone.zone_name}>
                        <TableCell className="font-medium">{zone.zone_name}</TableCell>
                        <TableCell>{zone.count.toLocaleString()}</TableCell>
                        <TableCell>{formatBytes(zone.bytes_sent)}</TableCell>
                        <TableCell>{formatBytes(zone.bytes_received)}</TableCell>
                        <TableCell>
                          <Badge variant={zone.blocked_flows > 0 ? "destructive" : "secondary"}>
                            {zone.blocked_flows}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, router_zone_id: zone.id?.toString() || '' })}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>设备流量分析</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.devices && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stats.devices.slice(0, 15)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="device_name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatBytes(value)} />
                    <Legend />
                    <Bar dataKey="bytes_sent" fill="#8884d8" name="发送流量" />
                    <Bar dataKey="bytes_received" fill="#82ca9d" name="接收流量" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {stats?.devices && (
            <Card>
              <CardHeader>
                <CardTitle>设备详情</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>设备名称</TableHead>
                      <TableHead>MAC地址</TableHead>
                      <TableHead>流量数</TableHead>
                      <TableHead>发送流量</TableHead>
                      <TableHead>接收流量</TableHead>
                      <TableHead>被阻止流量</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.devices.map((device) => (
                      <TableRow key={device.mac_address}>
                        <TableCell className="font-medium">{device.device_name}</TableCell>
                        <TableCell className="font-mono text-sm">{device.mac_address}</TableCell>
                        <TableCell>{device.count.toLocaleString()}</TableCell>
                        <TableCell>{formatBytes(device.bytes_sent)}</TableCell>
                        <TableCell>{formatBytes(device.bytes_received)}</TableCell>
                        <TableCell>
                          <Badge variant={device.blocked_flows > 0 ? "destructive" : "secondary"}>
                            {device.blocked_flows}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, device_id: device.id?.toString() || '' })}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            查看详情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>流量详情</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>设备</TableHead>
                    <TableHead>源IP</TableHead>
                    <TableHead>目标IP</TableHead>
                    <TableHead>协议</TableHead>
                    <TableHead>应用</TableHead>
                    <TableHead>发送流量</TableHead>
                    <TableHead>接收流量</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>开始时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flows.slice(0, 50).map((flow) => (
                    <TableRow key={flow.id}>
                      <TableCell className="font-medium">{flow.device_name}</TableCell>
                      <TableCell className="font-mono text-sm">{flow.source_ip}</TableCell>
                      <TableCell className="font-mono text-sm">{flow.destination_ip}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: getProtocolColor(flow.protocol) }}>
                          {flow.protocol}
                        </Badge>
                      </TableCell>
                      <TableCell>{flow.application || '-'}</TableCell>
                      <TableCell>{formatBytes(flow.bytes_sent)}</TableCell>
                      <TableCell>{formatBytes(flow.bytes_received)}</TableCell>
                      <TableCell>
                        <Badge variant={flow.is_blocked ? "destructive" : "secondary"}>
                          {flow.is_blocked ? '被阻止' : '正常'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(flow.connection_start), 'MM-dd HH:mm:ss', { locale: zhCN })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkFlows; 
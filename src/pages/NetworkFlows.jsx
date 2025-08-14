import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast.js';
import api from '@/lib/api.js';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart,
  Line,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Shield,
  Wifi,
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download as DownloadIcon,
  RefreshCw,
  Trash2,
  CheckCircle,
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

export default function NetworkFlows() {
  const [flows, setFlows] = useState([]);
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);
  const [devices, setDevices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState('connection_start');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    router_zone_id: '',
    device_id: '',
    protocol: '',
    application: '',
    category: '',
    source_ip: '',
    destination_ip: '',
    is_blocked: '',
    start_date: '',
    end_date: '',
    search: '',
    min_bytes: '',
    max_bytes: '',
    min_duration: '',
    max_duration: '',
    port_range: '',
    suspicious_only: false,
    blocked_only: false,
  });

  const { toast } = useToast();

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0秒';
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}时${minutes}分`;
  };

  const getProtocolColor = (protocol) => {
    const map = {
      HTTP: '#FF6B6B',
      HTTPS: '#4ECDC4',
      TCP: '#45B7D1',
      UDP: '#96CEB4',
      DNS: '#FFEAA7',
      SSH: '#DDA0DD',
      FTP: '#FF8C42',
      SMTP: '#9370DB',
      POP3: '#20B2AA',
      IMAP: '#FF69B4',
    };
    return map[protocol] || COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  const fetchFlows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          params.append(k, String(v));
        }
      });
      const response = await api.get(`/flows?${params.toString()}`);
      if (response.data.success) {
        setFlows(response.data.data.flows || []);
        setPagination(response.data.data.pagination || pagination);
      }
    } catch (e) {
      toast({ title: '错误', description: '获取流量数据失败', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.router_zone_id) params.append('router_zone_id', String(filters.router_zone_id));
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      const response = await api.get(`/flows/stats?${params.toString()}`);
      if (response.data.success) setStats(response.data.data);
    } catch (e) {
      console.error('获取统计信息失败:', e);
    }
  };

  const fetchZones = async () => {
    try {
      const response = await api.get('/router-zones');
      if (response.data.success) setZones(response.data.data || response.data.zones || []);
    } catch (e) {
      console.error('获取路由器区域失败:', e);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      if (response.data.success) setDevices(response.data.data || response.data.devices || []);
    } catch (e) {
      console.error('获取设备列表失败:', e);
    }
  };

  useEffect(() => {
    fetchFlows();
    fetchStats();
    fetchZones();
    fetchDevices();
  }, [pagination.page, sortBy, sortOrder, JSON.stringify(filters)]);

  useEffect(() => {
    let timer;
    if (realTimeMode && autoRefresh) {
      timer = setInterval(() => {
        fetchFlows();
        fetchStats();
      }, refreshInterval * 1000);
    }
    return () => timer && clearInterval(timer);
  }, [realTimeMode, autoRefresh, refreshInterval]);

  const trafficTrend = useMemo(() => {
    if (!stats?.time_series || stats.time_series.length < 2) return 'stable';
    const recent = stats.time_series.slice(-3);
    const older = stats.time_series.slice(-6, -3);
    const recentAvg = recent.reduce((s, i) => s + i.bytes_sent + i.bytes_received, 0) / recent.length;
    const olderAvg = older.reduce((s, i) => s + i.bytes_sent + i.bytes_received, 0) / older.length;
    const change = ((recentAvg - olderAvg) / Math.max(olderAvg, 1)) * 100;
    if (change > 20) return 'increasing';
    if (change < -20) return 'decreasing';
    return 'stable';
  }, [stats]);

  const blockedRatio = stats?.total?.total_flows ? (stats.total.blocked_flows / stats.total.total_flows) : 0;
  const securityScore = Math.max(0, Math.round(100 - blockedRatio * 30));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">网络活动审查工具</h1>
          <p className="text-muted-foreground">按路由器区域分析不同局域网的网络活动、协议与应用分布</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch checked={realTimeMode} onCheckedChange={setRealTimeMode} />
            <Label>实时模式</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} disabled={!realTimeMode} />
            <Label>自动刷新</Label>
          </div>
          <Button onClick={() => window.open(`${api.defaults.baseURL}/flows/export?${new URLSearchParams(filters).toString()}`, '_blank')} variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" /> 导出
          </Button>
          <Button onClick={() => { fetchFlows(); fetchStats(); }} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 刷新
          </Button>
          <Button onClick={() => { /* 可扩展清理功能 */ }} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" /> 清理
          </Button>
        </div>
      </div>

      {realTimeMode && (
        <Alert>
          <AlertDescription>
            实时监控已启用，每 {refreshInterval} 秒自动刷新
            {autoRefresh && (<span className="ml-2 text-green-600 inline-flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> 自动刷新中</span>)}
          </AlertDescription>
        </Alert>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center"><Shield className="w-4 h-4 mr-2" /> 安全评分</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityScore}</div>
              <Progress value={securityScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">总流量数</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.total.total_flows || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">被阻止: {(stats.total.blocked_flows || 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">总发送流量</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.total.total_bytes_sent || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">总接收流量</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.total.total_bytes_received || 0)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 过滤器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Globe className="w-5 h-5 mr-2" /> 筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="router_zone_id">路由器区域</Label>
              <Select value={filters.router_zone_id} onValueChange={(v) => setFilters({ ...filters, router_zone_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择区域" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部区域</SelectItem>
                  {zones.map((z) => (<SelectItem key={z.id} value={String(z.id)}>{z.zone_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="device_id">设备</Label>
              <Select value={filters.device_id} onValueChange={(v) => setFilters({ ...filters, device_id: v })}>
                <SelectTrigger><SelectValue placeholder="选择设备" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">全部设备</SelectItem>
                  {devices.map((d) => (<SelectItem key={d.id} value={String(d.id)}>{d.device_name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="protocol">协议</Label>
              <Input id="protocol" value={filters.protocol} onChange={(e) => setFilters({ ...filters, protocol: e.target.value })} placeholder="HTTP/HTTPS/TCP..." />
            </div>
            <div>
              <Label htmlFor="application">应用</Label>
              <Input id="application" value={filters.application} onChange={(e) => setFilters({ ...filters, application: e.target.value })} placeholder="应用名称" />
            </div>
            <div>
              <Label htmlFor="source_ip">源IP</Label>
              <Input id="source_ip" value={filters.source_ip} onChange={(e) => setFilters({ ...filters, source_ip: e.target.value })} placeholder="192.168.x.x" />
            </div>
            <div>
              <Label htmlFor="destination_ip">目标IP</Label>
              <Input id="destination_ip" value={filters.destination_ip} onChange={(e) => setFilters({ ...filters, destination_ip: e.target.value })} placeholder="8.8.8.8" />
            </div>
            <div>
              <Label htmlFor="start_date">开始日期</Label>
              <Input id="start_date" type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="end_date">结束日期</Label>
              <Input id="end_date" type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} />
            </div>

            {showAdvancedFilters && (
              <>
                <div>
                  <Label htmlFor="min_bytes">最小流量 (字节)</Label>
                  <Input id="min_bytes" type="number" value={filters.min_bytes} onChange={(e) => setFilters({ ...filters, min_bytes: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="max_bytes">最大流量 (字节)</Label>
                  <Input id="max_bytes" type="number" value={filters.max_bytes} onChange={(e) => setFilters({ ...filters, max_bytes: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="min_duration">最小时长 (秒)</Label>
                  <Input id="min_duration" type="number" value={filters.min_duration} onChange={(e) => setFilters({ ...filters, min_duration: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="max_duration">最大时长 (秒)</Label>
                  <Input id="max_duration" type="number" value={filters.max_duration} onChange={(e) => setFilters({ ...filters, max_duration: e.target.value })} />
                </div>
              </>
            )}

            <div className="md:col-span-2 flex items-center gap-2">
              <Button onClick={() => { setPagination({ ...pagination, page: 1 }); fetchFlows(); fetchStats(); }}>应用筛选</Button>
              <Button variant="outline" onClick={() => {
                setFilters({
                  router_zone_id: '', device_id: '', protocol: '', application: '', category: '', source_ip: '', destination_ip: '', is_blocked: '', start_date: '', end_date: '', search: '', min_bytes: '', max_bytes: '', min_duration: '', max_duration: '', port_range: '', suspicious_only: false, blocked_only: false,
                });
                setPagination({ ...pagination, page: 1 });
                fetchFlows();
                fetchStats();
              }}>重置</Button>
              <Button variant="outline" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>{showAdvancedFilters ? '隐藏' : '显示'}高级选项</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Globe className="w-5 h-5 mr-2" /> 按区域流量</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...(stats.zones || [])].sort((a,b)=> (b.bytes_sent + b.bytes_received) - (a.bytes_sent + a.bytes_received))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone_name" interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tickFormatter={(v)=>formatBytes(v)} />
                  <Tooltip formatter={(val)=> typeof val==='number'? formatBytes(val): val} />
                  <Legend />
                  <Bar dataKey="bytes_sent" name="发送" stackId="a" fill="#4ECDC4" />
                  <Bar dataKey="bytes_received" name="接收" stackId="a" fill="#45B7D1" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><PieChartIcon className="w-5 h-5 mr-2" /> 协议分布</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.protocols || []} dataKey="count" nameKey="protocol" cx="50%" cy="50%" outerRadius={100} label>
                    {(stats.protocols || []).map((entry, i) => (<Cell key={i} fill={getProtocolColor(entry.protocol)} />))}
                  </Pie>
                  <Tooltip formatter={(val, _name, props)=> [`${val} 次`, props?.payload?.protocol]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><BarChart3 className="w-5 h-5 mr-2" /> Top 应用</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={[...(stats.applications || [])].slice(0,10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="application" interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis yAxisId="left" tickFormatter={(v)=>formatBytes(v)} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(val, name)=> name==='count'? `${val} 次` : formatBytes(val)} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="bytes_sent" name="发送" fill="#82CA9D" />
                  <Bar yAxisId="left" dataKey="bytes_received" name="接收" fill="#8884D8" />
                  <Line yAxisId="right" type="monotone" dataKey="count" name="次数" stroke="#FF6B6B" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center"><LineChartIcon className="w-5 h-5 mr-2" /> 最近24小时</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[...(stats.time_series || [])].slice().reverse()}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ECDC4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#4ECDC4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRecv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#45B7D1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#45B7D1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis tickFormatter={(v)=>formatBytes(v)} />
                  <Tooltip formatter={(val)=> typeof val==='number'? formatBytes(val): val} />
                  <Legend />
                  <Area type="monotone" dataKey="bytes_sent" name="发送" stroke="#4ECDC4" fillOpacity={1} fill="url(#colorSent)" />
                  <Area type="monotone" dataKey="bytes_received" name="接收" stroke="#45B7D1" fillOpacity={1} fill="url(#colorRecv)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>流量明细</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区域</TableHead>
                  <TableHead>设备</TableHead>
                  <TableHead>源IP:端口</TableHead>
                  <TableHead>目标IP:端口</TableHead>
                  <TableHead>协议/应用</TableHead>
                  <TableHead>发送/接收</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>时长</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.map((f) => (
                  <TableRow key={f.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedFlow(f)}>
                    <TableCell>{f.zone_name || '-'}</TableCell>
                    <TableCell>{f.device_name || f.mac_address || '-'}</TableCell>
                    <TableCell>{f.source_ip}:{f.source_port}</TableCell>
                    <TableCell>{f.destination_ip}:{f.destination_port}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: getProtocolColor(f.protocol) }}>{f.protocol}</Badge>
                        {f.application && <span className="text-xs text-muted-foreground">{f.application}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <div>↑ {formatBytes(f.bytes_sent)}</div>
                        <div>↓ {formatBytes(f.bytes_received)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{f.connection_start ? format(new Date(f.connection_start), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '-'}</TableCell>
                    <TableCell>{formatDuration(f.duration || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}>上一页</Button>
              <span className="text-sm">{pagination.page} / {pagination.pages}</span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.pages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}>下一页</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedFlow} onOpenChange={(open) => !open && setSelectedFlow(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>流量详情 #{selectedFlow?.id}</DialogTitle>
            <DialogDescription>查看该连接的详细信息</DialogDescription>
          </DialogHeader>
          {selectedFlow && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><Label className="text-xs">区域</Label><div>{selectedFlow.zone_name || '-'}</div></div>
              <div><Label className="text-xs">设备</Label><div>{selectedFlow.device_name || selectedFlow.mac_address || '-'}</div></div>
              <div><Label className="text-xs">源</Label><div>{selectedFlow.source_ip}:{selectedFlow.source_port}</div></div>
              <div><Label className="text-xs">目标</Label><div>{selectedFlow.destination_ip}:{selectedFlow.destination_port}</div></div>
              <div><Label className="text-xs">协议</Label><div>{selectedFlow.protocol}</div></div>
              <div><Label className="text-xs">应用</Label><div>{selectedFlow.application || '-'}</div></div>
              <div><Label className="text-xs">发送</Label><div>{formatBytes(selectedFlow.bytes_sent)}</div></div>
              <div><Label className="text-xs">接收</Label><div>{formatBytes(selectedFlow.bytes_received)}</div></div>
              <div><Label className="text-xs">开始时间</Label><div>{selectedFlow.connection_start ? format(new Date(selectedFlow.connection_start), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN }) : '-'}</div></div>
              <div><Label className="text-xs">时长</Label><div>{formatDuration(selectedFlow.duration || 0)}</div></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}



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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Shield,
  Globe,
  Wifi,
  Clock,
  Download,
  Upload,
  Users,
  Server,
  Eye,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Search,
  Settings,
  Download as DownloadIcon,
  Trash2,
  Play,
  Pause,
  Square,
} from 'lucide-react';

interface NetworkFlow {
  id: number;
  router_zone_id: number;
  zone_name: string;
  device_id: number;
  device_name: string;
  mac_address: string;
  source_ip: string;
  destination_ip: string;
  source_port: number;
  destination_port: number;
  protocol: string;
  bytes_sent: number;
  bytes_received: number;
  packets_sent: number;
  packets_received: number;
  connection_start: string;
  connection_end: string;
  duration: number;
  application: string;
  category: string;
  is_blocked: boolean;
  block_reason: string;
}

interface FlowStats {
  total: {
    total_flows: number;
    total_bytes_sent: number;
    total_bytes_received: number;
    total_packets_sent: number;
    total_packets_received: number;
    total_duration: number;
    blocked_flows: number;
  };
  protocols: Array<{
    protocol: string;
    count: number;
    bytes_sent: number;
    bytes_received: number;
    avg_duration: number;
  }>;
  applications: Array<{
    application: string;
    count: number;
    bytes_sent: number;
    bytes_received: number;
    avg_duration: number;
  }>;
  categories: Array<{
    category: string;
    count: number;
    bytes_sent: number;
    bytes_received: number;
  }>;
  zones: Array<{
    zone_name: string;
    count: number;
    bytes_sent: number;
    bytes_received: number;
    blocked_flows: number;
  }>;
  devices: Array<{
    device_name: string;
    mac_address: string;
    count: number;
    bytes_sent: number;
    bytes_received: number;
    blocked_flows: number;
  }>;
  time_series: Array<{
    hour: string;
    count: number;
    bytes_sent: number;
    bytes_received: number;
  }>;
}

interface RouterZone {
  id: number;
  zone_name: string;
  router_name: string;
  router_identifier: string;
}

interface Device {
  id: number;
  device_name: string;
  mac_address: string;
  ip_address: string;
  router_zone_id: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface SecurityAlert {
  id: string;
  type: 'suspicious_activity' | 'data_exfiltration' | 'malware_communication' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  affected_device?: string;
  affected_zone?: string;
  details: any;
}

interface TrafficPattern {
  pattern_type: 'normal' | 'anomaly' | 'suspicious';
  description: string;
  confidence: number;
  affected_devices: string[];
  time_range: string;
  indicators: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

const NetworkFlows: React.FC = () => {
  const [flows, setFlows] = useState<NetworkFlow[]>([]);
  const [stats, setStats] = useState<FlowStats | null>(null);
  const [zones, setZones] = useState<RouterZone[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<NetworkFlow | null>(null);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [trafficPatterns, setTrafficPatterns] = useState<TrafficPattern[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline'>('table');
  const [sortBy, setSortBy] = useState('connection_start');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // 获取流量列表
  const fetchFlows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...filters,
      });

      const response = await api.get(`/flows?${params}`);
      if (response.data.success) {
        setFlows(response.data.data.flows);
        setPagination(response.data.data.pagination);
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

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.router_zone_id) params.append('router_zone_id', filters.router_zone_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);

      const response = await api.get(`/flows/stats?${params}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取路由器区域
  const fetchZones = async () => {
    try {
      const response = await api.get('/flows/zones');
      if (response.data.success) {
        setZones(response.data.data);
      }
    } catch (error) {
      console.error('获取路由器区域失败:', error);
    }
  };

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      const response = await api.get('/flows/devices');
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
    }
  };

  // 获取安全警报
  const fetchSecurityAlerts = async () => {
    try {
      const response = await api.get('/flows/security-alerts');
      if (response.data.success) {
        setSecurityAlerts(response.data.data);
      }
    } catch (error) {
      console.error('获取安全警报失败:', error);
    }
  };

  // 获取流量模式
  const fetchTrafficPatterns = async () => {
    try {
      const response = await api.get('/flows/patterns');
      if (response.data.success) {
        setTrafficPatterns(response.data.data);
      }
    } catch (error) {
      console.error('获取流量模式失败:', error);
    }
  };

  // 清理过期数据
  const cleanupFlows = async () => {
    try {
      const response = await api.post('/flows/cleanup', { days: 30 });
      if (response.data.success) {
        toast({
          title: '成功',
          description: response.data.message,
        });
        fetchFlows();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '清理数据失败',
        variant: 'destructive',
      });
    }
  };

  // 导出数据
  const exportFlows = () => {
    const params = new URLSearchParams(filters);
    window.open(`${api.defaults.baseURL}/flows/export?${params}`, '_blank');
  };

  // 实时模式切换
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (realTimeMode && autoRefresh) {
      interval = setInterval(() => {
        fetchFlows();
        fetchStats();
        fetchSecurityAlerts();
      }, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeMode, autoRefresh, refreshInterval]);

  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化持续时间
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}时${minutes}分`;
  };

  // 获取协议颜色
  const getProtocolColor = (protocol: string): string => {
    const colors: { [key: string]: string } = {
      'HTTP': '#FF6B6B',
      'HTTPS': '#4ECDC4',
      'TCP': '#45B7D1',
      'UDP': '#96CEB4',
      'DNS': '#FFEAA7',
      'SSH': '#DDA0DD',
      'FTP': '#FF8C42',
      'SMTP': '#9370DB',
      'POP3': '#20B2AA',
      'IMAP': '#FF69B4',
    };
    return colors[protocol] || COLORS[Math.floor(Math.random() * COLORS.length)];
  };

  // 获取安全警报颜色
  const getAlertColor = (severity: string): string => {
    const colors: { [key: string]: string } = {
      'low': '#4ECDC4',
      'medium': '#FFBB28',
      'high': '#FF8042',
      'critical': '#FF6B6B',
    };
    return colors[severity] || '#4ECDC4';
  };

  // 计算流量趋势
  const trafficTrend = useMemo(() => {
    if (!stats?.time_series || stats.time_series.length < 2) return 'stable';
    const recent = stats.time_series.slice(-3);
    const older = stats.time_series.slice(-6, -3);
    const recentAvg = recent.reduce((sum, item) => sum + item.bytes_sent + item.bytes_received, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.bytes_sent + item.bytes_received, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    if (change > 20) return 'increasing';
    if (change < -20) return 'decreasing';
    return 'stable';
  }, [stats]);

  // 计算安全评分
  const securityScore = useMemo(() => {
    if (!stats) return 100;
    const totalFlows = stats.total.total_flows;
    const blockedFlows = stats.total.blocked_flows;
    const suspiciousAlerts = securityAlerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical').length;
    const score = Math.max(0, 100 - (blockedFlows / totalFlows * 30) - (suspiciousAlerts * 10));
    return Math.round(score);
  }, [stats, securityAlerts]);

  // 计算网络健康度
  const networkHealth = useMemo(() => {
    if (!stats) return { score: 100, status: 'excellent', issues: [] };
    const issues: string[] = [];
    let score = 100;

    // 检查被阻止的流量比例
    const blockedRatio = stats.total.blocked_flows / stats.total.total_flows;
    if (blockedRatio > 0.1) {
      issues.push(`被阻止流量比例过高 (${(blockedRatio * 100).toFixed(1)}%)`);
      score -= 20;
    }

    // 检查流量分布
    if (stats.protocols.length > 0) {
      const topProtocol = stats.protocols[0];
      const topProtocolRatio = topProtocol.count / stats.total.total_flows;
      if (topProtocolRatio > 0.8) {
        issues.push(`协议分布不均，${topProtocol.protocol}占比过高`);
        score -= 15;
      }
    }

    // 检查设备活动
    const activeDevices = stats.devices.filter(device => device.count > 0).length;
    if (activeDevices < 2) {
      issues.push('活跃设备数量较少');
      score -= 10;
    }

    let status = 'excellent';
    if (score < 60) status = 'poor';
    else if (score < 80) status = 'fair';
    else if (score < 90) status = 'good';

    return { score: Math.max(0, score), status, issues };
  }, [stats]);

  useEffect(() => {
    fetchFlows();
    fetchStats();
    fetchZones();
    fetchDevices();
    fetchSecurityAlerts();
    fetchTrafficPatterns();
  }, [pagination.page, filters, sortBy, sortOrder]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和控制按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">网络活动审查工具</h1>
          <p className="text-muted-foreground">实时监控和分析网络流量，识别安全威胁和异常行为</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              checked={realTimeMode}
              onCheckedChange={setRealTimeMode}
            />
            <Label>实时模式</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              disabled={!realTimeMode}
            />
            <Label>自动刷新</Label>
          </div>
          <Button onClick={exportFlows} variant="outline" size="sm">
            <DownloadIcon className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button onClick={cleanupFlows} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            清理
          </Button>
          <Button onClick={() => { fetchFlows(); fetchStats(); }} disabled={loading} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      {/* 实时状态指示器 */}
      {realTimeMode && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            实时监控模式已启用 - 每 {refreshInterval} 秒自动刷新数据
            {autoRefresh && (
              <span className="ml-2 text-green-600">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                自动刷新中
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* 安全警报 */}
      {securityAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              安全警报 ({securityAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getAlertColor(alert.severity) }}
                    />
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">{alert.description}</div>
                    </div>
                  </div>
                  <Badge variant="destructive">{alert.severity.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 网络健康度仪表板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              安全评分
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityScore}</div>
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
            <div className="text-2xl font-bold">{networkHealth.score}</div>
            <Progress value={networkHealth.score} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {networkHealth.status}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              流量趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trafficTrend === 'increasing' ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : trafficTrend === 'decreasing' ? (
                <TrendingDown className="w-6 h-6 text-red-600" />
              ) : (
                <div className="w-6 h-6 border-2 border-gray-400 rounded-full" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {trafficTrend === 'increasing' ? '流量上升' : 
               trafficTrend === 'decreasing' ? '流量下降' : '流量稳定'}
            </p>
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
              {stats?.devices.filter(d => d.count > 0).length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              总设备: {devices.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总流量数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.total_flows.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                被阻止: {stats.total.blocked_flows.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总发送流量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.total.total_bytes_sent)}</div>
              <p className="text-xs text-muted-foreground">
                包数: {stats.total.total_packets_sent.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总接收流量</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatBytes(stats.total.total_bytes_received)}</div>
              <p className="text-xs text-muted-foreground">
                包数: {stats.total.total_packets_received.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">总连接时长</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.total.total_duration)}</div>
              <p className="text-xs text-muted-foreground">
                平均: {formatDuration(stats.total.total_duration / stats.total.total_flows)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 高级过滤器 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              高级过滤器
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              {showAdvancedFilters ? '隐藏' : '显示'}高级选项
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Label htmlFor="application">应用</Label>
              <Input
                id="application"
                value={filters.application}
                onChange={(e) => setFilters({ ...filters, application: e.target.value })}
                placeholder="输入应用名称"
              />
            </div>

            <div>
              <Label htmlFor="source_ip">源IP</Label>
              <Input
                id="source_ip"
                value={filters.source_ip}
                onChange={(e) => setFilters({ ...filters, source_ip: e.target.value })}
                placeholder="输入源IP"
              />
            </div>

            <div>
              <Label htmlFor="destination_ip">目标IP</Label>
              <Input
                id="destination_ip"
                value={filters.destination_ip}
                onChange={(e) => setFilters({ ...filters, destination_ip: e.target.value })}
                placeholder="输入目标IP"
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

            <div>
              <Label htmlFor="start_date">开始日期</Label>
              <Input
                id="start_date"
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              />
            </div>

            {showAdvancedFilters && (
              <>
                <div>
                  <Label htmlFor="min_bytes">最小流量 (字节)</Label>
                  <Input
                    id="min_bytes"
                    type="number"
                    value={filters.min_bytes}
                    onChange={(e) => setFilters({ ...filters, min_bytes: e.target.value })}
                    placeholder="最小流量"
                  />
                </div>

                <div>
                  <Label htmlFor="max_bytes">最大流量 (字节)</Label>
                  <Input
                    id="max_bytes"
                    type="number"
                    value={filters.max_bytes}
                    onChange={(e) => setFilters({ ...filters, max_bytes: e.target.value })}
                    placeholder="最大流量"
                  />
                </div>

                <div>
                  <Label htmlFor="min_duration">最小时长 (秒)</Label>
                  <Input
                    id="min_duration"
                    type="number"
                    value={filters.min_duration}
                    onChange={(e) => setFilters({ ...filters, min_duration: e.target.value })}
                    placeholder="最小时长"
                  />
                </div>

                <div>
                  <Label htmlFor="max_duration">最大时长 (秒)</Label>
                  <Input
                    id="max_duration"
                    type="number"
                    value={filters.max_duration}
                    onChange={(e) => setFilters({ ...filters, max_duration: e.target.value })}
                    placeholder="最大时长"
                  />
                </div>

                <div>
                  <Label htmlFor="port_range">端口范围</Label>
                  <Input
                    id="port_range"
                    value={filters.port_range}
                    onChange={(e) => setFilters({ ...filters, port_range: e.target.value })}
                    placeholder="如: 80-443"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.suspicious_only}
                    onCheckedChange={(checked) => setFilters({ ...filters, suspicious_only: checked })}
                  />
                  <Label>仅显示可疑流量</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={filters.blocked_only}
                    onCheckedChange={(checked) => setFilters({ ...filters, blocked_only: checked })}
                  />
                  <Label>仅显示被阻止流量</Label>
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <Label htmlFor=
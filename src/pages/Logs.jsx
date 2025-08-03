import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Filter, Download, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast.js';
import api from '@/lib/api.js';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    level: '',
    type: '',
    search: '',
    start_date: '',
    end_date: '',
    user_id: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [logTypes, setLogTypes] = useState([]);
  const [logLevels, setLogLevels] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  // 获取日志列表
  const fetchLogs = async (page = 1, newFilters = null) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...(newFilters || filters)
      };
      
      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get('/logs', { params });
      if (response.data.success) {
        setLogs(response.data.data.logs);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '获取日志失败: ' + (error.response?.data?.message || error.message),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取日志统计
  const fetchStats = async () => {
    try {
      const response = await api.get('/logs/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取日志类型和级别
  const fetchLogOptions = async () => {
    try {
      const [typesResponse, levelsResponse] = await Promise.all([
        api.get('/logs/types'),
        api.get('/logs/levels')
      ]);
      
      if (typesResponse.data.success) {
        setLogTypes(typesResponse.data.data);
      }
      if (levelsResponse.data.success) {
        setLogLevels(levelsResponse.data.data);
      }
    } catch (error) {
      console.error('获取日志选项失败:', error);
    }
  };

  // 清理日志
  const cleanupLogs = async () => {
    if (!confirm('确定要清理30天前的日志吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await api.post('/logs/cleanup');
      if (response.data.success) {
        toast({
          title: '成功',
          description: response.data.message,
        });
        fetchLogs();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '清理日志失败: ' + (error.response?.data?.message || error.message),
        variant: 'destructive',
      });
    }
  };

  // 导出日志
  const exportLogs = async () => {
    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get('/logs/export', { 
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: '成功',
        description: '日志导出成功',
      });
    } catch (error) {
      toast({
        title: '错误',
        description: '导出日志失败: ' + (error.response?.data?.message || error.message),
        variant: 'destructive',
      });
    }
  };

  // 应用筛选
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1, filters);
  };

  // 重置筛选
  const resetFilters = () => {
    const defaultFilters = {
      level: '',
      type: '',
      search: '',
      start_date: '',
      end_date: '',
      user_id: ''
    };
    setFilters(defaultFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1, defaultFilters);
  };

  // 获取日志级别颜色
  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'outline';
    }
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    try {
      return format(new Date(timeStr), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchLogOptions();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">系统日志</h1>
          <p className="text-muted-foreground">查看和管理系统运行日志</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" onClick={cleanupLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            清理
          </Button>
          <Button onClick={() => { fetchLogs(); fetchStats(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '加载中...' : '刷新'}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总日志数</p>
                <p className="text-2xl font-bold">{stats.total_logs || 0}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">错误日志</p>
                <p className="text-2xl font-bold text-red-600">{stats.error_count || 0}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm font-bold">❌</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">警告日志</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning_count || 0}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-bold">⚠️</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">今日日志</p>
                <p className="text-2xl font-bold text-green-600">{stats.today_count || 0}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">📅</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">搜索关键词</Label>
                <Input
                  id="search"
                  placeholder="搜索日志消息..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">日志级别</Label>
                <Select value={filters.level} onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部级别</SelectItem>
                    {logLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">日志类型</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部类型</SelectItem>
                    {logTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">开始日期</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">结束日期</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">用户ID</Label>
                <Input
                  id="user_id"
                  placeholder="输入用户ID"
                  value={filters.user_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters}>应用筛选</Button>
              <Button variant="outline" onClick={resetFilters}>重置</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>日志列表</CardTitle>
          <p className="text-sm text-muted-foreground">
            共 {pagination.total} 条日志，第 {pagination.page} / {pagination.pages} 页
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>加载中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无日志数据</p>
              {Object.values(filters).some(v => v !== '') && (
                <p className="text-sm mt-2">尝试调整筛选条件</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getLevelColor(log.level)}>
                          {log.level?.toUpperCase()}
                        </Badge>
                        {log.type && (
                          <Badge variant="outline">{log.type}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">#{log.id}</span>
                      </div>
                      
                      <div className="font-medium mb-2 line-clamp-2">{log.message}</div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>时间: {formatTime(log.created_at)}</span>
                          {log.user_id && <span>用户: {log.user_id}</span>}
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                        </div>
                        {log.request_method && log.request_url && (
                          <div className="flex items-center gap-2">
                            <span>请求: {log.request_method} {log.request_url}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>日志详情 #{log.id}</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="basic" className="w-full">
                          <TabsList>
                            <TabsTrigger value="basic">基本信息</TabsTrigger>
                            <TabsTrigger value="context">上下文信息</TabsTrigger>
                            <TabsTrigger value="raw">原始数据</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">日志级别</Label>
                                <p className="text-sm">{log.level}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">日志类型</Label>
                                <p className="text-sm">{log.type || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">创建时间</Label>
                                <p className="text-sm">{formatTime(log.created_at)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">用户ID</Label>
                                <p className="text-sm">{log.user_id || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">IP地址</Label>
                                <p className="text-sm">{log.ip_address || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">请求方法</Label>
                                <p className="text-sm">{log.request_method || '-'}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">消息内容</Label>
                              <p className="text-sm bg-muted p-3 rounded mt-1 whitespace-pre-wrap">{log.message}</p>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="context" className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">请求URL</Label>
                              <p className="text-sm bg-muted p-3 rounded mt-1 break-all">{log.request_url || '-'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">错误代码</Label>
                              <p className="text-sm">{log.error_code || '-'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">错误文件</Label>
                              <p className="text-sm">{log.error_file || '-'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">错误行号</Label>
                              <p className="text-sm">{log.error_line || '-'}</p>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="raw">
                            <Label className="text-sm font-medium">原始数据</Label>
                            <pre className="text-sm bg-muted p-3 rounded mt-1 overflow-auto max-h-96">
                              {JSON.stringify(log, null, 2)}
                            </pre>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                上一页
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchLogs(page)}
                      disabled={page > pagination.pages}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs; 
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取日志类型和级别
  const fetchLogOptions = async () => {
    try {
      const [typesResponse, levelsResponse] = await Promise.all([
        api.get('/logs/types'),
        api.get('/logs/levels')
      ]);
      
      if (typesResponse.data.success) {
        setLogTypes(typesResponse.data.data);
      }
      if (levelsResponse.data.success) {
        setLogLevels(levelsResponse.data.data);
      }
    } catch (error) {
      console.error('获取日志选项失败:', error);
    }
  };

  // 清理日志
  const cleanupLogs = async () => {
    if (!confirm('确定要清理30天前的日志吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await api.post('/logs/cleanup');
      if (response.data.success) {
        toast({
          title: '成功',
          description: response.data.message,
        });
        fetchLogs();
        fetchStats();
      }
    } catch (error) {
      toast({
        title: '错误',
        description: '清理日志失败: ' + (error.response?.data?.message || error.message),
        variant: 'destructive',
      });
    }
  };

  // 导出日志
  const exportLogs = async () => {
    try {
      const params = { ...filters };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await api.get('/logs/export', { 
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `logs_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: '成功',
        description: '日志导出成功',
      });
    } catch (error) {
      toast({
        title: '错误',
        description: '导出日志失败: ' + (error.response?.data?.message || error.message),
        variant: 'destructive',
      });
    }
  };

  // 应用筛选
  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1, filters);
  };

  // 重置筛选
  const resetFilters = () => {
    const defaultFilters = {
      level: '',
      type: '',
      search: '',
      start_date: '',
      end_date: '',
      user_id: ''
    };
    setFilters(defaultFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLogs(1, defaultFilters);
  };

  // 获取日志级别颜色
  const getLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'outline';
    }
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    try {
      return format(new Date(timeStr), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
    } catch {
      return timeStr;
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchLogOptions();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">系统日志</h1>
          <p className="text-muted-foreground">查看和管理系统运行日志</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            筛选
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="w-4 h-4 mr-2" />
            导出
          </Button>
          <Button variant="outline" onClick={cleanupLogs}>
            <Trash2 className="w-4 h-4 mr-2" />
            清理
          </Button>
          <Button onClick={() => { fetchLogs(); fetchStats(); }} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? '加载中...' : '刷新'}
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">总日志数</p>
                <p className="text-2xl font-bold">{stats.total_logs || 0}</p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-bold">📊</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">错误日志</p>
                <p className="text-2xl font-bold text-red-600">{stats.error_count || 0}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-sm font-bold">❌</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">警告日志</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.warning_count || 0}</p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm font-bold">⚠️</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">今日日志</p>
                <p className="text-2xl font-bold text-green-600">{stats.today_count || 0}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm font-bold">📅</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选面板 */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              筛选条件
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">搜索关键词</Label>
                <Input
                  id="search"
                  placeholder="搜索日志消息..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="level">日志级别</Label>
                <Select value={filters.level} onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择级别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部级别</SelectItem>
                    {logLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">日志类型</Label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">全部类型</SelectItem>
                    {logTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">开始日期</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={filters.start_date}
                  onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">结束日期</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={filters.end_date}
                  onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_id">用户ID</Label>
                <Input
                  id="user_id"
                  placeholder="输入用户ID"
                  value={filters.user_id}
                  onChange={(e) => setFilters(prev => ({ ...prev, user_id: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters}>应用筛选</Button>
              <Button variant="outline" onClick={resetFilters}>重置</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <CardTitle>日志列表</CardTitle>
          <p className="text-sm text-muted-foreground">
            共 {pagination.total} 条日志，第 {pagination.page} / {pagination.pages} 页
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p>加载中...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无日志数据</p>
              {Object.values(filters).some(v => v !== '') && (
                <p className="text-sm mt-2">尝试调整筛选条件</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getLevelColor(log.level)}>
                          {log.level?.toUpperCase()}
                        </Badge>
                        {log.type && (
                          <Badge variant="outline">{log.type}</Badge>
                        )}
                        <span className="text-xs text-muted-foreground">#{log.id}</span>
                      </div>
                      
                      <div className="font-medium mb-2 line-clamp-2">{log.message}</div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-4">
                          <span>时间: {formatTime(log.created_at)}</span>
                          {log.user_id && <span>用户: {log.user_id}</span>}
                          {log.ip_address && <span>IP: {log.ip_address}</span>}
                        </div>
                        {log.request_method && log.request_url && (
                          <div className="flex items-center gap-2">
                            <span>请求: {log.request_method} {log.request_url}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>日志详情 #{log.id}</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="basic" className="w-full">
                          <TabsList>
                            <TabsTrigger value="basic">基本信息</TabsTrigger>
                            <TabsTrigger value="context">上下文信息</TabsTrigger>
                            <TabsTrigger value="raw">原始数据</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="basic" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">日志级别</Label>
                                <p className="text-sm">{log.level}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">日志类型</Label>
                                <p className="text-sm">{log.type || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">创建时间</Label>
                                <p className="text-sm">{formatTime(log.created_at)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">用户ID</Label>
                                <p className="text-sm">{log.user_id || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">IP地址</Label>
                                <p className="text-sm">{log.ip_address || '-'}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">请求方法</Label>
                                <p className="text-sm">{log.request_method || '-'}</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">消息内容</Label>
                              <p className="text-sm bg-muted p-3 rounded mt-1 whitespace-pre-wrap">{log.message}</p>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="context" className="space-y-4">
                            <div>
                              <Label className="text-sm font-medium">请求URL</Label>
                              <p className="text-sm bg-muted p-3 rounded mt-1 break-all">{log.request_url || '-'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">错误代码</Label>
                              <p className="text-sm">{log.error_code || '-'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">错误文件</Label>
                              <p className="text-sm">{log.error_file || '-'}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">错误行号</Label>
                              <p className="text-sm">{log.error_line || '-'}</p>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="raw">
                            <Label className="text-sm font-medium">原始数据</Label>
                            <pre className="text-sm bg-muted p-3 rounded mt-1 overflow-auto max-h-96">
                              {JSON.stringify(log, null, 2)}
                            </pre>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(pagination.page - 1)}
                disabled={pagination.page <= 1}
              >
                上一页
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchLogs(page)}
                      disabled={page > pagination.pages}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchLogs(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
              >
                下一页
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs; 
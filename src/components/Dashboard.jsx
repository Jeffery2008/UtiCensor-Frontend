import { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Monitor, 
  Shield, 
  TrendingUp, 
  Users, 
  Globe,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { deviceAPI, flowAPI } from '@/lib/api';
import { useAppStore, useDashboardStore } from '@/lib/store';
import { formatBytes, formatNumber, formatRelativeTime, getApplicationIcon, getProtocolColor } from '@/lib/utils';

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, change, icon: Icon, trend = 'up' }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className={`text-xs ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? '+' : ''}{change} from last period
        </p>
      )}
    </CardContent>
  </Card>
);

const TopListCard = ({ title, data, renderItem, emptyMessage = "No data available" }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.slice(0, 5).map((item, index) => renderItem(item, index))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>
      )}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { selectedDevice, setSelectedDevice, selectedDateRange } = useAppStore();
  const {
    stats,
    hourlyStats,
    topApplications,
    topProtocols,
    topHosts,
    recentFlows,
    setStats,
    setHourlyStats,
    setTopApplications,
    setTopProtocols,
    setTopHosts,
    setRecentFlows,
    setLoading
  } = useDashboardStore();

  const [deviceList, setDeviceList] = useState([]);

  const loadDevices = useCallback(async () => {
    try {
      const response = await deviceAPI.getAll({ is_active: 1 });
      setDeviceList(response.data.devices);
      
      // Auto-select first device if none selected
      if (!selectedDevice && response.data.devices.length > 0) {
        setSelectedDevice(response.data.devices[0]);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    }
  }, [selectedDevice, setSelectedDevice]);

  const loadDashboardData = useCallback(async () => {
    if (!selectedDevice) return;

    const startDate = selectedDateRange.start.toISOString().split('T')[0];
    const endDate = selectedDateRange.end.toISOString().split('T')[0];

    // Load statistics
    setLoading('stats', true);
    try {
      const response = await flowAPI.getStats({
        device_id: selectedDevice.id,
        start_date: startDate,
        end_date: endDate
      });
      setStats(response.data.daily_stats);
      setTopApplications(response.data.top_applications);
      setTopProtocols(response.data.top_protocols);
      setTopHosts(response.data.top_hosts);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading('stats', false);
    }

    // Load hourly stats for today
    setLoading('hourlyStats', true);
    try {
      const response = await flowAPI.getHourlyStats({
        device_id: selectedDevice.id,
        date: new Date().toISOString().split('T')[0]
      });
      setHourlyStats(response.data.hourly_stats);
    } catch (error) {
      console.error('Failed to load hourly stats:', error);
    } finally {
      setLoading('hourlyStats', false);
    }

    // Load recent flows
    setLoading('recentFlows', true);
    try {
      const response = await flowAPI.getAll({
        device_id: selectedDevice.id,
        limit: 10
      });
      setRecentFlows(response.data.flows);
    } catch (error) {
      console.error('Failed to load recent flows:', error);
    } finally {
      setLoading('recentFlows', false);
    }
  }, [selectedDevice, selectedDateRange, setLoading, setStats, setTopApplications, setTopProtocols, setTopHosts, setRecentFlows, setHourlyStats]);

  // Load devices on component mount
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Load dashboard data when device or date range changes
  useEffect(() => {
    if (selectedDevice) {
      loadDashboardData();
    }
  }, [selectedDevice, selectedDateRange, loadDashboardData]);

  // Calculate summary statistics
  const summaryStats = stats ? stats.reduce((acc, day) => ({
    totalFlows: acc.totalFlows + parseInt(day.flow_count),
    totalBytes: acc.totalBytes + parseInt(day.total_bytes),
    uniqueLocalIPs: Math.max(acc.uniqueLocalIPs, parseInt(day.unique_local_ips)),
    uniqueRemoteIPs: acc.uniqueRemoteIPs + parseInt(day.unique_remote_ips)
  }), { totalFlows: 0, totalBytes: 0, uniqueLocalIPs: 0, uniqueRemoteIPs: 0 }) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Network Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and analyze network activity across your infrastructure
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select
            value={selectedDevice?.id?.toString() || ''}
            onValueChange={(value) => {
              const device = deviceList.find(d => d.id.toString() === value);
              setSelectedDevice(device);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent>
              {deviceList.map((device) => (
                <SelectItem key={device.id} value={device.id.toString()}>
                  {device.device_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={loadDashboardData} disabled={!selectedDevice}>
            Refresh
          </Button>
        </div>
      </div>

      {!selectedDevice ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Device Selected</h3>
              <p className="text-muted-foreground">
                Please select a device to view network activity dashboard
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Flows"
              value={summaryStats ? formatNumber(summaryStats.totalFlows) : '0'}
              change="12%"
              icon={Activity}
            />
            <StatCard
              title="Data Volume"
              value={summaryStats ? formatBytes(summaryStats.totalBytes) : '0 B'}
              change="8%"
              icon={TrendingUp}
            />
            <StatCard
              title="Local IPs"
              value={summaryStats ? formatNumber(summaryStats.uniqueLocalIPs) : '0'}
              change="3%"
              icon={Users}
            />
            <StatCard
              title="Remote Hosts"
              value={summaryStats ? formatNumber(summaryStats.uniqueRemoteIPs) : '0'}
              change="15%"
              icon={Globe}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity</CardTitle>
                <CardDescription>Network flows by hour</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={hourlyStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="flow_count" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Daily Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Trends</CardTitle>
                <CardDescription>Network activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="flow_count" 
                      stroke="#8884d8" 
                      name="Flows"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_bytes" 
                      stroke="#82ca9d" 
                      name="Bytes"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TopListCard
              title="Top Applications"
              data={topApplications}
              renderItem={(app, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getApplicationIcon(app.application)}</span>
                    <div>
                      <p className="font-medium">{app.application}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(app.flow_count)} flows
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {formatBytes(app.total_bytes)}
                  </Badge>
                </div>
              )}
            />

            <TopListCard
              title="Top Protocols"
              data={topProtocols}
              renderItem={(protocol, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getProtocolColor(protocol.protocol) }}
                    />
                    <div>
                      <p className="font-medium">{protocol.protocol}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(protocol.flow_count)} flows
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {formatBytes(protocol.total_bytes)}
                  </Badge>
                </div>
              )}
            />

            <TopListCard
              title="Top Hosts"
              data={topHosts}
              renderItem={(host, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{host.host}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatNumber(host.flow_count)} flows
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {formatBytes(host.total_bytes)}
                  </Badge>
                </div>
              )}
            />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Network Flows</CardTitle>
              <CardDescription>Latest network activity</CardDescription>
            </CardHeader>
            <CardContent>
              {recentFlows && recentFlows.length > 0 ? (
                <div className="space-y-4">
                  {recentFlows.map((flow) => (
                    <div key={flow.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getApplicationIcon(flow.detected_application_name)}</span>
                          <div>
                            <p className="font-medium">{flow.detected_application_name}</p>
                            <p className="text-sm text-muted-foreground">{flow.detected_protocol_name}</p>
                          </div>
                        </div>
                        <div className="text-sm">
                          <p>{flow.local_ip}:{flow.local_port} → {flow.other_ip}:{flow.other_port}</p>
                          {flow.host_server_name && (
                            <p className="text-muted-foreground">{flow.host_server_name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatBytes(flow.bytes_len)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(flow.recv_ts)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No recent network flows</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


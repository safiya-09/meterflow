import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity, Key, Server, CreditCard } from 'lucide-react';
import api from '../utils/axios';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/Card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';

import { Button } from '../components/ui/Button';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

/* ------------------------------------ */
/* FETCH DASHBOARD DATA */
/* ------------------------------------ */
const fetchDashboardStats = async () => {
  const [logsRes, apisRes, keysRes, billingRes, rateLimitRes] = await Promise.all([
    api.get('logs').catch(() => ({ data: { data: [] } })),
    api.get('apis').catch(() => ({ data: { data: [] } })),
    api.get('keys/all').catch(() => ({ data: { data: [] } })),
    api.get('billing/me').catch(() => ({ data: { data: {} } })),
    api.get('rate-limit/me').catch(() => ({ data: { data: { plan: 'free', used: 0, limit: 100, remaining: 100, resetInSeconds: 0 } } })),
  ]);

  const logs = logsRes?.data?.data || [];
  const apis = apisRes?.data?.data || [];
  const keys = keysRes?.data?.data || [];
  const billing = billingRes?.data?.data || {};

  const currentMonthRevenue =
    billing.amountDue ??
    billing.amount ??
    billing.details?.amountDue ??
    0;

  const currentMonthRequests =
    billing.currentMonthRequests ??
    billing.requests ??
    billing.details?.currentMonthRequests ??
    0;

  /* Mock charts until real analytics APIs ready */
  const requestsOverTime = [
    { name: 'Mon', requests: 120 },
    { name: 'Tue', requests: 200 },
    { name: 'Wed', requests: 150 },
    { name: 'Thu', requests: 300 },
    { name: 'Fri', requests: 250 },
    { name: 'Sat', requests: 400 },
    { name: 'Sun', requests: 350 },
  ];

  const successCount =
    logs.filter((l) =>
      String(l?.statusCode || '').startsWith('2')
    ).length || 85;

  const errorCount =
    logs.filter(
      (l) => !String(l?.statusCode || '').startsWith('2')
    ).length || 15;

  const successError = [
    { name: 'Success', value: successCount },
    { name: 'Error', value: errorCount },
  ];

  return {
    totalRequests: logs.length || currentMonthRequests || 0,
    activeApis: apis.length || 0,
    activeKeys: Array.isArray(keys)
      ? keys.filter((k) => k.status === 'active').length
      : 0,
    currentMonthRevenue: Number(currentMonthRevenue),
    requestsOverTime,
    successError,
    recentLogs: logs.slice(0, 5),
    rateLimit: rateLimitRes?.data?.data || { plan: 'free', used: 0, limit: 100, remaining: 100, resetInSeconds: 0 },
  };
};

/* ------------------------------------ */
/* COMPONENT */
/* ------------------------------------ */
export default function DashboardHome() {
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: fetchDashboardStats,
  });

  /* LOADING */
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-24 bg-card rounded-xl border" />
        <div className="h-64 bg-card rounded-xl border" />
      </div>
    );
  }

  /* ERROR */
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="text-destructive p-4 bg-destructive/10 rounded-md font-medium">
          Error loading dashboard data.
        </div>

        <Button onClick={() => refetch()}>
          Retry Now
        </Button>
      </div>
    );
  }

  /* SAFE FALLBACK */
  const stats = data || {
    totalRequests: 0,
    activeApis: 0,
    activeKeys: 0,
    currentMonthRevenue: 0,
    requestsOverTime: [],
    successError: [],
    recentLogs: [],
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Overview
        </h2>
      </div>

      {/* TOP CARDS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRequests}
            </div>
          </CardContent>
        </Card>

        {/* APIs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active APIs
            </CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeApis}
            </div>
          </CardContent>
        </Card>

        {/* Keys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active API Keys
            </CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeKeys}
            </div>
          </CardContent>
        </Card>

        {/* Subscription / Plan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Current Plan
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold uppercase">
              {stats.rateLimit.plan}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
               Status: <span className="font-medium text-emerald-600">Active</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RATE LIMIT SECTION */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rate Limit Usage</CardTitle>
              <CardDescription>Current window usage and reset details per your primary API key.</CardDescription>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              stats.rateLimit?.plan === 'enterprise' ? 'bg-purple-100 text-purple-700' : 
              stats.rateLimit?.plan === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {stats.rateLimit?.plan} Plan
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Used</p>
              <p className="text-2xl font-bold">{stats.rateLimit?.used || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Limit</p>
              <p className="text-2xl font-bold">{stats.rateLimit?.limit || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Remaining</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.rateLimit?.remaining || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Reset In</p>
              <p className="text-2xl font-bold">
                {Math.floor((stats.rateLimit?.resetInSeconds || 0) / 60)}m {(stats.rateLimit?.resetInSeconds || 0) % 60}s
              </p>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
              <span>Usage Intensity</span>
              <span>{Math.round(((stats.rateLimit?.used || 0) / (stats.rateLimit?.limit || 1)) * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  ((stats.rateLimit?.used || 0) / (stats.rateLimit?.limit || 1)) > 0.9 ? 'bg-destructive' : 
                  ((stats.rateLimit?.used || 0) / (stats.rateLimit?.limit || 1)) > 0.7 ? 'bg-orange-500' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, ((stats.rateLimit?.used || 0) / (stats.rateLimit?.limit || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHARTS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Line */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Requests Over Time</CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.requestsOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />

                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Success vs Error</CardTitle>
          </CardHeader>

          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.successError}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                >
                  {stats.successError.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={
                        COLORS[index % COLORS.length]
                      }
                    />
                  ))}
                </Pie>

                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest API hits and logs generated.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {stats.recentLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No recent activity found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {stats.recentLogs.map((log, index) => (
                  <TableRow key={log._id || index}>
                    <TableCell>
                      {log.requestPath ||
                        log.endpoint ||
                        '-'}
                    </TableCell>

                    <TableCell>
                      {log.method || '-'}
                    </TableCell>

                    <TableCell>
                      {log.statusCode || '-'}
                    </TableCell>

                    <TableCell>
                      {log.timestamp
                        ? new Date(
                          log.timestamp
                        ).toLocaleString()
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
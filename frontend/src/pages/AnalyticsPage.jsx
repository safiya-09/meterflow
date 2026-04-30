import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export default function AnalyticsPage() {
  const [filterApiId, setFilterApiId] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: async () => {
      const res = await api.get('apis');
      return res.data.data;
    }
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['logs', filterApiId],
    queryFn: async () => {
      let url = 'logs';
      if (filterApiId) {
        url = `logs/${filterApiId}`;
      }
      try {
        const res = await api.get(url);
        return res.data.data || [];
      } catch (e) {
        return [];
      }
    }
  });

  const filteredLogs = logs?.filter(log => {
    if (filterMethod && log.method !== filterMethod) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Logs & Analytics</h2>
        <p className="text-muted-foreground">Detailed logs of your API traffic.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <select 
            className="flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterApiId}
            onChange={(e) => setFilterApiId(e.target.value)}
          >
            <option value="">All APIs</option>
            {apis?.map(a => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>

          <select 
            className="flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request Logs</CardTitle>
          <CardDescription>Recent API requests matching your filters.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-32 flex items-center justify-center">Loading logs...</div>
          ) : filteredLogs?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No logs found matching criteria.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint / VIP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs?.map((log, index) => (
                  <TableRow key={log._id || index}>
                    <TableCell className="text-sm">{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell><span className="font-mono bg-secondary px-1.5 py-0.5 rounded text-xs">{log.method}</span></TableCell>
                    <TableCell className="font-medium">{log.requestPath || log.endpoint}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${String(log.statusCode).startsWith('2') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {log.statusCode}
                      </span>
                    </TableCell>
                    <TableCell>{log.responseTime || log.latency || '<1'} ms</TableCell>
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

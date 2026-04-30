import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export default function ApiKeysPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApiId, setSelectedApiId] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: async () => {
      const res = await api.get('apis');
      return res.data.data;
    }
  });

  const { data: keys, isLoading } = useQuery({
    queryKey: ['keys', selectedApiId],
    queryFn: async () => {
      if (!selectedApiId) return [];
      const res = await api.get(`keys/${selectedApiId}`);
      return res.data.data;
    },
    enabled: !!selectedApiId
  });

  const generateKey = useMutation({
    mutationFn: async () => {
      const res = await api.post(`keys/${selectedApiId}/generate`, {
        plan: "free"
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['keys', selectedApiId]);
      setGeneratedKey(data.key);
    }
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId) => {
      const res = await api.patch(`keys/${selectedApiId}/revoke/${keyId}`);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['keys', selectedApiId]);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API Keys</h2>
          <p className="text-muted-foreground">Manage authentication keys for your APIs.</p>
        </div>
        <Button onClick={() => { setGeneratedKey(''); setIsModalOpen(true); }} disabled={!apis?.length}>
          Generate New Key
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <select
          className="flex h-10 w-full md:w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={selectedApiId}
          onChange={(e) => setSelectedApiId(e.target.value)}
        >
          <option value="">Select an API</option>
          {apis?.map(a => (
            <option key={a._id} value={a._id}>{a.name}</option>
          ))}
        </select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active & Revoked Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedApiId ? (
            <div className="text-center text-muted-foreground py-8">Please select an API to view its keys.</div>
          ) : isLoading ? (
            <div className="h-32 flex items-center justify-center">Loading keys...</div>
          ) : keys?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No keys generated for this API yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys?.map((k) => (
                  <TableRow key={k._id}>
                    <TableCell className="font-mono text-xs">***{k._id.toString().slice(-4)}</TableCell>
                    <TableCell>
                      <span className="capitalize text-sm font-medium">
                        {k.plan || 'free'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${k.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {k.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {k.usage?.limit?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={k.usage?.remaining === 0 ? 'text-destructive font-bold' : ''}>
                        {k.usage?.remaining?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(k.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      {k.status === 'active' && (
                        <Button variant="destructive" size="sm" onClick={() => {
                          if (confirm('Revoke this key? It will instantly stop working.')) {
                            revokeKey.mutate(k._id);
                          }
                        }}>
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Generate API Key">
        {generatedKey ? (
          <div className="space-y-4">
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm">
              Please copy your new API key now. You won't be able to see it again!
            </div>
            <div className="p-4 bg-secondary font-mono text-center rounded-md text-lg break-all">
              {generatedKey}
            </div>
            <Button className="w-full" onClick={() => setIsModalOpen(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Select an API to generate a new key for.</p>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedApiId}
              onChange={(e) => setSelectedApiId(e.target.value)}
            >
              <option value="">Select an API</option>
              {apis?.map(a => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={() => generateKey.mutate()} disabled={!selectedApiId || generateKey.isPending}>
                {generateKey.isPending ? 'Generating...' : 'Generate Key'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

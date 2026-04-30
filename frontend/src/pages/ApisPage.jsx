import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Modal } from '../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export default function ApisPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newApi, setNewApi] = useState({ name: '', baseUrl: '', description: '' });

  const { data: apis = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['apis'],
    queryFn: async () => {
      const res = await api.get('apis');
      return res.data.data || [];
    }
  });

  const createApi = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('apis', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['apis']);
      setIsModalOpen(false);
      setNewApi({ name: '', baseUrl: '', description: '' });
    }
  });

  const deleteApi = useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`apis/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['apis']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createApi.mutate(newApi);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-48 bg-muted rounded"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card border rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-card">
        <h3 className="text-lg font-semibold">Failed to load APIs</h3>
        <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">APIs Management</h2>
          <p className="text-muted-foreground">Manage your registered APIs and endpoints.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>Register API</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered APIs</CardTitle>
        </CardHeader>
        <CardContent>
          {apis.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No APIs found. Register your first API to get started.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>Register API</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Base URL</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apis.map((apiItem) => (
                  <TableRow key={apiItem._id}>
                    <TableCell className="font-medium">{apiItem.name || '-'}</TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[200px]">{apiItem.baseUrl || '-'}</TableCell>
                    <TableCell className="truncate max-w-[200px]">{apiItem.description || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${apiItem.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-secondary text-secondary-foreground'}`}>
                        {apiItem.status || 'active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => {
                        if (confirm('Are you sure you want to delete this API?')) {
                          deleteApi.mutate(apiItem._id);
                        }
                      }}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* Modal remains same but I'll ensure it closes on cancel */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New API">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">API Name</Label>
            <Input
              id="name"
              placeholder="e.g. Payment Gateway"
              value={newApi.name}
              onChange={(e) => setNewApi(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              placeholder="https://api.example.com"
              value={newApi.baseUrl}
              onChange={(e) => setNewApi(prev => ({ ...prev, baseUrl: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Handles payment processing..."
              value={newApi.description}
              onChange={(e) => setNewApi(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createApi.isPending}>
              {createApi.isPending ? 'Creating...' : 'Create API'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

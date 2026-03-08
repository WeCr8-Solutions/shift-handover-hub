import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Calendar, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Loader2,
  Edit2
} from 'lucide-react';
import { format, differenceInDays, isPast, isToday, addDays } from 'date-fns';

interface OutsideProcessingItem {
  id: string;
  queue_item_id: string;
  step_number: number;
  operation_name: string;
  outside_vendor: string | null;
  po_number: string | null;
  expected_return_date: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  queue_item?: {
    work_order: string;
    part_number: string;
    title: string;
  };
}

export function OutsideProcessingManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<OutsideProcessingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [editingItem, setEditingItem] = useState<OutsideProcessingItem | null>(null);

  useEffect(() => {
    fetchOutsideProcessing();
  }, [statusFilter]);

  const fetchOutsideProcessing = async () => {
    setIsLoading(true);
    
    let query = supabase
      .from('work_order_routing')
      .select(`
        *,
        queue_item:queue_items(work_order, part_number, title)
      `)
      .eq('operation_type', 'outside_processing')
      .order('expected_return_date', { ascending: true, nullsFirst: false });

    if (statusFilter === 'active') {
      query = query.in('status', ['pending', 'in_progress']);
    } else if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching outside processing:', error);
      toast({
        title: 'Error',
        description: 'Failed to load outside processing items',
        variant: 'destructive',
      });
    } else {
      setItems(data || []);
    }
    setIsLoading(false);
  };

  const updateItem = async (id: string, updates: Partial<OutsideProcessingItem>) => {
    const { error } = await supabase
      .from('work_order_routing')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update item',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Updated',
        description: 'Outside processing item updated',
      });
      fetchOutsideProcessing();
      setEditingItem(null);
    }
  };

  const markReceived = async (item: OutsideProcessingItem) => {
    await updateItem(item.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  };

  const getStatusBadge = (item: OutsideProcessingItem) => {
    if (item.status === 'completed') {
      return <Badge className="bg-green-500">Received</Badge>;
    }
    
    if (!item.expected_return_date) {
      return <Badge variant="secondary">Pending</Badge>;
    }

    const returnDate = new Date(item.expected_return_date);
    const today = new Date();
    const daysUntil = differenceInDays(returnDate, today);

    if (isPast(returnDate) && !isToday(returnDate)) {
      return <Badge variant="destructive">Overdue by {Math.abs(daysUntil)} days</Badge>;
    }
    if (isToday(returnDate)) {
      return <Badge className="bg-orange-500">Due Today</Badge>;
    }
    if (daysUntil <= 3) {
      return <Badge className="bg-yellow-500 text-black">Due in {daysUntil} days</Badge>;
    }
    return <Badge variant="secondary">Due in {daysUntil} days</Badge>;
  };

  const stats = {
    total: items.length,
    overdue: items.filter(i => i.expected_return_date && isPast(new Date(i.expected_return_date)) && i.status !== 'completed').length,
    dueThisWeek: items.filter(i => {
      if (!i.expected_return_date || i.status === 'completed') return false;
      const returnDate = new Date(i.expected_return_date);
      const weekFromNow = addDays(new Date(), 7);
      return returnDate <= weekFromNow && !isPast(returnDate);
    }).length,
    atVendor: items.filter(i => i.status === 'in_progress').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6" />
            Outside Processing
          </h2>
          <p className="text-muted-foreground">
            Track parts sent to external vendors for processing
          </p>
        </div>
        <Button variant="outline" onClick={fetchOutsideProcessing} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={stats.overdue > 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${stats.overdue > 0 ? 'bg-destructive/10' : 'bg-secondary'}`}>
                <AlertTriangle className={`w-5 h-5 ${stats.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.overdue}</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.dueThisWeek}</p>
                <p className="text-sm text-muted-foreground">Due This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.atVendor}</p>
                <p className="text-sm text-muted-foreground">At Vendor</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Label>Status:</Label>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">At Vendor</SelectItem>
            <SelectItem value="completed">Received</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No outside processing items found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work Order</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>PO #</TableHead>
                  <TableHead>Expected Return</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.queue_item?.work_order || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">{item.queue_item?.part_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{item.operation_name}</p>
                        <p className="text-sm text-muted-foreground">Step {item.step_number}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                        {item.outside_vendor || <span className="text-muted-foreground">Not set</span>}
                      </div>
                    </TableCell>
                    <TableCell>{item.po_number || '-'}</TableCell>
                    <TableCell>
                      {item.expected_return_date 
                        ? format(new Date(item.expected_return_date), 'MMM d, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setEditingItem(item)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Outside Processing</DialogTitle>
                              <DialogDescription>
                                Update vendor, PO, and return date information
                              </DialogDescription>
                            </DialogHeader>
                            {editingItem && (
                              <EditOutsideProcessingForm 
                                item={editingItem} 
                                onSave={(updates) => updateItem(editingItem.id, updates)}
                                onCancel={() => setEditingItem(null)}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        {item.status !== 'completed' && (
                          <Button 
                            size="sm" 
                            onClick={() => markReceived(item)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Received
                          </Button>
                        )}
                      </div>
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

interface EditFormProps {
  item: OutsideProcessingItem;
  onSave: (updates: Partial<OutsideProcessingItem>) => void;
  onCancel: () => void;
}

function EditOutsideProcessingForm({ item, onSave, onCancel }: EditFormProps) {
  const [vendor, setVendor] = useState(item.outside_vendor || '');
  const [poNumber, setPoNumber] = useState(item.po_number || '');
  const [returnDate, setReturnDate] = useState(item.expected_return_date || '');
  const [notes, setNotes] = useState(item.notes || '');
  const [status, setStatus] = useState(item.status);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      outside_vendor: vendor || null,
      po_number: poNumber || null,
      expected_return_date: returnDate || null,
      notes: notes || null,
      status,
      started_at: status === 'in_progress' && !item.started_at ? new Date().toISOString() : item.started_at,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Vendor</Label>
          <Input
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            placeholder="Vendor name..."
          />
        </div>
        <div className="space-y-2">
          <Label>PO Number</Label>
          <Input
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="PO-..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Expected Return Date</Label>
          <Input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">At Vendor</SelectItem>
              <SelectItem value="completed">Received</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  );
}

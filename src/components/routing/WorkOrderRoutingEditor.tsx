import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Factory, 
  Truck, 
  ClipboardCheck, 
  PackageCheck,
  ExternalLink,
  ArrowDown,
  Save,
  Loader2,
  Edit2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface RoutingStep {
  id?: string;
  step_number: number;
  operation_name: string;
  operation_type: 'internal' | 'outside_processing' | 'inspection' | 'shipping';
  work_center_type?: string;
  estimated_duration?: number;
  instructions?: string;
  outside_vendor?: string;
  po_number?: string;
  expected_return_date?: string;
}

interface WorkOrderRoutingEditorProps {
  queueItemId: string;
  workOrderNumber: string;
  partNumber?: string;
  onClose?: () => void;
}

const OPERATION_TYPES = [
  { value: 'internal', label: 'Internal Process', icon: Factory, color: 'bg-blue-500' },
  { value: 'outside_processing', label: 'Outside Processing', icon: Truck, color: 'bg-orange-500' },
  { value: 'inspection', label: 'Inspection/QC', icon: ClipboardCheck, color: 'bg-purple-500' },
  { value: 'shipping', label: 'Shipping', icon: PackageCheck, color: 'bg-green-500' },
];

const WORK_CENTER_TYPES = [
  'CNC Mill', 'CNC Lathe', 'Water Jet', 'TIG Welding', 'MIG Welding', 
  'Press Brake', 'Punch Press', 'Deburr', 'Assembly', 'Incoming Inspection',
  'In-Process Inspection', 'Final Inspection', 'Heat Treat', 'Plating', 
  'Paint', 'Packaging', 'Tool Crib'
];

export function WorkOrderRoutingEditor({ 
  queueItemId, 
  workOrderNumber, 
  partNumber,
  onClose 
}: WorkOrderRoutingEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [steps, setSteps] = useState<RoutingStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);

  useEffect(() => {
    fetchRouting();
  }, [queueItemId]);

  const fetchRouting = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('work_order_routing')
      .select('*')
      .eq('queue_item_id', queueItemId)
      .order('step_number', { ascending: true });

    if (error) {
      console.error('Error fetching routing:', error);
    } else if (data && data.length > 0) {
      setSteps(data.map(d => ({
        id: d.id,
        step_number: d.step_number,
        operation_name: d.operation_name,
        operation_type: d.operation_type as RoutingStep['operation_type'],
        work_center_type: d.station_id || undefined,
        estimated_duration: d.estimated_duration || undefined,
        instructions: d.notes || undefined,
        outside_vendor: d.outside_vendor || undefined,
        po_number: d.po_number || undefined,
        expected_return_date: d.expected_return_date || undefined,
      })));
    } else {
      // Initialize with common manufacturing flow
      setSteps([
        { step_number: 1, operation_name: 'Receive Material', operation_type: 'inspection' },
        { step_number: 2, operation_name: 'First Operation', operation_type: 'internal' },
        { step_number: 3, operation_name: 'Final Inspection', operation_type: 'inspection' },
        { step_number: 4, operation_name: 'Ship to Customer', operation_type: 'shipping' },
      ]);
    }
    setIsLoading(false);
  };

  const addStep = (afterIndex: number) => {
    const newStep: RoutingStep = {
      step_number: afterIndex + 2,
      operation_name: 'New Operation',
      operation_type: 'internal',
    };
    
    const newSteps = [...steps];
    newSteps.splice(afterIndex + 1, 0, newStep);
    
    // Renumber steps
    setSteps(newSteps.map((s, i) => ({ ...s, step_number: i + 1 })));
    setEditingStep(afterIndex + 1);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === steps.length - 1)
    ) return;

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const updateStep = (index: number, updates: Partial<RoutingStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      // Delete existing steps
      await supabase
        .from('work_order_routing')
        .delete()
        .eq('queue_item_id', queueItemId);

      // Insert new steps
      const { error } = await supabase
        .from('work_order_routing')
        .insert(steps.map(s => ({
          queue_item_id: queueItemId,
          step_number: s.step_number,
          operation_name: s.operation_name,
          operation_type: s.operation_type,
          estimated_duration: s.estimated_duration,
          notes: s.instructions,
          outside_vendor: s.outside_vendor,
          po_number: s.po_number,
          expected_return_date: s.expected_return_date,
        })));

      if (error) throw error;

      toast({
        title: 'Routing Saved',
        description: `${steps.length} steps saved for work order ${workOrderNumber}`,
      });

      onClose?.();
    } catch (error: any) {
      console.error('Error saving routing:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save routing',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getOperationType = (type: string) => 
    OPERATION_TYPES.find(t => t.value === type) || OPERATION_TYPES[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Production Routing
          </h2>
          <p className="text-sm text-muted-foreground">
            WO: {workOrderNumber} {partNumber && `• Part: ${partNumber}`}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Routing
            </>
          )}
        </Button>
      </div>

      {/* Flow Visualization */}
      <div className="relative space-y-2">
        {steps.map((step, index) => {
          const opType = getOperationType(step.operation_type);
          const OpIcon = opType.icon;
          const isEditing = editingStep === index;

          return (
            <div key={index}>
              {/* Step Card */}
              <Card className={`relative ${isEditing ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Step Number & Icon */}
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-10 h-10 rounded-full ${opType.color} flex items-center justify-center text-white`}>
                        <OpIcon className="w-5 h-5" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Step {step.step_number}
                      </Badge>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 space-y-3">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Operation Name</Label>
                              <Input
                                value={step.operation_name}
                                onChange={(e) => updateStep(index, { operation_name: e.target.value })}
                                placeholder="Operation name..."
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Type</Label>
                              <Select 
                                value={step.operation_type} 
                                onValueChange={(v) => updateStep(index, { operation_type: v as RoutingStep['operation_type'] })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {OPERATION_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>
                                      {t.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {step.operation_type === 'internal' && (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Work Center</Label>
                                <Select 
                                  value={step.work_center_type || 'none'} 
                                  onValueChange={(v) => updateStep(index, { work_center_type: v === 'none' ? undefined : v })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Not specified</SelectItem>
                                    {WORK_CENTER_TYPES.map(t => (
                                      <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Est. Duration (min)</Label>
                                <Input
                                  type="number"
                                  value={step.estimated_duration || ''}
                                  onChange={(e) => updateStep(index, { estimated_duration: parseInt(e.target.value) || undefined })}
                                  placeholder="Minutes..."
                                />
                              </div>
                            </div>
                          )}

                          {step.operation_type === 'outside_processing' && (
                            <div className="grid grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Vendor</Label>
                                <Input
                                  value={step.outside_vendor || ''}
                                  onChange={(e) => updateStep(index, { outside_vendor: e.target.value })}
                                  placeholder="Vendor name..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">PO Number</Label>
                                <Input
                                  value={step.po_number || ''}
                                  onChange={(e) => updateStep(index, { po_number: e.target.value })}
                                  placeholder="PO-..."
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Expected Return</Label>
                                <Input
                                  type="date"
                                  value={step.expected_return_date || ''}
                                  onChange={(e) => updateStep(index, { expected_return_date: e.target.value })}
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <Label className="text-xs">Instructions</Label>
                            <Textarea
                              value={step.instructions || ''}
                              onChange={(e) => updateStep(index, { instructions: e.target.value })}
                              placeholder="Special instructions or notes..."
                              rows={2}
                            />
                          </div>

                          <Button 
                            size="sm" 
                            onClick={() => setEditingStep(null)}
                          >
                            Done Editing
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{step.operation_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {opType.label}
                            </Badge>
                            {step.work_center_type && (
                              <Badge variant="outline" className="text-xs">
                                {step.work_center_type}
                              </Badge>
                            )}
                          </div>
                          {step.outside_vendor && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              {step.outside_vendor}
                              {step.po_number && ` • PO: ${step.po_number}`}
                              {step.expected_return_date && ` • Return: ${step.expected_return_date}`}
                            </p>
                          )}
                          {step.estimated_duration && (
                            <p className="text-sm text-muted-foreground">
                              Est. {step.estimated_duration} min
                            </p>
                          )}
                          {step.instructions && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {step.instructions}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => moveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => moveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => setEditingStep(index)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeStep(index)}
                          disabled={steps.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Add Step Button */}
              <div className="flex items-center justify-center py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => addStep(index)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Step
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

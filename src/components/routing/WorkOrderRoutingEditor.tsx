import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
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
  ArrowRight,
  Save,
  Loader2,
  Edit2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileDown,
  BookTemplate,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Station {
  id: string;
  name: string;
  station_id: string;
  work_center: string;
  work_center_type: string;
}

interface RoutingStep {
  id?: string;
  step_number: number;
  operation_name: string;
  operation_type: 'quote' | 'engineering' | 'purchasing' | 'receiving' | 'internal' | 'inspection' | 'outside_processing' | 'shipping';
  station_id?: string;
  station_name?: string;
  work_center_type?: string;
  estimated_duration?: number;
  instructions?: string;
  outside_vendor?: string;
  po_number?: string;
  expected_return_date?: string;
  enabled?: boolean; // For toggling steps on/off in template mode
}

interface WorkOrderRoutingEditorProps {
  queueItemId: string;
  workOrderNumber: string;
  partNumber?: string;
  onClose?: () => void;
}

const OPERATION_TYPES = [
  { value: 'quote', label: 'Quoting/Estimating', icon: Factory, color: 'bg-muted', ring: '' },
  { value: 'engineering', label: 'Engineering/Programming', icon: Factory, color: 'bg-role-org-admin', ring: '' },
  { value: 'purchasing', label: 'Purchasing/Procurement', icon: Factory, color: 'bg-info', ring: '' },
  { value: 'receiving', label: 'Receiving/Material Handling', icon: Factory, color: 'bg-info', ring: '' },
  { value: 'internal', label: 'Machine Process', icon: Factory, color: 'bg-status-waiting', ring: '' },
  { value: 'inspection', label: 'Quality Check', icon: ClipboardCheck, color: 'bg-role-org-owner', ring: '' },
  { value: 'outside_processing', label: 'Outside Processing', icon: Truck, color: 'bg-warning', ring: 'ring-2 ring-warning ring-offset-2 ring-offset-background' },
  { value: 'shipping', label: 'Shipping/Delivery', icon: PackageCheck, color: 'bg-status-ok', ring: '' },
];

// Complete manufacturing lifecycle from quote to ship with all standard shop floor steps
const DEFAULT_ROUTING_STEPS: RoutingStep[] = [
  // Pre-Production Phase
  { step_number: 1, operation_name: 'Quote Review & Approval', operation_type: 'quote', enabled: true },
  { step_number: 2, operation_name: 'Engineering Review', operation_type: 'engineering', enabled: true },
  { step_number: 3, operation_name: 'Programming/CAM', operation_type: 'engineering', enabled: true },
  { step_number: 4, operation_name: 'Materials Purchasing', operation_type: 'purchasing', enabled: true },
  { step_number: 5, operation_name: 'Materials Receiving', operation_type: 'receiving', enabled: true },
  { step_number: 6, operation_name: 'Incoming Inspection', operation_type: 'inspection', enabled: true },
  
  // Material Prep Phase
  { step_number: 7, operation_name: 'Material Cutting/Prep', operation_type: 'internal', enabled: true },
  { step_number: 8, operation_name: 'Tool Setup & Prep', operation_type: 'internal', enabled: true },
  { step_number: 9, operation_name: 'Measuring Tool Calibration', operation_type: 'internal', enabled: false },
  
  // Production Phase
  { step_number: 10, operation_name: 'First Article Setup', operation_type: 'internal', enabled: true },
  { step_number: 11, operation_name: 'First Article Inspection', operation_type: 'inspection', enabled: true },
  { step_number: 12, operation_name: 'Production Run - Op 10', operation_type: 'internal', enabled: true },
  { step_number: 13, operation_name: 'In-Process Inspection', operation_type: 'inspection', enabled: false },
  { step_number: 14, operation_name: 'Production Run - Op 20', operation_type: 'internal', enabled: false },
  { step_number: 15, operation_name: 'Production Run - Op 30', operation_type: 'internal', enabled: false },
  
  // Secondary Operations
  { step_number: 16, operation_name: 'Deburr/Finish', operation_type: 'internal', enabled: true },
  { step_number: 17, operation_name: 'Hardware Installation', operation_type: 'internal', enabled: false },
  { step_number: 18, operation_name: 'Assembly', operation_type: 'internal', enabled: false },
  
  // Outside Processing (distinct amber hue for external vendor steps)
  { step_number: 19, operation_name: 'OP - Heat Treat', operation_type: 'outside_processing', enabled: false },
  { step_number: 20, operation_name: 'OP - Plating (Zinc, Cadmium, Chrome)', operation_type: 'outside_processing', enabled: false },
  { step_number: 21, operation_name: 'OP - Anodize (Type II/III)', operation_type: 'outside_processing', enabled: false },
  { step_number: 22, operation_name: 'OP - Chem Film / Passivation', operation_type: 'outside_processing', enabled: false },
  { step_number: 23, operation_name: 'OP - Paint / Powder Coat', operation_type: 'outside_processing', enabled: false },
  { step_number: 24, operation_name: 'OP - NDT (X-Ray, FPI, MPI)', operation_type: 'outside_processing', enabled: false },
  { step_number: 25, operation_name: 'OP - Grinding / Lapping', operation_type: 'outside_processing', enabled: false },
  { step_number: 26, operation_name: 'OP - Other Surface Treatment', operation_type: 'outside_processing', enabled: false },
  
  // Post-OP Inspection (returns to shop)
  { step_number: 27, operation_name: 'Post-OP Receiving Inspection', operation_type: 'inspection', enabled: false },
  
  // Final Phase
  { step_number: 28, operation_name: 'Final Inspection', operation_type: 'inspection', enabled: true },
  { step_number: 29, operation_name: 'Packaging', operation_type: 'internal', enabled: true },
  { step_number: 30, operation_name: 'Ship to Customer', operation_type: 'shipping', enabled: true },
];
// Auto-suggest a station for a routing step based on operation_type → work_center_type mapping
function autoSuggestStation(step: RoutingStep, stations: Station[]): Station | undefined {
  const typeMap: Record<string, string[]> = {
    'internal': ['CNC Mill', 'CNC Lathe', 'Manual Mill', 'Manual Lathe', 'Grinding', 'EDM', 'Surface Grinder'],
    'inspection': ['CMM', 'Inspection', 'Quality'],
    'outside_processing': [], // No internal station for outside processing
    'engineering': ['Engineering', 'Programming', 'CAM'],
    'receiving': ['Receiving', 'Material Handling', 'Shipping'],
    'shipping': ['Shipping', 'Packing'],
    'purchasing': [],
    'quote': [],
  };

  const matchTypes = typeMap[step.operation_type] || [];
  if (matchTypes.length === 0) return undefined;

  // Find a station whose work_center_type or work_center name matches
  return stations.find(s =>
    matchTypes.some(mt =>
      s.work_center_type?.toLowerCase().includes(mt.toLowerCase()) ||
      s.work_center?.toLowerCase().includes(mt.toLowerCase()) ||
      s.name?.toLowerCase().includes(mt.toLowerCase())
    )
  );
}

interface OrgTemplate {
  id: string;
  name: string;
  description?: string | null;
  part_number_pattern?: string | null;
}

export function WorkOrderRoutingEditor({ 
  queueItemId, 
  workOrderNumber, 
  partNumber,
  onClose 
}: WorkOrderRoutingEditorProps) {
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const { toast } = useToast();
  const [steps, setSteps] = useState<RoutingStep[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [showTemplateMode, setShowTemplateMode] = useState(false);
  const [orgTemplates, setOrgTemplates] = useState<OrgTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('scratch');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [hasExistingRouting, setHasExistingRouting] = useState(false);
  const flowScrollRef = useRef<HTMLDivElement>(null);

  // Save as Template dialog state
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplatePattern, setNewTemplatePattern] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Fetch stations for the organization
  useEffect(() => {
    const fetchStations = async () => {
      if (!organization?.id) return;
      
      const { data, error } = await supabase
        .from('stations')
        .select('id, name, station_id, work_center, work_center_type')
        .eq('organization_id', organization.id)
        .eq('is_active', true)
        .order('work_center_type', { ascending: true });
      
      if (!error && data) {
        setStations(data);
      }
    };
    
    fetchStations();
  }, [organization?.id]);

  // Fetch org routing templates
  useEffect(() => {
    const fetchTemplates = async () => {
      if (!organization?.id) return;
      const { data } = await supabase
        .from('routing_templates')
        .select('id, name, description, part_number_pattern')
        .eq('organization_id', organization.id)
        .order('name');
      if (data) setOrgTemplates(data);
    };
    fetchTemplates();
  }, [organization?.id]);

  useEffect(() => {
    fetchRouting();
  }, [queueItemId, stations]);

  const fetchRouting = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('work_order_routing')
      .select(`
        *,
        stations:station_id (
          id,
          name,
          station_id,
          work_center_type
        )
      `)
      .eq('queue_item_id', queueItemId)
      .order('step_number', { ascending: true });

    if (error) {
      console.error('Error fetching routing:', error);
    } else if (data && data.length > 0) {
      setHasExistingRouting(true);
      setSteps(data.map(d => {
        const stationData = d.stations as any;
        return {
          id: d.id,
          step_number: d.step_number,
          operation_name: d.operation_name,
          operation_type: d.operation_type as RoutingStep['operation_type'],
          station_id: d.station_id || undefined,
          station_name: stationData?.name || undefined,
          work_center_type: stationData?.work_center_type || undefined,
          estimated_duration: d.estimated_duration || undefined,
          instructions: d.notes || undefined,
          outside_vendor: d.outside_vendor || undefined,
          po_number: d.po_number || undefined,
          expected_return_date: d.expected_return_date || undefined,
        };
      }));
    } else {
      setHasExistingRouting(false);
      // Initialize with complete manufacturing flow template
      const autoSuggestedSteps = DEFAULT_ROUTING_STEPS.map(s => {
        const suggestedStation = autoSuggestStation(s, stations);
        return {
          ...s,
          station_id: suggestedStation?.id,
          station_name: suggestedStation?.name,
          work_center_type: suggestedStation?.work_center_type,
        };
      });
      setSteps(autoSuggestedSteps);
      setShowTemplateMode(true);
      if (stations.length > 0) {
        toast({
          title: 'Smart Routing Applied',
          description: 'Stations auto-suggested based on your organization setup. Toggle and adjust as needed.',
        });
      }
    }
    setIsLoading(false);
  };

  // Load an org template's steps
  const loadOrgTemplate = async (templateId: string) => {
    if (templateId === 'scratch') {
      const autoSuggestedSteps = DEFAULT_ROUTING_STEPS.map(s => {
        const suggestedStation = autoSuggestStation(s, stations);
        return {
          ...s,
          station_id: suggestedStation?.id,
          station_name: suggestedStation?.name,
          work_center_type: suggestedStation?.work_center_type,
        };
      });
      setSteps(autoSuggestedSteps);
      setShowTemplateMode(true);
      setSelectedTemplateId('scratch');
      return;
    }

    setLoadingTemplate(true);
    const { data: templateSteps, error } = await supabase
      .from('routing_template_steps')
      .select('*')
      .eq('template_id', templateId)
      .order('step_number');

    if (error || !templateSteps) {
      toast({ title: 'Error', description: 'Failed to load template steps', variant: 'destructive' });
      setLoadingTemplate(false);
      return;
    }

    // Map template steps → routing steps with auto-suggested stations
    const mapped: RoutingStep[] = templateSteps.map((ts, idx) => {
      // Try to match work_center_type to a station
      const matchedStation = stations.find(s =>
        s.work_center_type?.toLowerCase() === ts.work_center_type?.toLowerCase() ||
        s.work_center?.toLowerCase().includes(ts.work_center_type?.toLowerCase() || '') ||
        s.name?.toLowerCase().includes(ts.work_center_type?.toLowerCase() || '')
      );

      return {
        step_number: idx + 1,
        operation_name: ts.operation_name || `Step ${idx + 1}`,
        operation_type: (ts.operation_type || 'internal') as RoutingStep['operation_type'],
        station_id: matchedStation?.id,
        station_name: matchedStation?.name,
        work_center_type: matchedStation?.work_center_type || ts.work_center_type || undefined,
        estimated_duration: ts.setup_time_minutes
          ? (ts.setup_time_minutes + (ts.cycle_time_minutes || 0) + (ts.first_article_minutes || 0))
          : undefined,
        instructions: ts.instructions || undefined,
        enabled: true,
      };
    });

    setSteps(mapped);
    setShowTemplateMode(true);
    setSelectedTemplateId(templateId);
    setLoadingTemplate(false);

    const template = orgTemplates.find(t => t.id === templateId);
    toast({
      title: 'Template Loaded',
      description: `"${template?.name}" loaded with ${mapped.length} steps. Stations auto-mapped where possible.`,
    });
  };

  // Save current routing as a new org template
  const handleSaveAsTemplate = async () => {
    if (!organization?.id || !user || !newTemplateName.trim()) return;
    setSavingTemplate(true);

    try {
      // Create template
      const { data: newTemplate, error: tplErr } = await supabase
        .from('routing_templates')
        .insert({
          organization_id: organization.id,
          name: newTemplateName.trim(),
          description: newTemplateDesc.trim() || null,
          part_number_pattern: newTemplatePattern.trim() || null,
          created_by: user.id,
        })
        .select('id')
        .single();

      if (tplErr || !newTemplate) throw tplErr || new Error('Failed to create template');

      // Save enabled steps as template steps
      const stepsToSave = enabledSteps.map((s, idx) => ({
        template_id: newTemplate.id,
        organization_id: organization.id,
        step_number: idx + 1,
        operation_name: s.operation_name,
        operation_type: s.operation_type,
        work_center_type: s.work_center_type || s.station_name || null,
        setup_time_minutes: s.estimated_duration || null,
        instructions: s.instructions || null,
      }));

      const { error: stepsErr } = await supabase
        .from('routing_template_steps')
        .insert(stepsToSave);

      if (stepsErr) throw stepsErr;

      toast({
        title: 'Template Saved',
        description: `"${newTemplateName}" saved with ${stepsToSave.length} steps.`,
      });

      // Refresh templates list
      setOrgTemplates(prev => [...prev, { id: newTemplate.id, name: newTemplateName.trim() }]);
      setSaveTemplateOpen(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
      setNewTemplatePattern('');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save template', variant: 'destructive' });
    } finally {
      setSavingTemplate(false);
    }
  };

  // Filter to only enabled steps for saving
  const enabledSteps = steps.filter(s => s.enabled !== false);

  // Group stations by work center type for easier selection
  const stationsByType = stations.reduce((acc, station) => {
    const type = station.work_center_type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(station);
    return acc;
  }, {} as Record<string, Station[]>);

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

      // Only save enabled steps, renumber them sequentially
      // Sanitize values: empty strings → null for date/numeric columns
      const stepsToSave = enabledSteps.map((s, idx) => ({
        queue_item_id: queueItemId,
        organization_id: organization!.id,
        step_number: idx + 1,
        operation_name: s.operation_name,
        operation_type: s.operation_type,
        station_id: s.station_id || null,
        estimated_duration: s.estimated_duration && !isNaN(Number(s.estimated_duration)) ? Number(s.estimated_duration) : null,
        notes: s.instructions || null,
        outside_vendor: s.outside_vendor || null,
        po_number: s.po_number || null,
        expected_return_date: s.expected_return_date && s.expected_return_date.trim() !== '' ? s.expected_return_date : null,
      }));

      const { error } = await supabase
        .from('work_order_routing')
        .insert(stepsToSave);

      if (error) throw error;

      toast({
        title: 'Routing Saved',
        description: `${stepsToSave.length} steps saved for work order ${workOrderNumber}`,
      });

      setShowTemplateMode(false);

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
    <div className="space-y-4 pb-20 sm:pb-6">
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <Factory className="w-5 h-5 shrink-0" />
            <span className="truncate">Production Routing</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            WO: {workOrderNumber} {partNumber && `• Part: ${partNumber}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Save as Template */}
          <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={enabledSteps.length === 0} data-tour="routing-save-template" className="text-xs sm:text-sm">
                <BookTemplate className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Save as Template</span>
                <span className="sm:hidden">Template</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Save Routing as Template</DialogTitle>
                <DialogDescription>
                  Save the current {enabledSteps.length} enabled steps as a reusable org template.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label>Template Name *</Label>
                  <Input
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Valve Body Standard"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Part Number Pattern</Label>
                  <Input
                    value={newTemplatePattern}
                    onChange={(e) => setNewTemplatePattern(e.target.value)}
                    placeholder="e.g. VLV-* (optional)"
                  />
                  <p className="text-xs text-muted-foreground">Auto-suggest this template when part numbers match</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveAsTemplate} disabled={!newTemplateName.trim() || savingTemplate}>
                  {savingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Save button — also duplicated in sticky footer on mobile */}
          <Button onClick={handleSave} disabled={isSaving} data-tour="routing-save" size="sm" className="hidden sm:inline-flex">
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
      </div>

      {/* Org Template Selector — show when no existing routing saved */}
      {!hasExistingRouting && orgTemplates.length > 0 && (
        <Card className="border-dashed" data-tour="routing-template-selector">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <Label className="text-sm font-medium">Load from Org Template</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={(v) => loadOrgTemplate(v)}
                  disabled={loadingTemplate}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Start from scratch or select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scratch">Start from scratch (30-step default)</SelectItem>
                    {orgTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                        {t.part_number_pattern && ` (${t.part_number_pattern})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {loadingTemplate && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Mode Header */}
      {showTemplateMode && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-sm font-medium flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Template Mode: Toggle steps on/off to customize your routing
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Enabled: {enabledSteps.length} steps • Disabled steps won't be saved
          </p>
        </div>
      )}

      {/* Horizontal Flow Visualization */}
      <div className="relative">
        {/* Scroll arrow buttons */}
        {steps.length > 3 && (
          <>
            <button
              type="button"
              onClick={() => flowScrollRef.current?.scrollBy({ left: -280, behavior: "smooth" })}
              className="absolute left-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-r from-background to-transparent flex items-center justify-start pl-1 hover:from-background/90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => flowScrollRef.current?.scrollBy({ left: 280, behavior: "smooth" })}
              className="absolute right-0 top-0 bottom-0 z-10 w-10 bg-gradient-to-l from-background to-transparent flex items-center justify-end pr-1 hover:from-background/90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        <div
          ref={flowScrollRef}
          className="flex gap-2 overflow-x-auto py-4 px-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent snap-x"
          style={{ scrollbarWidth: "thin" }}
        >
          {steps.map((step, index) => {
            const opType = getOperationType(step.operation_type);
            const OpIcon = opType.icon;
            const isEditing = editingStep === index;
            const isEnabled = step.enabled !== false;

            return (
              <div key={index} className="flex items-start gap-1 snap-start shrink-0">
                {/* Compact step card */}
                <div
                  className={cn(
                    "relative flex flex-col items-center border rounded-lg bg-card transition-all cursor-pointer shrink-0",
                    isEditing ? "ring-2 ring-primary w-[320px]" : "w-[140px] hover:border-primary/50 hover:shadow-sm",
                    !isEnabled && "opacity-50 bg-muted/30",
                    step.operation_type === "outside_processing" && isEnabled && "border-amber-400 bg-amber-500/5 dark:bg-amber-500/10"
                  )}
                  onClick={() => !isEditing && setEditingStep(index)}
                >
                  {/* Compact view */}
                  {!isEditing && (
                    <div className="p-3 flex flex-col items-center gap-2 w-full">
                      {showTemplateMode && (
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => { e.stopPropagation(); updateStep(index, { enabled: e.target.checked }); }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-primary text-primary focus:ring-primary absolute top-2 right-2"
                        />
                      )}
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0",
                        opType.color,
                        !isEnabled && "grayscale",
                        opType.ring
                      )}>
                        <OpIcon className="w-5 h-5" />
                      </div>
                      <Badge variant={step.operation_type === "outside_processing" ? "default" : "outline"}
                        className={cn("text-[10px] px-1.5 py-0", step.operation_type === "outside_processing" && isEnabled && "bg-amber-500 text-white hover:bg-amber-600")}
                      >
                        {isEnabled ? `Step ${enabledSteps.indexOf(step) + 1}` : "Off"}
                      </Badge>
                      <span className="text-xs font-medium text-center leading-tight line-clamp-2">
                        {step.operation_name}
                      </span>
                      <Badge variant="secondary" className="text-[9px]">{opType.label}</Badge>
                      {step.station_name && (
                        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {step.station_name}
                        </span>
                      )}
                      {step.outside_vendor && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <ExternalLink className="w-2.5 h-2.5" />
                          {step.outside_vendor}
                        </span>
                      )}
                      {/* Move / Delete actions */}
                      <div className="flex gap-0.5 mt-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveStep(index, 'up'); }} disabled={index === 0}>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); moveStep(index, 'down'); }} disabled={index === steps.length - 1}>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); removeStep(index); }} disabled={steps.length <= 1}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Expanded editing view */}
                  {isEditing && (
                    <div className="p-4 space-y-3 w-full" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white", opType.color, opType.ring)}>
                            <OpIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold">Step {step.step_number}</span>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setEditingStep(null)} className="h-7 text-xs">
                          Done
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Operation Name</Label>
                          <Input value={step.operation_name} onChange={(e) => updateStep(index, { operation_name: e.target.value })} placeholder="Operation name..." className="h-8 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Type</Label>
                          <Select value={step.operation_type} onValueChange={(v) => updateStep(index, { operation_type: v as RoutingStep['operation_type'] })}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {OPERATION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {(step.operation_type === 'internal' || step.operation_type === 'inspection' || step.operation_type === 'engineering') && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />Station</Label>
                            <Select value={step.station_id || 'none'} onValueChange={(v) => {
                              const selectedStation = stations.find(s => s.id === v);
                              updateStep(index, { station_id: v === 'none' ? undefined : v, station_name: selectedStation?.name, work_center_type: selectedStation?.work_center_type });
                            }}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select station..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Not assigned</SelectItem>
                                {Object.entries(stationsByType).map(([type, typeStations]) => (
                                  <SelectGroup key={type}>
                                    <SelectLabel className="text-xs text-muted-foreground">{type}</SelectLabel>
                                    {typeStations.map(station => <SelectItem key={station.id} value={station.id}>{station.name} ({station.station_id})</SelectItem>)}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Est. Duration (min)</Label>
                            <Input type="number" value={step.estimated_duration || ''} onChange={(e) => updateStep(index, { estimated_duration: parseInt(e.target.value) || undefined })} placeholder="Minutes..." className="h-8 text-sm" />
                          </div>
                        </div>
                      )}

                      {step.operation_type === 'outside_processing' && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Vendor</Label>
                            <Input value={step.outside_vendor || ''} onChange={(e) => updateStep(index, { outside_vendor: e.target.value })} placeholder="Vendor name..." className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">PO Number</Label>
                            <Input value={step.po_number || ''} onChange={(e) => updateStep(index, { po_number: e.target.value })} placeholder="PO-..." className="h-8 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Expected Return</Label>
                            <Input type="date" value={step.expected_return_date || ''} onChange={(e) => updateStep(index, { expected_return_date: e.target.value })} className="h-8 text-sm" />
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs">Instructions</Label>
                        <Textarea value={step.instructions || ''} onChange={(e) => updateStep(index, { instructions: e.target.value })} placeholder="Special instructions..." rows={2} className="text-sm" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <div className="flex flex-col items-center justify-center self-center shrink-0 px-0.5">
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add step at the end */}
          <button
            type="button"
            onClick={() => addStep(steps.length - 1)}
            className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border border-dashed border-muted-foreground/30 min-w-[100px] hover:border-primary/50 hover:bg-muted/50 transition-colors shrink-0 snap-start self-center"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add Step</span>
          </button>
        </div>
      </div>
    </div>
  );
}

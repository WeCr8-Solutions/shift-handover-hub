import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgContext } from "@/contexts/OrgContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { 
  Loader2, MoreHorizontal, Plus, Search, Route, Trash2, Pencil, Copy, 
  Factory, Truck, ClipboardCheck, PackageCheck, ChevronUp, ChevronDown,
  ArrowRight, GripVertical, List, GitBranch
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RoutingTemplateStep {
  id?: string;
  template_id?: string;
  step_number: number;
  operation_name: string;
  operation_type: string;
  work_center_type: string | null;
  estimated_duration: number | null;
  setup_time_minutes: number | null;
  first_article_minutes: number | null;
  cycle_time_minutes: number | null;
  instructions: string | null;
}

interface RoutingTemplate {
  id: string;
  name: string;
  description: string | null;
  part_number_pattern: string | null;
  is_default: boolean | null;
  organization_id: string;
  created_at: string;
  steps?: RoutingTemplateStep[];


const OPERATION_TYPES = [
  { value: 'quote', label: 'Quoting/Estimating', icon: Factory, color: 'bg-muted' },
  { value: 'engineering', label: 'Engineering/Programming', icon: Factory, color: 'bg-role-org-admin' },
  { value: 'purchasing', label: 'Purchasing/Procurement', icon: Factory, color: 'bg-info' },
  { value: 'receiving', label: 'Receiving/Material Handling', icon: Factory, color: 'bg-info' },
  { value: 'internal', label: 'Internal Process', icon: Factory, color: 'bg-status-waiting' },
  { value: 'outside_processing', label: 'Outside Processing', icon: Truck, color: 'bg-warning' },
  { value: 'inspection', label: 'Inspection/QC', icon: ClipboardCheck, color: 'bg-role-org-owner' },
  { value: 'shipping', label: 'Shipping', icon: PackageCheck, color: 'bg-status-ok' },
];

const WORK_CENTER_TYPES = [
  // Engineering & Planning
  'Quoting', 'Engineering', 'Programming/CAM',
  // Purchasing & Receiving
  'Purchasing', 'Receiving', 'Material Handling',
  // Cutting & Prep
  'Saw', 'Water Jet', 'Laser Cutter', 'Plasma Cutter', 'Shear',
  // Machining
  'CNC Mill', 'CNC Lathe', 'Manual Mill', 'Manual Lathe', 'EDM', 'Grinder',
  // Fabrication
  'Press Brake', 'Punch Press', 'TIG Welding', 'MIG Welding', 'EB Welding', 'Spot Welding',
  // Secondary Operations
  'Deburr', 'Hardware Installation', 'Assembly', 'Tool Crib',
  // Quality
  'Incoming Inspection', 'In-Process Inspection', 'Final Inspection', 'CMM',
  // Outside Processing
  'Heat Treat', 'Plating', 'Paint', 'Anodize', 'Passivation',
  // Shipping
  'Packaging', 'Shipping'
];

interface RoutingTemplateManagementProps {
  isAdmin: boolean;
  canManageTemplates?: boolean;
}

export function RoutingTemplateManagement({ isAdmin, canManageTemplates }: RoutingTemplateManagementProps) {
  // Allow org owners, org admins, supervisors, and platform admins to manage templates
  const canManage = canManageTemplates ?? isAdmin;
  const { user } = useAuth();
  const { organization } = useOrgContext();
  const { toast } = useToast();
  
  const [templates, setTemplates] = useState<RoutingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RoutingTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    part_number_pattern: "",
    is_default: false,
  });

  // Default comprehensive manufacturing template - the standard shop floor workflow
  // Uses industry-standard operation numbers (increments of 10)
  const getDefaultSteps = (): RoutingTemplateStep[] => [
    // Pre-Production (10-60)
    { step_number: 10, operation_name: '10 - Quote Review & Approval', operation_type: 'quote', work_center_type: 'Quoting', estimated_duration: 30, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Review quote and customer requirements' },
    { step_number: 20, operation_name: '20 - Engineering Review', operation_type: 'engineering', work_center_type: 'Engineering', estimated_duration: 60, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Review drawings, tolerances, and material specs' },
    { step_number: 30, operation_name: '30 - CNC Programming', operation_type: 'engineering', work_center_type: 'Programming/CAM', estimated_duration: 120, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Create CNC programs and toolpaths' },
    { step_number: 40, operation_name: '40 - Purchasing', operation_type: 'purchasing', work_center_type: 'Purchasing', estimated_duration: 30, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Order raw materials and special tooling' },
    { step_number: 50, operation_name: '50 - Receiving', operation_type: 'receiving', work_center_type: 'Receiving', estimated_duration: 15, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Receive and verify material certifications' },
    { step_number: 60, operation_name: '60 - Incoming Inspection', operation_type: 'inspection', work_center_type: 'Incoming Inspection', estimated_duration: 30, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Verify material dimensions and condition' },
    // Material Prep (70-80)
    { step_number: 70, operation_name: '70 - Material Cutting', operation_type: 'internal', work_center_type: 'Saw', estimated_duration: 30, setup_time_minutes: 10, first_article_minutes: null, cycle_time_minutes: 2, instructions: 'Cut material to rough size' },
    { step_number: 80, operation_name: '80 - Tool Setup', operation_type: 'internal', work_center_type: 'Tool Crib', estimated_duration: 45, setup_time_minutes: 45, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Pull and verify tooling, fixtures, and gages' },
    // Production (90-120)
    { step_number: 90, operation_name: '90 - First Article', operation_type: 'internal', work_center_type: 'CNC Mill', estimated_duration: 90, setup_time_minutes: 45, first_article_minutes: 30, cycle_time_minutes: 5, instructions: 'Setup machine and run first article' },
    { step_number: 100, operation_name: '100 - First Article Inspection', operation_type: 'inspection', work_center_type: 'CMM', estimated_duration: 60, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Full dimensional inspection per drawing' },
    { step_number: 110, operation_name: '110 - Production Run', operation_type: 'internal', work_center_type: 'CNC Mill', estimated_duration: 240, setup_time_minutes: 15, first_article_minutes: null, cycle_time_minutes: 5, instructions: 'Complete production quantity' },
    { step_number: 120, operation_name: '120 - Deburr', operation_type: 'internal', work_center_type: 'Deburr', estimated_duration: 30, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: 1, instructions: 'Remove burrs and clean parts' },
    // Outside Processing (130-160)
    { step_number: 130, operation_name: '130 - OP Heat Treat', operation_type: 'outside_processing', work_center_type: 'Heat Treat', estimated_duration: 480, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Send to vendor for heat treatment' },
    { step_number: 140, operation_name: '140 - OP Plating', operation_type: 'outside_processing', work_center_type: 'Plating', estimated_duration: 480, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Zinc, Cad, Chrome, or other plating' },
    { step_number: 150, operation_name: '150 - OP Anodize', operation_type: 'outside_processing', work_center_type: 'Anodize', estimated_duration: 480, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Type II or Type III anodizing' },
    { step_number: 160, operation_name: '160 - OP Paint', operation_type: 'outside_processing', work_center_type: 'Paint', estimated_duration: 480, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Paint or powder coat finish' },
    // Post-OP & Final (170-200)
    { step_number: 170, operation_name: '170 - Post-OP Inspection', operation_type: 'inspection', work_center_type: 'Incoming Inspection', estimated_duration: 30, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Inspect parts returned from outside processing' },
    { step_number: 180, operation_name: '180 - Final Inspection', operation_type: 'inspection', work_center_type: 'Final Inspection', estimated_duration: 30, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Final QC check before shipping' },
    { step_number: 190, operation_name: '190 - Packaging', operation_type: 'internal', work_center_type: 'Packaging', estimated_duration: 15, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Package per customer requirements' },
    { step_number: 200, operation_name: '200 - Ship', operation_type: 'shipping', work_center_type: 'Shipping', estimated_duration: 15, setup_time_minutes: null, first_article_minutes: null, cycle_time_minutes: null, instructions: 'Generate shipping labels and ship' },
  ];

  const [steps, setSteps] = useState<RoutingTemplateStep[]>(getDefaultSteps());
  const [viewMode, setViewMode] = useState<'list' | 'flowchart'>('list');

  const fetchTemplates = useCallback(async () => {
    if (!organization) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("routing_templates")
      .select(`
        *,
        steps:routing_template_steps(*)
      `)
      .eq("organization_id", organization.id)
      .order("name");

    if (error) {
      console.error("Error fetching templates:", error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  }, [organization]);

  useEffect(() => {
    if (organization) {
      fetchTemplates();
    }
  }, [organization, fetchTemplates]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      part_number_pattern: "",
      is_default: false,
    });
    setSteps(getDefaultSteps());
    setEditingTemplate(null);
    setViewMode('list');
  };

  const handleCreate = async () => {
    if (!organization || !formData.name) {
      toast({ title: "Template name is required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    // Create template
    const { data: template, error: templateError } = await supabase
      .from("routing_templates")
      .insert({
        name: formData.name,
        description: formData.description || null,
        part_number_pattern: formData.part_number_pattern || null,
        is_default: formData.is_default,
        organization_id: organization.id,
        created_by: user?.id,
      })
      .select()
      .single();

    if (templateError) {
      toast({ title: "Failed to create template", description: templateError.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Create steps
    const { error: stepsError } = await supabase
      .from("routing_template_steps")
      .insert(steps.map(s => ({
        template_id: template.id,
        step_number: s.step_number,
        operation_name: s.operation_name,
        operation_type: s.operation_type,
        work_center_type: s.work_center_type,
        estimated_duration: s.estimated_duration,
        setup_time_minutes: s.setup_time_minutes,
        first_article_minutes: s.first_article_minutes,
        cycle_time_minutes: s.cycle_time_minutes,
        instructions: s.instructions,
        organization_id: organization!.id,
      })));

    setIsSubmitting(false);

    if (stepsError) {
      toast({ title: "Template created but failed to save steps", description: stepsError.message, variant: "destructive" });
    } else {
      toast({ title: "Routing template created" });
      setShowCreateDialog(false);
      resetForm();
      fetchTemplates();
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate) return;

    setIsSubmitting(true);

    // Update template
    const { error: templateError } = await supabase
      .from("routing_templates")
      .update({
        name: formData.name,
        description: formData.description || null,
        part_number_pattern: formData.part_number_pattern || null,
        is_default: formData.is_default,
      })
      .eq("id", editingTemplate.id);

    if (templateError) {
      toast({ title: "Failed to update template", description: templateError.message, variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    // Delete old steps and insert new ones
    await supabase
      .from("routing_template_steps")
      .delete()
      .eq("template_id", editingTemplate.id);

    const { error: stepsError } = await supabase
      .from("routing_template_steps")
      .insert(steps.map(s => ({
        template_id: editingTemplate.id,
        step_number: s.step_number,
        operation_name: s.operation_name,
        operation_type: s.operation_type,
        work_center_type: s.work_center_type,
        estimated_duration: s.estimated_duration,
        setup_time_minutes: s.setup_time_minutes,
        first_article_minutes: s.first_article_minutes,
        cycle_time_minutes: s.cycle_time_minutes,
        instructions: s.instructions,
        organization_id: organization!.id,
      })));

    setIsSubmitting(false);

    if (stepsError) {
      toast({ title: "Template updated but failed to save steps", variant: "destructive" });
    } else {
      toast({ title: "Routing template updated" });
      setEditingTemplate(null);
      resetForm();
      fetchTemplates();
    }
  };

  const handleDelete = async (template: RoutingTemplate) => {
    const { error } = await supabase
      .from("routing_templates")
      .delete()
      .eq("id", template.id);

    if (error) {
      toast({ title: "Failed to delete template", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template deleted" });
      fetchTemplates();
    }
  };

  const handleDuplicate = async (template: RoutingTemplate) => {
    if (!organization) return;

    const { data: newTemplate, error: templateError } = await supabase
      .from("routing_templates")
      .insert({
        name: `${template.name} (Copy)`,
        description: template.description,
        part_number_pattern: template.part_number_pattern,
        is_default: false,
        organization_id: organization.id,
        created_by: user?.id,
      })
      .select()
      .single();

    if (templateError || !newTemplate) {
      toast({ title: "Failed to duplicate template", variant: "destructive" });
      return;
    }

    if (template.steps && template.steps.length > 0) {
      await supabase
        .from("routing_template_steps")
        .insert(template.steps.map(s => ({
          template_id: newTemplate.id,
          step_number: s.step_number,
          operation_name: s.operation_name,
          operation_type: s.operation_type,
          work_center_type: s.work_center_type,
          estimated_duration: s.estimated_duration,
          setup_time_minutes: s.setup_time_minutes || null,
          first_article_minutes: s.first_article_minutes || null,
          cycle_time_minutes: s.cycle_time_minutes || null,
          instructions: s.instructions,
          organization_id: organization!.id,
        })));
    }

    toast({ title: "Template duplicated" });
    fetchTemplates();
  };

  const openEditDialog = (template: RoutingTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      part_number_pattern: template.part_number_pattern || "",
      is_default: template.is_default || false,
    });
    setSteps(template.steps?.map(s => ({
      step_number: s.step_number,
      operation_name: s.operation_name,
      operation_type: s.operation_type,
      work_center_type: s.work_center_type,
      estimated_duration: s.estimated_duration,
      setup_time_minutes: s.setup_time_minutes || null,
      first_article_minutes: s.first_article_minutes || null,
      cycle_time_minutes: s.cycle_time_minutes || null,
      instructions: s.instructions,
    })) || []);
  };

  const addStep = () => {
    // Calculate next operation number (increment of 10)
    const maxOpNum = steps.length > 0 ? Math.max(...steps.map(s => s.step_number)) : 0;
    const nextOpNum = Math.ceil((maxOpNum + 10) / 10) * 10;
    
    setSteps([...steps, {
      step_number: nextOpNum,
      operation_name: `${nextOpNum} - New Operation`,
      operation_type: 'internal',
      work_center_type: null,
      estimated_duration: 30,
      setup_time_minutes: null,
      first_article_minutes: null,
      cycle_time_minutes: null,
      instructions: null,
    }]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Keep existing operation numbers (don't renumber - manufacturing standard)
    setSteps(newSteps);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    // Swap positions but keep operation numbers intact (standard manufacturing practice)
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const updateStep = (index: number, updates: Partial<RoutingTemplateStep>) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.part_number_pattern?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOpType = (type: string) => OPERATION_TYPES.find(t => t.value === type) || OPERATION_TYPES[4];
  const getOpIcon = (type: string) => getOpType(type).icon;
  const getOpColor = (type: string) => getOpType(type).color;

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Join an organization to manage routing templates</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Render the form fields inline to avoid focus loss issues
  const renderTemplateFormFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="template-name">Template Name *</Label>
          <Input
            id="template-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter template name"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="part-number-pattern">Part Number Pattern</Label>
          <Input
            id="part-number-pattern"
            value={formData.part_number_pattern}
            onChange={(e) => setFormData(prev => ({ ...prev, part_number_pattern: e.target.value }))}
            placeholder="Enter part number pattern"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">Use * as wildcard to auto-match part numbers</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-description">Description</Label>
        <Textarea
          id="template-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe when to use this template..."
          rows={2}
        />
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg border">
        <div>
          <Label>Default Template</Label>
          <p className="text-xs text-muted-foreground">Apply to new work orders by default</p>
        </div>
        <Switch
          checked={formData.is_default}
          onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_default: v }))}
        />
      </div>

      {/* Steps Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Routing Steps ({steps.length} steps)</Label>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center border rounded-lg p-0.5">
              <Button 
                type="button" 
                variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4 mr-1" /> List
              </Button>
              <Button 
                type="button" 
                variant={viewMode === 'flowchart' ? 'secondary' : 'ghost'} 
                size="sm" 
                className="h-7 px-2"
                onClick={() => setViewMode('flowchart')}
              >
                <GitBranch className="w-4 h-4 mr-1" /> Flow
              </Button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addStep}>
              <Plus className="w-4 h-4 mr-1" /> Add Step
            </Button>
          </div>
        </div>
        
        {viewMode === 'list' ? (
          /* List View */
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {steps.map((step, index) => {
              const OpIcon = getOpIcon(step.operation_type);
              const isOutsideProcessing = step.operation_type === 'outside_processing';
              return (
                <div 
                  key={`step-${index}-${step.step_number}`} 
                  className={`flex items-center gap-2 p-3 rounded-lg border bg-background ${isOutsideProcessing ? 'border-amber-400 bg-amber-500/10' : ''}`}
                >
                  <div className="flex flex-col gap-0.5">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5" 
                      onClick={() => moveStep(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-5 w-5" 
                      onClick={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <Badge 
                    variant={isOutsideProcessing ? 'default' : 'outline'} 
                    className={`shrink-0 ${isOutsideProcessing ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                  >
                    {step.step_number}
                  </Badge>
                  
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={step.operation_name}
                        onChange={(e) => updateStep(index, { operation_name: e.target.value })}
                        placeholder="Operation name"
                        autoComplete="off"
                      />
                      <Select
                        value={step.operation_type}
                        onValueChange={(v) => updateStep(index, { operation_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={step.work_center_type || "none"}
                        onValueChange={(v) => updateStep(index, { work_center_type: v === "none" ? null : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Work center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not specified</SelectItem>
                          {WORK_CENTER_TYPES.map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="number"
                        value={step.setup_time_minutes ?? ""}
                        onChange={(e) => updateStep(index, { setup_time_minutes: parseInt(e.target.value) || null })}
                        placeholder="Setup (min)"
                        autoComplete="off"
                      />
                      <Input
                        type="number"
                        value={step.first_article_minutes ?? ""}
                        onChange={(e) => updateStep(index, { first_article_minutes: parseInt(e.target.value) || null })}
                        placeholder="FAI (min)"
                        autoComplete="off"
                      />
                      <Input
                        type="number"
                        value={step.cycle_time_minutes ?? ""}
                        onChange={(e) => updateStep(index, { cycle_time_minutes: parseInt(e.target.value) || null })}
                        placeholder="Cycle/Part (min)"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flowchart View */
          <div className="max-h-[400px] overflow-y-auto pr-2">
            <div className="flex flex-wrap gap-2 items-center p-4 bg-muted/30 rounded-lg border">
              {steps.map((step, index) => {
                const OpIcon = getOpIcon(step.operation_type);
                const opColor = getOpColor(step.operation_type);
                const isOutsideProcessing = step.operation_type === 'outside_processing';
                return (
                  <div key={`flow-${index}-${step.step_number}`} className="flex items-center">
                    <div 
                      className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer hover:scale-105 ${
                        isOutsideProcessing 
                          ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50' 
                          : 'border-border bg-background hover:border-primary/50'
                      }`}
                      title={`${step.operation_name}\n${step.work_center_type || 'No work center'}\n${step.estimated_duration || 0} min`}
                    >
                      <div className={`w-8 h-8 rounded-full ${opColor} flex items-center justify-center text-white`}>
                        <OpIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium leading-tight max-w-[120px] truncate">{step.operation_name}</p>
                        <p className="text-[10px] text-muted-foreground">{step.work_center_type || 'Unassigned'}</p>
                      </div>
                      <Badge variant="outline" className="absolute -top-2 -left-2 text-[10px] px-1.5 py-0 h-4">
                        {step.step_number}
                      </Badge>
                      {/* Delete button on hover */}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeStep(index)}
                        disabled={steps.length <= 1}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowRight className={`w-5 h-5 mx-1 flex-shrink-0 ${
                        steps[index + 1]?.operation_type === 'outside_processing' || isOutsideProcessing 
                          ? 'text-amber-400' 
                          : 'text-muted-foreground'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Hover over steps to see details • Outside processing steps highlighted in amber
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Routing Templates
            </CardTitle>
            <CardDescription>
              {templates.length} template(s) • Define reusable production flows
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {canManage && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Routing Template</DialogTitle>
                    <DialogDescription>
                      Define a reusable production routing for work orders
                    </DialogDescription>
                  </DialogHeader>
                  {renderTemplateFormFields()}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Template"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No routing templates yet</p>
            <p className="text-sm">Create templates to standardize production flows</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Part Pattern</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Est. Total</TableHead>
                <TableHead>Default</TableHead>
                {canManage && <TableHead className="w-12"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.map((template) => {
                const totalDuration = template.steps?.reduce((sum, s) => sum + (s.estimated_duration || 0), 0) || 0;
                return (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Route className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{template.name}</p>
                          {template.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {template.part_number_pattern ? (
                        <Badge variant="outline">{template.part_number_pattern}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Any</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {template.steps?.slice(0, 4).map((step, i) => {
                          const Icon = getOpIcon(step.operation_type);
                          return (
                            <div key={i} className="flex items-center">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                                <Icon className="w-3 h-3" />
                              </div>
                              {i < (template.steps?.length || 0) - 1 && i < 3 && (
                                <ArrowRight className="w-3 h-3 text-muted-foreground mx-0.5" />
                              )}
                            </div>
                          );
                        })}
                        {(template.steps?.length || 0) > 4 && (
                          <Badge variant="secondary" className="ml-1 text-xs">+{(template.steps?.length || 0) - 4}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{totalDuration} min</span>
                    </TableCell>
                    <TableCell>
                      {template.is_default ? (
                        <Badge>Default</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(template)} className="gap-2">
                              <Pencil className="w-4 h-4" />
                              Edit Template
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(template)} className="gap-2">
                              <Copy className="w-4 h-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(template)}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Routing Template</DialogTitle>
            <DialogDescription>
              Update the template "{editingTemplate?.name}"
            </DialogDescription>
          </DialogHeader>
          {renderTemplateFormFields()}
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

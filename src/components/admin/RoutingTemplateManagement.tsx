import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserOrganization } from "@/hooks/useUserOrganization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ArrowRight, GripVertical
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
  instructions: string | null;
}

interface RoutingTemplate {
  id: string;
  name: string;
  description: string | null;
  part_number_pattern: string | null;
  is_default: boolean;
  organization_id: string;
  created_at: string;
  steps?: RoutingTemplateStep[];
}

const OPERATION_TYPES = [
  { value: 'quote', label: 'Quoting/Estimating', icon: Factory },
  { value: 'engineering', label: 'Engineering/Programming', icon: Factory },
  { value: 'purchasing', label: 'Purchasing/Procurement', icon: Factory },
  { value: 'receiving', label: 'Receiving/Material Handling', icon: Factory },
  { value: 'internal', label: 'Internal Process', icon: Factory },
  { value: 'outside_processing', label: 'Outside Processing', icon: Truck },
  { value: 'inspection', label: 'Inspection/QC', icon: ClipboardCheck },
  { value: 'shipping', label: 'Shipping', icon: PackageCheck },
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
}

export function RoutingTemplateManagement({ isAdmin }: RoutingTemplateManagementProps) {
  const { user } = useAuth();
  const { organization } = useUserOrganization();
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

  // Default comprehensive manufacturing template
  const [steps, setSteps] = useState<RoutingTemplateStep[]>([
    // Pre-Production
    { step_number: 1, operation_name: 'Quote Review & Approval', operation_type: 'quote', work_center_type: 'Quoting', estimated_duration: 30, instructions: 'Review quote and customer requirements' },
    { step_number: 2, operation_name: 'Engineering Review', operation_type: 'engineering', work_center_type: 'Engineering', estimated_duration: 60, instructions: 'Review drawings, tolerances, and material specs' },
    { step_number: 3, operation_name: 'Programming/CAM', operation_type: 'engineering', work_center_type: 'Programming/CAM', estimated_duration: 120, instructions: 'Create CNC programs and toolpaths' },
    { step_number: 4, operation_name: 'Materials Purchasing', operation_type: 'purchasing', work_center_type: 'Purchasing', estimated_duration: 30, instructions: 'Order raw materials and special tooling' },
    { step_number: 5, operation_name: 'Materials Receiving', operation_type: 'receiving', work_center_type: 'Receiving', estimated_duration: 15, instructions: 'Receive and verify material certifications' },
    { step_number: 6, operation_name: 'Incoming Inspection', operation_type: 'inspection', work_center_type: 'Incoming Inspection', estimated_duration: 30, instructions: 'Verify material dimensions and condition' },
    // Material Prep
    { step_number: 7, operation_name: 'Material Cutting/Prep', operation_type: 'internal', work_center_type: 'Saw', estimated_duration: 30, instructions: 'Cut material to rough size' },
    { step_number: 8, operation_name: 'Tool Setup & Prep', operation_type: 'internal', work_center_type: 'Tool Crib', estimated_duration: 45, instructions: 'Pull and verify tooling, fixtures, and gages' },
    // Production
    { step_number: 9, operation_name: 'First Article Setup', operation_type: 'internal', work_center_type: 'CNC Mill', estimated_duration: 90, instructions: 'Setup machine and run first article' },
    { step_number: 10, operation_name: 'First Article Inspection', operation_type: 'inspection', work_center_type: 'CMM', estimated_duration: 60, instructions: 'Full dimensional inspection per drawing' },
    { step_number: 11, operation_name: 'Production Run', operation_type: 'internal', work_center_type: 'CNC Mill', estimated_duration: 240, instructions: 'Complete production quantity' },
    // Secondary Ops
    { step_number: 12, operation_name: 'Deburr/Finish', operation_type: 'internal', work_center_type: 'Deburr', estimated_duration: 30, instructions: 'Remove burrs and clean parts' },
    // Final
    { step_number: 13, operation_name: 'Final Inspection', operation_type: 'inspection', work_center_type: 'Final Inspection', estimated_duration: 30, instructions: 'Final QC check before shipping' },
    { step_number: 14, operation_name: 'Packaging', operation_type: 'internal', work_center_type: 'Packaging', estimated_duration: 15, instructions: 'Package per customer requirements' },
    { step_number: 15, operation_name: 'Ship to Customer', operation_type: 'shipping', work_center_type: 'Shipping', estimated_duration: 15, instructions: 'Generate shipping labels and ship' },
  ]);

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
    setSteps([
      { step_number: 1, operation_name: 'Receive Material', operation_type: 'inspection', work_center_type: null, estimated_duration: 15, instructions: null },
      { step_number: 2, operation_name: 'First Operation', operation_type: 'internal', work_center_type: 'CNC Mill', estimated_duration: 60, instructions: null },
      { step_number: 3, operation_name: 'Final Inspection', operation_type: 'inspection', work_center_type: null, estimated_duration: 30, instructions: null },
      { step_number: 4, operation_name: 'Ship to Customer', operation_type: 'shipping', work_center_type: null, estimated_duration: 15, instructions: null },
    ]);
    setEditingTemplate(null);
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
        instructions: s.instructions,
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
        instructions: s.instructions,
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
          instructions: s.instructions,
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
      instructions: s.instructions,
    })) || []);
  };

  const addStep = () => {
    setSteps([...steps, {
      step_number: steps.length + 1,
      operation_name: 'New Operation',
      operation_type: 'internal',
      work_center_type: null,
      estimated_duration: 30,
      instructions: null,
    }]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps.map((s, i) => ({ ...s, step_number: i + 1 })));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return;
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, step_number: i + 1 })));
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

  const getOpIcon = (type: string) => {
    return OPERATION_TYPES.find(t => t.value === type)?.icon || Factory;
  };

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
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const TemplateFormFields = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Template Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Standard Machining"
          />
        </div>
        <div className="space-y-2">
          <Label>Part Number Pattern</Label>
          <Input
            value={formData.part_number_pattern}
            onChange={(e) => setFormData({ ...formData, part_number_pattern: e.target.value })}
            placeholder="e.g., PART-* or *-ASSY"
          />
          <p className="text-xs text-muted-foreground">Use * as wildcard to auto-match part numbers</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
          onCheckedChange={(v) => setFormData({ ...formData, is_default: v })}
        />
      </div>

      {/* Steps Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">Routing Steps</Label>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="w-4 h-4 mr-1" /> Add Step
          </Button>
        </div>
        
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {steps.map((step, index) => {
            const OpIcon = getOpIcon(step.operation_type);
            return (
              <div key={index} className="flex items-center gap-2 p-3 rounded-lg border bg-background">
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
                
                <Badge variant="outline" className="shrink-0">{step.step_number}</Badge>
                
                <div className="flex-1 grid grid-cols-4 gap-2">
                  <Input
                    value={step.operation_name}
                    onChange={(e) => updateStep(index, { operation_name: e.target.value })}
                    placeholder="Operation name"
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
                  <Input
                    type="number"
                    value={step.estimated_duration || ""}
                    onChange={(e) => updateStep(index, { estimated_duration: parseInt(e.target.value) || null })}
                    placeholder="Duration (min)"
                  />
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
            {isAdmin && (
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
                  <TemplateFormFields />
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
                {isAdmin && <TableHead className="w-12"></TableHead>}
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
                    {isAdmin && (
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
          <TemplateFormFields />
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

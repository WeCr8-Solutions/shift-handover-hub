import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Users,
  Building2,
  Wrench,
  Loader2,
  ClipboardList,
  Layers
} from 'lucide-react';
import { downloadTemplate } from '@/lib/excelTemplates';

// Static template URL for complete setup
const STATIC_TEMPLATE_URL = '/templates/JobLine_Setup_Template.xlsx';

const downloadStaticTemplate = () => {
  const link = document.createElement('a');
  link.href = STATIC_TEMPLATE_URL;
  link.download = 'JobLine_Setup_Template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
import { useBulkUpload } from '@/hooks/useBulkUpload';
import { useBulkUploadCollisions } from '@/hooks/useBulkUploadCollisions';
import { cn } from '@/lib/utils';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function BulkUploadDialog({ open, onOpenChange, onComplete }: BulkUploadDialogProps) {
  const { 
    progress, 
    parseResult, 
    uploadResult, 
    parseFile, 
    uploadData, 
    resetState, 
    canBulkUpload, 
    organizationName 
  } = useBulkUpload();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(false);
  const collisions = useBulkUploadCollisions(parseResult?.data ?? null);

  
  const hasOrgAccess = canBulkUpload();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.[0]) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return;
    }
    setSelectedFile(file);
    await parseFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (parseResult?.data) {
      await uploadData(parseResult.data);
      onComplete?.();
    }
  };

  const handleClose = () => {
    resetState();
    setSelectedFile(null);
    onOpenChange(false);
  };

  const hasData = parseResult?.data && (
    parseResult.data.teams.length > 0 ||
    parseResult.data.departments.length > 0 ||
    parseResult.data.stations.length > 0 ||
    parseResult.data.users.length > 0 ||
    parseResult.data.workOrders.length > 0 ||
    (parseResult.data.routingTemplates?.length ?? 0) > 0
  );

  // Count cross-sheet warnings
  const crossSheetWarnings = parseResult?.warnings.filter(w => w.referencedValue) || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk Upload Data
            {organizationName && (
              <Badge variant="outline" className="ml-2 text-xs">
                {organizationName}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Upload Excel files to quickly set up teams, departments, stations, work orders, and users.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Access Check */}
          {!hasOrgAccess && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <XCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Access Denied</p>
                    <p className="text-sm text-muted-foreground">
                      Only organization admins and owners can perform bulk uploads. 
                      Please contact your organization administrator.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Download Templates */}
          {hasOrgAccess && progress.stage === 'idle' && !parseResult && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Step 1: Download Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Download our Excel templates with sample data and instructions to get started.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={downloadStaticTemplate}>
                      <Download className="w-4 h-4 mr-2" />
                      Complete Setup Template
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void downloadTemplate('workorders')}>
                      <ClipboardList className="w-4 h-4 mr-2" />
                      Work Orders Only
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void downloadTemplate('stations')}>
                      <Wrench className="w-4 h-4 mr-2" />
                      Stations Only
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void downloadTemplate('teams')}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Teams Only
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void downloadTemplate('departments')}>
                      <Layers className="w-4 h-4 mr-2" />
                      Departments Only
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void downloadTemplate('users')}>
                      <Users className="w-4 h-4 mr-2" />
                      Users Only
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Upload File */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Step 2: Upload Your File</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      dragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Drag and drop your Excel file here</p>
                    <p className="text-xs text-muted-foreground mb-4">or click to browse</p>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileInput}
                      className="hidden"
                      id="excel-upload"
                    />
                    <label htmlFor="excel-upload">
                      <Button variant="secondary" size="sm" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Order Info */}
              <Card className="bg-secondary/30">
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Processing Order:</strong> Teams → Departments → Stations → Users → Work Orders → Routing Templates
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Team names must match exactly across all sheets for proper linking.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Parsing/Uploading Progress */}
          {(progress.stage === 'parsing' || progress.stage === 'uploading') && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="font-medium">{progress.message}</span>
                </div>
                <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  {progress.current} of {progress.total}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Parse Results - Preview Data */}
          {parseResult && progress.stage !== 'uploading' && progress.stage !== 'complete' && (
            <>
              {/* Errors */}
              {parseResult.errors.length > 0 && (
                <Card className="border-destructive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Validation Errors ({parseResult.errors.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-32">
                      <ul className="text-xs space-y-1">
                        {parseResult.errors.map((error, i) => (
                          <li key={i} className="text-destructive">
                            {error.sheet} Row {error.row}, {error.column}: {error.message}
                            {error.value && <span className="text-muted-foreground"> (value: "{error.value}")</span>}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Cross-Sheet Warnings */}
              {crossSheetWarnings.length > 0 && (
                <Card className="border-yellow-500/50">
                  <CardHeader className="pb-2">
                   <CardTitle className="text-sm font-medium text-warning flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4" />
                      Cross-Reference Warnings ({crossSheetWarnings.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-24">
                      <ul className="text-xs space-y-1">
                        {crossSheetWarnings.map((warning, i) => (
                          <li key={i} className="text-warning">
                            {warning.sheet} Row {warning.row}: {warning.message}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                    <p className="text-xs text-muted-foreground mt-2">
                      These references will be matched against existing data in your organization.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Data Preview */}
              {hasData && (
                <Card>
                  <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-medium flex items-center gap-2">
                       <CheckCircle2 className="w-4 h-4 text-status-ok" />
                      Data Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="mb-3 flex-wrap h-auto gap-1">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        {parseResult.data.teams.length > 0 && (
                          <TabsTrigger value="teams">Teams ({parseResult.data.teams.length})</TabsTrigger>
                        )}
                        {parseResult.data.departments.length > 0 && (
                          <TabsTrigger value="departments">Depts ({parseResult.data.departments.length})</TabsTrigger>
                        )}
                        {parseResult.data.stations.length > 0 && (
                          <TabsTrigger value="stations">Stations ({parseResult.data.stations.length})</TabsTrigger>
                        )}
                        {parseResult.data.users.length > 0 && (
                          <TabsTrigger value="users">Users ({parseResult.data.users.length})</TabsTrigger>
                        )}
                        {parseResult.data.workOrders.length > 0 && (
                          <TabsTrigger value="workorders">Work Orders ({parseResult.data.workOrders.length})</TabsTrigger>
                        )}
                        {(parseResult.data.routingTemplates?.length ?? 0) > 0 && (
                          <TabsTrigger value="routing">Routing ({parseResult.data.routingTemplates.length})</TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="summary" className="space-y-2">
                        <div className="grid grid-cols-5 gap-2">
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <Building2 className="w-4 h-4 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.teams.length}</p>
                            <p className="text-xs text-muted-foreground">Teams</p>
                          </div>
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <Layers className="w-4 h-4 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.departments.length}</p>
                            <p className="text-xs text-muted-foreground">Departments</p>
                          </div>
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <Wrench className="w-4 h-4 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.stations.length}</p>
                            <p className="text-xs text-muted-foreground">Stations</p>
                          </div>
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <Users className="w-4 h-4 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.users.length}</p>
                            <p className="text-xs text-muted-foreground">Users</p>
                          </div>
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <ClipboardList className="w-4 h-4 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.workOrders.length}</p>
                            <p className="text-xs text-muted-foreground">Work Orders</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="teams">
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {parseResult.data.teams.map((team, i) => (
                              <div key={i} className="p-2 bg-secondary/30 rounded text-sm">
                                <p className="font-medium">{team.name}</p>
                                {team.description && (
                                  <p className="text-xs text-muted-foreground">{team.description}</p>
                                )}
                                {team.shift_schedule && (
                                  <p className="text-xs text-muted-foreground">Shift: {team.shift_schedule}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="departments">
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {parseResult.data.departments.map((dept, i) => (
                              <div key={i} className="p-2 bg-secondary/30 rounded text-sm flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{dept.name}</p>
                                  <p className="text-xs text-muted-foreground">Team: {dept.team_name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="stations">
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {parseResult.data.stations.map((station, i) => (
                              <div key={i} className="p-2 bg-secondary/30 rounded text-sm flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{station.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {station.station_id} • {station.work_center_type}
                                    {station.team_name && ` • ${station.team_name}`}
                                  </p>
                                </div>
                                <Badge variant={station.is_active ? "default" : "secondary"} className="text-xs">
                                  {station.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="users">
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {parseResult.data.users.map((user, i) => (
                              <div key={i} className="p-2 bg-secondary/30 rounded text-sm flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{user.display_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {user.email}
                                    {user.team_name && ` • ${user.team_name}`}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {user.role}
                                  </Badge>
                                  {user.org_role && (
                                    <Badge variant="secondary" className="text-xs capitalize">
                                      Org: {user.org_role}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="workorders">
                        <ScrollArea className="h-40">
                          <div className="space-y-2">
                            {parseResult.data.workOrders.map((wo, i) => (
                              <div key={i} className="p-2 bg-secondary/30 rounded text-sm flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{wo.work_order}: {wo.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {wo.part_number && `Part: ${wo.part_number} • `}
                                    {wo.station_id && `Station: ${wo.station_id} • `}
                                    {wo.due_date && `Due: ${wo.due_date}`}
                                  </p>
                                </div>
                                <div className="flex gap-1 ml-2 shrink-0">
                                  <Badge variant={wo.priority === 'critical' || wo.priority === 'urgent' ? 'destructive' : 'outline'} className="text-xs capitalize">
                                    {wo.priority}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs capitalize">
                                    {wo.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      {(parseResult.data.routingTemplates?.length ?? 0) > 0 && (
                        <TabsContent value="routing">
                          <ScrollArea className="h-40">
                            <div className="space-y-2">
                              {parseResult.data.routingTemplates.map((tmpl, i) => (
                                <div key={i} className="p-2 bg-secondary/30 rounded text-sm">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium truncate">{tmpl.template_name}</p>
                                    <Badge variant="outline" className="text-xs">{tmpl.steps.length} steps</Badge>
                                  </div>
                                  {tmpl.part_number_pattern && (
                                    <p className="text-xs text-muted-foreground">Pattern: {tmpl.part_number_pattern}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground truncate">
                                    {tmpl.steps.slice(0, 4).map(s => `${s.step_number}. ${s.operation_name}`).join(' → ')}
                                    {tmpl.steps.length > 4 && ' …'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </TabsContent>
                      )}
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Upload Complete */}
          {progress.stage === 'complete' && uploadResult && (
             <Card className="border-status-ok">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-status-ok flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Upload Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                   <div className="p-3 bg-status-ok/10 rounded-lg text-center">
                     <p className="text-lg font-bold text-status-ok">{uploadResult.teamsCreated}</p>
                     <p className="text-xs text-muted-foreground">Teams</p>
                   </div>
                   <div className="p-3 bg-status-ok/10 rounded-lg text-center">
                     <p className="text-lg font-bold text-status-ok">{uploadResult.departmentsCreated}</p>
                     <p className="text-xs text-muted-foreground">Departments</p>
                   </div>
                   <div className="p-3 bg-status-ok/10 rounded-lg text-center">
                     <p className="text-lg font-bold text-status-ok">{uploadResult.stationsCreated}</p>
                     <p className="text-xs text-muted-foreground">Stations</p>
                   </div>
                   <div className="p-3 bg-status-ok/10 rounded-lg text-center">
                     <p className="text-lg font-bold text-status-ok">{uploadResult.usersAddedToOrg}</p>
                     <p className="text-xs text-muted-foreground">Users Added</p>
                   </div>
                   <div className="p-3 bg-status-waiting/10 rounded-lg text-center">
                     <p className="text-lg font-bold text-status-waiting">{uploadResult.inviteCodesCreated}</p>
                     <p className="text-xs text-muted-foreground">Invite Codes</p>
                   </div>
                   <div className="p-3 bg-status-ok/10 rounded-lg text-center">
                     <p className="text-lg font-bold text-status-ok">{uploadResult.workOrdersCreated}</p>
                     <p className="text-xs text-muted-foreground">Work Orders</p>
                  </div>
                  <div className="p-3 bg-status-ok/10 rounded-lg text-center">
                    <p className="text-lg font-bold text-status-ok">{uploadResult.routingTemplatesCreated}</p>
                    <p className="text-xs text-muted-foreground">Routing ({uploadResult.routingStepsCreated} steps)</p>
                  </div>
                </div>

                {uploadResult.warnings.length > 0 && (
                   <div className="p-3 bg-warning/10 rounded-lg">
                     <p className="text-sm font-medium text-warning flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      Warnings ({uploadResult.warnings.length})
                    </p>
                    <ScrollArea className="h-24">
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        {uploadResult.warnings.map((warning, i) => (
                          <li key={i}>• {warning}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}

                {uploadResult.errors.length > 0 && (
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4" />
                      Errors ({uploadResult.errors.length})
                    </p>
                    <ScrollArea className="h-24">
                      <ul className="text-xs space-y-1 text-destructive">
                        {uploadResult.errors.map((error, i) => (
                          <li key={i}>• {error}</li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dry-run collision summary */}
        {hasData && parseResult?.errors.length === 0 && !uploadResult && (
          <div className="rounded-lg border bg-secondary/30 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-ok" />
                <span className="font-medium">Pre-flight collision check</span>
                {collisions.loading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  data-testid="bulk-upload-dry-run"
                />
                <span>Validate only (don&rsquo;t write to database)</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-status-ok/40 text-status-ok">
                {collisions.totalNew} new
              </Badge>
              <Badge variant="outline" className="border-warning/40 text-warning">
                {collisions.totalSkip} will be skipped
              </Badge>
              {collisions.teamDuplicates.length > 0 && (
                <Badge variant="outline" className="text-[10px]">Teams: {collisions.teamDuplicates.slice(0,3).join(', ')}{collisions.teamDuplicates.length > 3 ? '…' : ''}</Badge>
              )}
              {collisions.stationDuplicates.length > 0 && (
                <Badge variant="outline" className="text-[10px]">Stations: {collisions.stationDuplicates.slice(0,3).join(', ')}{collisions.stationDuplicates.length > 3 ? '…' : ''}</Badge>
              )}
              {collisions.workOrderDuplicates.length > 0 && (
                <Badge variant="outline" className="text-[10px]">WOs: {collisions.workOrderDuplicates.slice(0,3).join(', ')}{collisions.workOrderDuplicates.length > 3 ? '…' : ''}</Badge>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {progress.stage === 'complete' ? (
            <Button onClick={handleClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>{dryRun ? 'Close' : 'Cancel'}</Button>
              {hasData && parseResult?.errors.length === 0 && (
                <Button
                  onClick={dryRun ? handleClose : handleUpload}
                  disabled={progress.stage === 'uploading'}
                  variant={dryRun ? 'secondary' : 'default'}
                  data-testid="bulk-upload-submit"
                >
                  {progress.stage === 'uploading' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : dryRun ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Looks Good (no changes)
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Data
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

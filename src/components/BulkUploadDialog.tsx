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
  Loader2
} from 'lucide-react';
import { downloadTemplate } from '@/lib/excelTemplates';
import { useBulkUpload } from '@/hooks/useBulkUpload';
import { cn } from '@/lib/utils';

interface BulkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function BulkUploadDialog({ open, onOpenChange, onComplete }: BulkUploadDialogProps) {
  const { progress, parseResult, uploadResult, parseFile, uploadData, resetState } = useBulkUpload();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
    parseResult.data.stations.length > 0 ||
    parseResult.data.users.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Bulk Upload Data
          </DialogTitle>
          <DialogDescription>
            Upload Excel files to quickly set up teams, stations, and users.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Step 1: Download Templates */}
          {progress.stage === 'idle' && !parseResult && (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Step 1: Download Templates</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Download our Excel templates with sample data to get started.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => downloadTemplate('all')}>
                      <Download className="w-4 h-4 mr-2" />
                      Complete Setup Template
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => downloadTemplate('stations')}>
                      <Wrench className="w-4 h-4 mr-2" />
                      Stations Only
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => downloadTemplate('teams')}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Teams Only
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => downloadTemplate('users')}>
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

              {/* Data Preview */}
              {hasData && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Data Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="summary" className="w-full">
                      <TabsList className="mb-3">
                        <TabsTrigger value="summary">Summary</TabsTrigger>
                        {parseResult.data.teams.length > 0 && (
                          <TabsTrigger value="teams">Teams ({parseResult.data.teams.length})</TabsTrigger>
                        )}
                        {parseResult.data.stations.length > 0 && (
                          <TabsTrigger value="stations">Stations ({parseResult.data.stations.length})</TabsTrigger>
                        )}
                        {parseResult.data.users.length > 0 && (
                          <TabsTrigger value="users">Users ({parseResult.data.users.length})</TabsTrigger>
                        )}
                      </TabsList>

                      <TabsContent value="summary" className="space-y-2">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <Building2 className="w-5 h-5 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.teams.length}</p>
                            <p className="text-xs text-muted-foreground">Teams</p>
                          </div>
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <Wrench className="w-5 h-5 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.stations.length}</p>
                            <p className="text-xs text-muted-foreground">Stations</p>
                          </div>
                          <div className="p-3 bg-secondary/50 rounded-lg text-center">
                            <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                            <p className="text-lg font-bold">{parseResult.data.users.length}</p>
                            <p className="text-xs text-muted-foreground">Users</p>
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
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {user.role}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Upload Complete */}
          {progress.stage === 'complete' && uploadResult && (
            <Card className="border-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Upload Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-600">{uploadResult.teamsCreated}</p>
                    <p className="text-xs text-muted-foreground">Teams Created</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-600">{uploadResult.stationsCreated}</p>
                    <p className="text-xs text-muted-foreground">Stations Created</p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-lg text-center">
                    <p className="text-lg font-bold text-green-600">{uploadResult.usersInvited}</p>
                    <p className="text-xs text-muted-foreground">Users Queued</p>
                  </div>
                </div>

                {uploadResult.warnings.length > 0 && (
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <p className="text-sm font-medium text-yellow-600 flex items-center gap-2 mb-2">
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

        {/* Footer Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleClose}>
            {progress.stage === 'complete' ? 'Close' : 'Cancel'}
          </Button>
          
          <div className="flex gap-2">
            {parseResult && progress.stage !== 'complete' && progress.stage !== 'uploading' && (
              <Button 
                variant="outline" 
                onClick={() => {
                  resetState();
                  setSelectedFile(null);
                }}
              >
                Upload Different File
              </Button>
            )}
            
            {hasData && parseResult.errors.length === 0 && progress.stage !== 'complete' && progress.stage !== 'uploading' && (
              <Button onClick={handleUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload {parseResult.data.teams.length + parseResult.data.stations.length + parseResult.data.users.length} Items
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { 
  Settings2, 
  Shield, 
  Database, 
  Users, 
  Lock, 
  Unlock,
  RefreshCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Wrench
} from "lucide-react";

interface DevSetting {
  key: string;
  label: string;
  description: string;
  type: "toggle" | "select";
  options?: { value: string; label: string }[];
  category: "security" | "permissions" | "system" | "features";
  value: boolean | string;
  dangerous?: boolean;
}

const DEFAULT_SETTINGS: DevSetting[] = [
  {
    key: "rls_strict_mode",
    label: "RLS Strict Mode",
    description: "Enforce stricter row-level security checks across all tables",
    type: "toggle",
    category: "security",
    value: true,
  },
  {
    key: "auto_issue_assignment",
    label: "Auto-assign Issues to Developers",
    description: "Automatically assign new issues to available developers",
    type: "toggle",
    category: "system",
    value: false,
  },
  {
    key: "default_user_role",
    label: "Default User Role",
    description: "Role assigned to new users on signup",
    type: "select",
    category: "permissions",
    options: [
      { value: "operator", label: "Operator (Default)" },
      { value: "viewer", label: "Viewer (Read-only)" },
    ],
    value: "operator",
  },
  {
    key: "org_admin_can_assign_supervisor",
    label: "Org Admins Can Assign Supervisor Role",
    description: "Allow organization admins to grant supervisor role to their members",
    type: "toggle",
    category: "permissions",
    value: true,
  },
  {
    key: "require_email_verification",
    label: "Require Email Verification",
    description: "Users must verify email before accessing the platform",
    type: "toggle",
    category: "security",
    value: true,
  },
  {
    key: "debug_mode",
    label: "Debug Mode",
    description: "Enable verbose logging and debugging information",
    type: "toggle",
    category: "system",
    value: false,
    dangerous: true,
  },
  {
    key: "maintenance_mode",
    label: "Maintenance Mode",
    description: "Restrict access to admin/developer users only",
    type: "toggle",
    category: "system",
    value: false,
    dangerous: true,
  },
  {
    key: "test_data_seeding",
    label: "Allow Test Data Seeding",
    description: "Enable the seed test data feature in admin panel",
    type: "toggle",
    category: "features",
    value: true,
  },
];

const CATEGORY_ICONS = {
  security: Shield,
  permissions: Users,
  system: Settings2,
  features: Wrench,
};

const CATEGORY_LABELS = {
  security: "Security Settings",
  permissions: "Permission Controls",
  system: "System Configuration",
  features: "Feature Flags",
};

export function DevSettingsPanel() {
  const [settings, setSettings] = useState<DevSetting[]>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Load settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("*")
          .eq("is_system", true);

        if (error) {
          console.error("Error loading settings:", error);
          return;
        }

        // Merge loaded settings with defaults
        if (data && data.length > 0) {
          setSettings(prev => prev.map(setting => {
            const dbSetting = data.find(s => s.setting_key === setting.key);
            if (dbSetting) {
              return { ...setting, value: dbSetting.setting_value as boolean | string };
            }
            return setting;
          }));
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSetting = async (key: string, value: boolean | string) => {
    setSaving(key);
    try {
      // Optimistically update UI
      setSettings(prev => prev.map(s => 
        s.key === key ? { ...s, value } : s
      ));

      // Upsert to database
      const { error } = await supabase
        .from("app_settings")
        .upsert({
          setting_key: key,
          setting_value: value,
          is_system: true,
          setting_type: typeof value === "boolean" ? "boolean" : "string",
        }, {
          onConflict: "setting_key",
        });

      if (error) throw error;

      toast({
        title: "Setting updated",
        description: `${key.replace(/_/g, " ")} has been updated`,
      });
    } catch (error) {
      console.error("Error updating setting:", error);
      // Revert on error
      setSettings(prev => prev.map(s => 
        s.key === key ? { ...s, value: !value } : s
      ));
      toast({
        title: "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, DevSetting[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Developer Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and permissions. These settings affect all organizations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Settings by Category */}
      {(Object.keys(groupedSettings) as Array<keyof typeof CATEGORY_ICONS>).map((category) => {
        const Icon = CATEGORY_ICONS[category];
        const categorySettings = groupedSettings[category];

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                <CardTitle className="text-lg">{CATEGORY_LABELS[category]}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {categorySettings.map((setting, index) => (
                <div key={setting.key}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Label 
                          htmlFor={setting.key}
                          className="text-sm font-medium"
                        >
                          {setting.label}
                        </Label>
                        {setting.dangerous && (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Dangerous
                          </Badge>
                        )}
                        {saving === setting.key && (
                          <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {setting.description}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {setting.type === "toggle" ? (
                        <Switch
                          id={setting.key}
                          checked={setting.value as boolean}
                          onCheckedChange={(checked) => updateSetting(setting.key, checked)}
                          disabled={saving !== null}
                        />
                      ) : (
                        <Select
                          value={setting.value as string}
                          onValueChange={(value) => updateSetting(setting.key, value)}
                          disabled={saving !== null}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {setting.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common developer operations</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Refresh All Caches
          </Button>
          <Button variant="outline" className="gap-2">
            <Database className="w-4 h-4" />
            View Database Stats
          </Button>
          <Button variant="outline" className="gap-2">
            <Lock className="w-4 h-4" />
            Reset RLS Policies
          </Button>
          <Button variant="outline" className="gap-2 text-destructive border-destructive/30">
            <AlertTriangle className="w-4 h-4" />
            Clear Test Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Palette } from "lucide-react";
import { useSettingsForm } from "@/hooks/useSettingsForm";
import { SettingsSkeleton } from "./SettingsSkeleton";
import { SettingsFooter } from "./SettingsFooter";
import { SettingsSwitchRow } from "./SettingsSwitchRow";

type GeneralPreferences = {
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  language: string;
  darkModeDefault: boolean;
  autoRefreshInterval: number;
  showCompletedItems: boolean;
  defaultView: string;
};

const DEFAULT_SETTINGS: GeneralPreferences = {
  timezone: "America/New_York",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  language: "en",
  darkModeDefault: false,
  autoRefreshInterval: 30,
  showCompletedItems: true,
  defaultView: "stations",
};

export function GeneralSettings() {
  const { form, update, setForm, isDirty, isSaving, save, discard, loading } =
    useSettingsForm<GeneralPreferences>({
      settingKey: "general_preferences",
      defaults: DEFAULT_SETTINGS,
      successMessage: "Your preferences have been updated.",
    });

  if (loading) return <SettingsSkeleton rows={2} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Regional Settings
          </CardTitle>
          <CardDescription>Configure timezone, date, and time formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => update("timezone", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="America/Phoenix">Arizona (MST)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select value={form.dateFormat} onValueChange={(v) => update("dateFormat", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Format</Label>
              <Select value={form.timeFormat} onValueChange={(v) => update("timeFormat", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={form.language} onValueChange={(v) => update("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Display Preferences
          </CardTitle>
          <CardDescription>Configure how the application looks and behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingsSwitchRow
            label="Dark Mode by Default"
            description="Start the app in dark mode"
            checked={form.darkModeDefault}
            onCheckedChange={(v) => update("darkModeDefault", v)}
          />

          <SettingsSwitchRow
            label="Show Completed Items"
            description="Display completed work orders in lists"
            checked={form.showCompletedItems}
            onCheckedChange={(v) => update("showCompletedItems", v)}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default View</Label>
              <Select value={form.defaultView} onValueChange={(v) => update("defaultView", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stations">Station Grid</SelectItem>
                  <SelectItem value="queue">Work Queue</SelectItem>
                  <SelectItem value="kanban">Kanban Board</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dashboard Auto-Refresh Interval (seconds)</Label>
              <p className="text-xs text-muted-foreground">
                Controls how often dashboards silently refresh data in the background.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={10}
                  max={600}
                  value={form.autoRefreshInterval}
                  onChange={(e) => {
                    const raw = Number(e.target.value);
                    const safeValue = Number.isFinite(raw) ? Math.min(600, Math.max(10, raw)) : 300;
                    update("autoRefreshInterval", safeValue);
                  }}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">
                  ({Math.floor(form.autoRefreshInterval / 60)}m {form.autoRefreshInterval % 60}s)
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SettingsFooter
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={save}
        onDiscard={discard}
      />
    </div>
  );
}

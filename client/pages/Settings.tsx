import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Save } from "lucide-react";

export default function Settings() {
  const [name, setName] = useState("User Name");
  const [email, setEmail] = useState("user@email.com");
  const [saveHistory, setSaveHistory] = useState(true);
  const [autoVoice, setAutoVoice] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSave = () => {
    // Handle save
  };

  return (
    <AppLayout>
      <div className="min-h-[calc(100vh-8rem)] bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>

          {/* Profile Management Section */}
          <Card className="border border-border">
            <div className="p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                Profile Management
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-foreground">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Password Update Section */}
          <Card className="border border-border">
            <div className="p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                Update Password
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current" className="text-sm font-medium text-foreground">
                    Current Password
                  </Label>
                  <Input
                    id="current"
                    type="password"
                    placeholder="••••••••"
                    className="border border-border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new" className="text-sm font-medium text-foreground">
                    New Password
                  </Label>
                  <Input
                    id="new"
                    type="password"
                    placeholder="••••••••"
                    className="border border-border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium text-foreground">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="••••••••"
                    className="border border-border rounded-lg px-3 py-2"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full mt-4">
                  Update Password
                </Button>
              </div>
            </div>
          </Card>

          {/* Preferences Section */}
          <Card className="border border-border">
            <div className="p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-6">
                Preferences
              </h2>
              <div className="space-y-5">
                <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Save Analysis History
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Keep a record of your mental health assessments
                    </p>
                  </div>
                  <Switch
                    checked={saveHistory}
                    onCheckedChange={setSaveHistory}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Enable Auto Voice Input
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically start recording when chat is focused
                    </p>
                  </div>
                  <Switch
                    checked={autoVoice}
                    onCheckedChange={setAutoVoice}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-background">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-foreground">
                      Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive reminders for regular check-ins
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" className="border border-border">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

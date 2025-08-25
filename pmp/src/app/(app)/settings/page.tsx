
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Bell, Cog, HardDrive, Cpu, BrainCircuit, Users, Lock, KeyRound, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";

const passwordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters long."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

const defaultSettings = {
    emailNotifications: true,
    inAppNotifications: true,
    defaultPriority: "medium",
    defaultView: "board",
};

/**
 * The main page for managing global platform settings.
 * It includes sections for general settings, password management, and platform monitoring.
 * Accessible only to Administrators.
 * @returns {JSX.Element} The settings page component.
 */
export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
        const savedSettings = localStorage.getItem("platformSettings");
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("platformSettings", JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    setIsSaving(true);
    try {
        // Import the API utility functions
        const { apiPost } = await import('@/lib/api');
        
        const response = await apiPost('/api/auth/change-password', data);
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to update password.");
        }

        toast({
            title: "Success",
            description: "Your password has been updated successfully.",
        });
        form.reset();

    } catch (error) {
         toast({
            title: "Error",
            description: (error as Error).message,
            variant: "destructive"
        });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cog className="h-6 w-6" />
          Platform Settings
        </h1>
        <p className="text-muted-foreground">
          Manage global settings and monitor platform health.
        </p>
      </div>
      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure notification preferences and system defaults.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </h3>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates for important events.
                    </p>
                  </div>
                  <Switch id="email-notifications" checked={settings.emailNotifications} onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)} />
                </div>
                 <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified directly within the platform.
                    </p>
                  </div>
                  <Switch id="in-app-notifications" checked={settings.inAppNotifications} onCheckedChange={(checked) => handleSettingChange('inAppNotifications', checked)} />
                </div>
              </div>
              <Separator />
               <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5" />
                    System Defaults
                </h3>
                 <div className="space-y-2">
                    <Label htmlFor="default-priority">Default Task Priority</Label>
                    <Select value={settings.defaultPriority} onValueChange={(value) => handleSettingChange('defaultPriority', value)}>
                        <SelectTrigger id="default-priority">
                            <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="default-view">Default Project View</Label>
                    <Select value={settings.defaultView} onValueChange={(value) => handleSettingChange('defaultView', value)}>
                        <SelectTrigger id="default-view">
                            <SelectValue placeholder="Select view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="board">Task Board</SelectItem>
                            <SelectItem value="list">List</SelectItem>
                            <SelectItem value="calendar">Calendar</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Change Password</CardTitle>
                <CardDescription>Update your password. Ensure it is strong and unique.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="oldPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your current password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Enter your new password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Confirm your new password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Update Password
                        </Button>
                    </form>
                </Form>
            </CardContent>
           </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>Platform Monitoring</CardTitle>
              <CardDescription>
                Overview of system usage and performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Users className="h-6 w-6 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">Active Users</p>
                        <p className="text-2xl font-bold">42</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Cpu className="h-4 w-4" /> CPU Usage</Label>
                    <Progress value={65} />
                    <p className="text-xs text-muted-foreground text-right">65%</p>
                </div>
                 <div className="space-y-2">
                    <Label className="flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> Memory Usage</Label>
                    <Progress value={45} />
                    <p className="text-xs text-muted-foreground text-right">45%</p>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage</Label>
                    <Progress value={80} />
                    <p className="text-xs text-muted-foreground text-right">400GB / 500GB)</p>
                </div>
                <Button className="w-full">View Detailed Analytics</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

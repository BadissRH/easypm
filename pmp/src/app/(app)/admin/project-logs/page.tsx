"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectLog = {
  _id: string;
  project: {
    _id: string;
    name: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  action: string;
  details: any;
  timestamp: string;
};

/**
 * Admin page for viewing all project activity logs across the system.
 * Only accessible to administrators.
 * @returns {JSX.Element} The admin project logs page component
 */
export default function AdminProjectLogsPage() {
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllProjectLogs = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { apiGet } = await import("@/lib/api");
        const res = await apiGet(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/logs`
        );
        if (!res.ok) throw new Error("Failed to fetch project logs.");
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        setError((err as Error).message);
        toast({
          title: "Error",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllProjectLogs();
  }, [toast]);

  // Helper function to format the timestamp
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Helper function to get badge variant based on action type
  const getActionBadgeVariant = (action: string) => {
    if (action.includes("Created")) return "default";
    if (action.includes("Updated") || action.includes("Changed")) return "outline";
    if (action.includes("Deleted")) return "destructive";
    return "secondary";
  };

  // Helper function to format details for display
  const formatDetails = (action: string, details: any) => {
    if (!details) return "";

    switch (action) {
      case "Created":
        return `Created project: ${details.name}`;
      case "Updated":
        return "Updated project details";
      case "Deleted":
        return `Deleted project: ${details.name}`;
      case "Status Changed":
        return `Status changed from "${details.from}" to "${details.to}"`;
      case "Progress Updated":
        return `Progress updated from ${details.from}% to ${details.to}%`;
      case "Team Changed":
        return `Team members ${details.added?.length ? "added" : ""} ${details.removed?.length ? "removed" : ""}`;
      case "Task Created":
        return `Created task: ${details.title}`;
      case "Task Updated":
        return `Updated task: ${details.title}`;
      case "Task Status Changed":
        return `Task "${details.title}" status changed from "${details.from}" to "${details.to}"`;
      case "Task Reassigned":
        return `Task "${details.title}" reassigned`;
      case "Task Deleted":
        return `Deleted task: ${details.title}`;
      case "Comment Added":
        return `Comment added to task: ${details.title}`;
      default:
        return JSON.stringify(details);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          All Project Activity Logs
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System-wide Project Activity</CardTitle>
          <CardDescription>
            Comprehensive audit trail of all project-related actions across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && !isLoading && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell className="font-medium">
                        {log.project?.name || "Unknown Project"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {log.user?.name
                                ? log.user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{log.user?.name || "Unknown User"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {formatDetails(log.action, log.details)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(log.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No project activity logs found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
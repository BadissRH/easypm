
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheck, LogIn, LogOut, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * @typedef {object} LogEntry - Represents a single authentication log entry.
 * @property {string} id - The unique identifier for the log entry.
 * @property {"Login Success" | "Login Failure" | "Logout" | "Password Reset"} event - The type of authentication event.
 * @property {string} user - The name of the user associated with the event.
 * @property {string} email - The email of the user.
 * @property {string} ipAddress - The IP address from which the event originated.
 * @property {string} timestamp - The timestamp of the event.
 */
type LogEntry = {
  id: string;
  event: "Login Success" | "Login Failure" | "Logout" | "Password Reset";
  user: string;
  email: string;
  ipAddress: string;
  timestamp: string;
};

/**
 * Returns visual properties (icon, badge variant, label) for a given log event type.
 * @param {LogEntry["event"]} event - The type of log event.
 * @returns {{icon: JSX.Element | null, variant: "secondary" | "destructive" | "outline" | "default", label: string}} The visual properties for the event.
 */
const getEventVisuals = (event: LogEntry["event"]) => {
    switch (event) {
        case "Login Success":
            return { icon: <LogIn className="h-4 w-4 text-green-500" />, variant: "secondary" as const, label: "Login Success" };
        case "Login Failure":
            return { icon: <LogIn className="h-4 w-4 text-red-500" />, variant: "destructive" as const, label: "Login Failure" };
        case "Logout":
            return { icon: <LogOut className="h-4 w-4 text-muted-foreground" />, variant: "outline" as const, label: "Logout" };
        case "Password Reset":
            return { icon: <KeyRound className="h-4 w-4 text-blue-500" />, variant: "default" as const, label: "Password Reset" };
        default:
            return { icon: null, variant: "outline" as const, label: event };
    }
}

/**
 * The main page for viewing security and authentication logs.
 * It displays a table of recent events such as logins, logouts, and password resets.
 * Accessible only to Administrators.
 * @returns {JSX.Element} The security logs page component.
 */
export default function SecurityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Import the API utility functions
            const { apiGet } = await import('@/lib/api');
            
            const res = await apiGet('/api/security/logs');
            if (!res.ok) throw new Error("Failed to fetch security logs.");
            const data = await res.json();
            setLogs(data);
        } catch (err) {
            setError((err as Error).message);
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchLogs();
  }, [toast]);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Security Logs
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Authentication Events</CardTitle>
          <CardDescription>
            A log of recent user authentication and security-related activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
            ) : error ? (
                 <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden sm:table-cell">IP Address</TableHead>
                        <TableHead className="hidden md:table-cell">Timestamp</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {logs.map((log) => {
                        const { icon, variant, label } = getEventVisuals(log.event);
                        return (
                        <TableRow key={log.id}>
                            <TableCell>
                            <div className="flex items-center gap-2">
                                {icon}
                                <Badge variant={variant}>{label}</Badge>
                            </div>
                            </TableCell>
                            <TableCell>
                            <div className="font-medium">{log.user}</div>
                            <div className="text-sm text-muted-foreground">{log.email}</div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">{log.ipAddress}</TableCell>
                            <TableCell className="hidden md:table-cell">{log.timestamp}</TableCell>
                        </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ProjectLogs from "./project-logs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BarChart as BarChartIcon, Clock, Target, Loader2, AlertCircle } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type ProjectInfo = {
  id: string;
  name: string;
};

type ReportData = {
    status: string;
    deadline: string;
    progress: number;
    budget: { used: number; total: number };
    tasks: { todo: number; inProgress: number; completed: number };
    team: { name: string; avatar: string; fallback: string; tasksCompleted: number }[];
}

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(var(--chart-4))",
  },
  todo: {
    label: "To Do",
    color: "hsl(var(--chart-1))",
  },
};

/**
 * The main page for viewing project reports.
 * It allows users to select a project and view detailed analytics including
 * status, budget, progress, task breakdown, and team performance.
 * Accessible to Administrators and Project Managers.
 * @returns {JSX.Element} The reporting page component.
 */
export default function ReportingPage() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("selectedReportProjectId");
    }
    return null;
  });
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedProjectId) {
      localStorage.setItem("selectedReportProjectId", selectedProjectId);
    } else {
      localStorage.removeItem("selectedReportProjectId");
    }
  }, [selectedProjectId]);

  useEffect(() => {
    const fetchProjects = async () => {
        setIsProjectsLoading(true);
        setError(null);
        try {
            // Import the API utility functions
            const { apiGet } = await import('@/lib/api');
            const res = await apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`);
            if (!res.ok) throw new Error("Failed to fetch projects.");
            const data = await res.json();
            setProjects(data);

            const storedProjectId = localStorage.getItem('selectedReportProjectId');
            if (storedProjectId && data.some((p: ProjectInfo) => p.id === storedProjectId)) {
                setSelectedProjectId(storedProjectId);
            } else if (data.length > 0) {
                setSelectedProjectId(data[0].id);
            }
        } catch (err) {
            setError((err as Error).message);
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsProjectsLoading(false);
        }
    };
    fetchProjects();
  }, [toast]);

  useEffect(() => {
    if (!selectedProjectId) {
      setReportData(null);
      return;
    };

    const fetchReportData = async () => {
        setIsReportLoading(true);
        setError(null);
        try {
            // Import the API utility functions
            const { apiGet } = await import('@/lib/api');
            const res = await apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reports/${selectedProjectId}`);
            if (!res.ok) throw new Error("Failed to fetch report data for the selected project.");
            const data = await res.json();
            setReportData(data);
        } catch (err) {
            setError((err as Error).message);
            setReportData(null);
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsReportLoading(false);
        }
    }
    fetchReportData();
  }, [selectedProjectId, toast]);


  const chartData = reportData ? [
    { label: "To Do", tasks: reportData.tasks.todo, fill: "var(--color-todo)" },
    { label: "In Progress", tasks: reportData.tasks.inProgress, fill: "var(--color-inProgress)" },
    { label: "Completed", tasks: reportData.tasks.completed, fill: "var(--color-completed)" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChartIcon className="h-6 w-6" />
          Project Reports
        </h1>
        <div className="w-full sm:w-auto sm:max-w-xs">
          <Select
            value={selectedProjectId || ""}
            onValueChange={(value) => setSelectedProjectId(value)}
            disabled={isProjectsLoading || projects.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder={isProjectsLoading ? "Loading projects..." : "Select a project"} />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

       {error && !isReportLoading && !reportData && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}


      {isReportLoading ? (
         <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Skeleton className="lg:col-span-2 h-80" />
            <Skeleton className="lg:col-span-3 h-80" />
          </div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
                <CardTitle>Project Summary: {projects.find(p=>p.id === selectedProjectId)?.name}</CardTitle>
                <CardDescription>High-level overview of the project's status and progress.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <Badge>{reportData.status}</Badge>
                        </CardContent>
                     </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Deadline</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground"/>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{reportData.deadline}</div>
                        </CardContent>
                     </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Budget Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="text-lg font-bold">${reportData.budget.used.toLocaleString()} / ${reportData.budget.total.toLocaleString()}</div>
                             <Progress value={(reportData.budget.used / reportData.budget.total) * 100} className="mt-2" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="text-lg font-bold">{reportData.progress}%</div>
                             <Progress value={reportData.progress} className="mt-2" />
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Task Status Breakdown</CardTitle>
                <CardDescription>Distribution of tasks by their current status.</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                  <BarChart layout="vertical" data={chartData} margin={{left: 10}}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} />
                    <XAxis dataKey="tasks" type="number" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="tasks" radius={5} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
                <CardDescription>Tasks completed by each team member on this project.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead className="text-right">Tasks Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.team.map((member) => (
                          <TableRow key={member.name}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait"/>
                                  <AvatarFallback>{member.fallback}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{member.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold">{member.tasksCompleted}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Project Activity Logs */}
          <ProjectLogs projectId={selectedProjectId} />
        </div>
      ) : (
        !isProjectsLoading && !error && (
            <Card>
            <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">Please select a project to view its report.</p>
            </CardContent>
            </Card>
        )
      )}
    </div>
  );
}


"use client";

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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ListFilter,
  ArrowUpDown,
  FilePlus,
  CalendarClock,
  MessageSquare,
  X,
  FolderKanban,
  MoreHorizontal,
  Edit,
  Trash2,
  Paperclip,
  Upload,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import React, { useState, useMemo, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { format, parseISO, isPast, isToday, differenceInDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


/**
 * @typedef {"To Do" | "In Progress" | "Completed"} TaskStatus - The possible statuses for a task.
 */
type TaskStatus = "To Do" | "In Progress" | "Completed";

/**
 * @typedef {"Low" | "Medium" | "High"} TaskPriority - The possible priority levels for a task.
 */
type TaskPriority = "Low" | "Medium" | "High";

/**
 * @typedef {object} Comment - Represents a comment made on a task.
 * @property {string} id - The unique identifier for the comment.
 * @property {object} author - The author of the comment.
 * @property {string} author.name - The name of the author.
 * @property {string} author.avatar - The URL for the author's avatar.
 * @property {string} author.fallback - The fallback text for the avatar.
 * @property {string} text - The content of the comment.
 * @property {string} timestamp - The timestamp when the comment was made.
 */
type Comment = {
  id: string;
  author: {
    name: string;
    avatar: string;
    fallback: string;
  };
  text: string;
  timestamp: string;
};

/**
 * @typedef {object} Attachment - Represents a file attached to a task.
 * @property {string} name - The name of the file.
 * @property {string} url - The URL to access the file.
 * @property {string} type - The type of the file (e.g., 'PDF', 'PNG').
 */
type Attachment = {
  name: string;
  url: string;
  type: string;
};

/**
 * @typedef {object} Task - Represents a task within a project.
 * @property {string} id - The unique identifier for the task.
 * @property {string} title - The title of the task.
 * @property {string} description - A detailed description of the task.
 * @property {TaskStatus} status - The current status of the task.
 * @property {TaskPriority} priority - The priority level of the task.
 * @property {object} project - The project the task belongs to.
 * @property {string} project.id - The id of the project.
 * @property {string} project.name - The name of the project.
 * @property {string} deadline - The deadline for the task.
 * @property {object} assignee - The user assigned to the task.
 * @property {string} assignee.id - The id of the assignee.
 * @property {string} assignee.name - The name of the assignee.
 * @property {string} assignee.avatar - The URL for the assignee's avatar.
 * @property {string} assignee.fallback - The fallback text for the avatar.
 * @property {Comment[]} comments - A list of comments on the task.
 * @property {Attachment[]} attachments - A list of files attached to the task.
 */
type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: {
    id: string;
    name: string;
  };
  deadline: string;
  assignee: {
    id: string;
    name: string;
    avatar: string;
    fallback: string;
  };
  comments: Comment[];
  attachments: Attachment[];
};

type Project = {
    id: string;
    name: string;
    progress: number;
}

type DashboardStats = {
    totalProjects: number;
    tasksCompleted: number;
    overdueTasks: number;
    activeTeamMembers: number;
}

const chartConfig = {
  progress: {
    label: "Progress",
  },
  project: {
    label: "Project",
    color: "hsl(var(--chart-1))",
  },
};


/**
 * Renders the dashboard for users with 'Administrator' or 'Project Manager' roles.
 * Displays high-level statistics, project progress, and recent task updates.
 * @returns {JSX.Element} The manager and admin dashboard component.
 */
const ManagerAdminDashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Import the API utility functions
                const { apiGet } = await import('@/lib/api');
                
                const [statsRes, projectsRes, tasksRes] = await Promise.all([
                    apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard/stats`),
                    apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects?limit=5`),
                    apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/recent`)
                ]);

                if (!statsRes.ok || !projectsRes.ok || !tasksRes.ok) {
                    throw new Error("Failed to fetch dashboard data. Please check if the backend is running.");
                }

                const statsData = await statsRes.json();
                const projectsData = await projectsRes.json();
                const tasksData = await tasksRes.json();

                setStats(statsData);
                setProjects(projectsData);
                setRecentTasks(tasksData);
            } catch (err) {
                const errorMessage = (err as Error).message;
                setError(errorMessage);
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [toast]);
    
    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
                 <div className="grid gap-4 lg:grid-cols-7">
                    <Skeleton className="lg:col-span-4 h-96" />
                    <Skeleton className="lg:col-span-3 h-96" />
                </div>
            </div>
        );
    }
    
    if (error) {
         return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Load Dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }


    return (
        <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProjects}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                Tasks Completed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.tasksCompleted}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.overdueTasks}</div>
            </CardContent>
            </Card>
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats?.activeTeamMembers}</div>
            </CardContent>
            </Card>
        </div>
        <div className="grid gap-4 lg:grid-cols-7">
            <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>Project Progress</CardTitle>
                <CardDescription>
                An overview of current project completion rates.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                <BarChart
                    accessibilityLayer
                    data={projects}
                    layout="vertical"
                    margin={{ left: 10, top: 10, right: 10, bottom: 10 }}
                    onClick={(data) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                            const project = data.activePayload[0].payload;
                            window.location.href = `/projects/${project.id}`;
                        }
                    }}
                >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    width={80}
                    tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                    />
                    <XAxis dataKey="progress" type="number" hide />
                    <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="progress" layout="vertical" radius={5} fill="var(--color-project)">
                    </Bar>
                </BarChart>
                </ChartContainer>
            </CardContent>
            </Card>
            <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Recent Tasks</CardTitle>
                <CardDescription>
                A list of recently updated tasks.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {recentTasks.length > 0 ? (
                            recentTasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell>
                                <div className="font-medium">{task.title}</div>
                                <div className="text-sm text-muted-foreground">
                                    {task.project?.name || "Unknown Project"}
                                </div>
                                </TableCell>
                                <TableCell>
                                <Badge variant={task.status === "Completed" ? "default" : "secondary"}>
                                    {task.status}
                                </Badge>
                                </TableCell>
                                <TableCell>
                                <Badge variant={task.priority === "High" ? "destructive" : "outline"}>
                                    {task.priority}
                                </Badge>
                                </TableCell>
                            </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No recent tasks found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
            </CardContent>
            </Card>
        </div>
        </div>
    );
}

// --- Data for Collaborator Dashboard ---

const taskProgressChartConfig = {
  tasks: { label: "Tasks" },
  todo: { label: "To Do", color: "hsl(var(--chart-1))" },
  inProgress: { label: "In Progress", color: "hsl(var(--chart-4))" },
  completed: { label: "Completed", color: "hsl(var(--chart-2))" },
};

/**
 * @typedef {'deadline' | 'priority' | 'status'} SortKey - The keys by which tasks can be sorted.
 */
type SortKey = 'deadline' | 'priority' | 'status';

/**
 * A dialog component for viewing and interacting with a task's details.
 * It allows users to change status, add comments, and upload attachments.
 * @param {object} props - The component props.
 * @param {Task | null} props.task - The task to display details for.
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {() => void} props.onClose - Function to call when the dialog should close.
 * @param {(taskId: string, commentText: string) => void} props.onComment - Function to handle adding a new comment.
 * @param {(taskId: string, status: TaskStatus) => void} props.onStatusChange - Function to handle changing the task status.
 * @param {(taskId: string, file: File) => void} props.onAttachmentAdd - Function to handle adding a new attachment.
 * @returns {JSX.Element | null} The task detail dialog or null if no task is selected.
 */
const TaskDetailDialog = ({
    task,
    isOpen,
    onClose,
    onComment,
    onStatusChange,
    onAttachmentAdd,
}: {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onComment: (taskId: string, commentText: string) => void;
    onStatusChange: (taskId: string, status: TaskStatus) => void;
    onAttachmentAdd: (taskId: string, file: File) => void;
}) => {
    const [newComment, setNewComment] = useState("");
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    if (!task) return null;

    const handleCommentSubmit = async () => {
        if (newComment.trim()) {
            onComment(task.id, newComment);
            setNewComment("");
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onAttachmentAdd(task.id, file);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold leading-none tracking-tight">{task.title}</h2>
                            <DialogDescription>
                                In project: {task.project?.name || "Unknown Project"}
                            </DialogDescription>
                        </div>
                        <Select value={task.status} onValueChange={(value: TaskStatus) => onStatusChange(task.id, value)}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Set status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="To Do">To Do</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-4">Attachments</h3>
                        <div className="space-y-2">
                             {task.attachments.map((file, index) => (
                                <a key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Paperclip className="h-4 w-4" />
                                    {file.name}
                                </a>
                            ))}
                            {task.attachments.length === 0 && (
                                <p className="text-sm text-muted-foreground">No attachments.</p>
                            )}
                            <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4"/>
                                Upload File
                            </Button>
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-4">Comments</h3>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-4">
                            {task.comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.author.avatar} alt={comment.author.name} data-ai-hint="person portrait"/>
                                        <AvatarFallback>{comment.author.fallback}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{comment.author.name}</p>
                                            <p className="text-xs text-muted-foreground">{comment.timestamp}</p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{comment.text}</p>
                                    </div>
                                </div>
                            ))}
                             {task.comments.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center">No comments yet.</p>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-comment">Add a comment</Label>
                        <Textarea id="new-comment" placeholder="Write a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                        <Button size="sm" onClick={handleCommentSubmit} disabled={!newComment.trim()}>Post Comment</Button>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Renders the dashboard for users with the 'Collaborator' role.
 * Displays personal tasks, upcoming deadlines, notifications, and project progress.
 * @returns {JSX.Element} The collaborator dashboard component.
 */
const CollaboratorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState(() => {
    try {
      const savedFilters = localStorage.getItem('collaborator-task-filters');
      if (savedFilters) {
        return JSON.parse(savedFilters);
      }
    } catch (e) {
      console.error("Could not parse filters from local storage", e);
    }
    return {
      status: { "To Do": true, "In Progress": true, "Completed": true },
      project: {} as Record<string, boolean>,
      priority: { "Low": true, "Medium": true, "High": true },
    };
  });


  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'deadline', direction: 'asc' });
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('collaborator-task-filters', JSON.stringify(filters));
    } catch (e) {
      console.error("Could not save filters to local storage", e);
    }
  }, [filters]);

  useEffect(() => {
    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);
        try {
            const [tasksRes, projectsRes, notificationsRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}/tasks`),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}/projects`),
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}/notifications`)
            ]);

            if (!tasksRes.ok || !projectsRes.ok || !notificationsRes.ok) {
                 throw new Error("Failed to fetch dashboard data. Please check if the backend is running.");
            }

            const tasksData = await tasksRes.json();
            const projectsData = await projectsRes.json();
            const notificationsData = await notificationsRes.json();
            
            setTasks(tasksData);
            setProjects(projectsData);
            setNotifications(notificationsData.map((n: any) => ({...n, icon: FilePlus }))); // Replace with real icons

            // Initialize project filters for any new projects
            setFilters((prev: { project: any; }) => {
                const newProjectFilters = { ...prev.project };
                projectsData.forEach((p: Project) => {
                    if (!(p.id in newProjectFilters)) {
                        newProjectFilters[p.id] = true;
                    }
                });
                return { ...prev, project: newProjectFilters };
            });

        } catch (err) {
            const errorMessage = (err as Error).message;
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [user, toast]);

  const handleOpenDetailDialog = (task: Task) => {
      setSelectedTask(task);
      setIsDetailOpen(true);
  };
  const handleCloseDetailDialog = () => {
      setSelectedTask(null);
      setIsDetailOpen(false);
  };

  const handleStatusChange = async (taskId: string, status: TaskStatus) => {
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status }),
          });
          if (!res.ok) throw new Error("Failed to update task status.");
          const updatedTask = await res.json();
          setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
          toast({ title: "Success", description: "Task status updated."});
      } catch (err) {
          toast({ title: "Error", description: (err as Error).message, variant: "destructive"});
      }
  };
  
  const handleComment = async (taskId: string, text: string) => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Failed to add comment.");
        const updatedTask = await res.json();
        setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
        if(selectedTask?.id === taskId) setSelectedTask(updatedTask);
        toast({ title: "Success", description: "Comment added."});
    } catch (err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive"});
    }
  };

  const handleAttachmentAdd = async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}/attachments`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error("Failed to upload attachment.");
        const updatedTask = await res.json();
        setTasks(tasks.map(task => task.id === taskId ? updatedTask : task));
        if(selectedTask?.id === taskId) setSelectedTask(updatedTask);
        toast({ title: "Success", description: "Attachment uploaded."});
    } catch (err) {
        toast({ title: "Error", description: (err as Error).message, variant: "destructive"});
    }
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleFilterChange = (type: 'status' | 'project' | 'priority', value: string) => {
    setFilters((prev: { [x: string]: { [x: string]: any; }; }) => ({
      ...prev,
      [type]: {
        ...prev[type],
[value as string]: !prev[type][value as keyof typeof prev[typeof type]],
      }
    }));
  };

  const deadlines = useMemo(() => {
    const deadlinesMap = new Map<string, typeof tasks>();
    tasks.forEach(task => {
        const dateStr = format(parseISO(task.deadline), "yyyy-MM-dd");
        if (!deadlinesMap.has(dateStr)) {
            deadlinesMap.set(dateStr, []);
        }
        deadlinesMap.get(dateStr)?.push(task);
    });
    return deadlinesMap;
  }, [tasks]);

  const sortedAndFilteredTasks = useMemo(() => {
    const activeStatusFilters = Object.keys(filters.status).filter(key => filters.status[key as keyof typeof filters.status]);
    const activeProjectFilters = Object.keys(filters.project).filter(key => filters.project[key as keyof typeof filters.project]);
    const activePriorityFilters = Object.keys(filters.priority).filter(key => filters.priority[key as keyof typeof filters.priority]);

    let filtered = tasks.filter(task => 
      activeStatusFilters.includes(task.status) && 
      activeProjectFilters.includes(task.project?.id) &&
      activePriorityFilters.includes(task.priority)
    );

    const sorted = [...filtered].sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;

        if (key === 'deadline') {
            return (parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime()) * dir;
        }
        if (key === 'priority') {
            const priorityOrder = { 'Low': 2, 'Medium': 1, 'High': 0 };
            return (priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]) * dir;
        }
        if (key === 'status') {
            const statusOrder = { 'To Do': 0, 'In Progress': 1, 'Completed': 2 };
            return (statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]) * dir;
        }
        return 0;
    });

    return sorted;
  }, [filters, sortConfig, tasks]);
  
  const projectNames = [...new Set(tasks.map(t => t.project?.id))];
  const statuses = ["To Do", "In Progress", "Completed"];
  const priorities = ["Low", "Medium", "High"];

  const deadlineModifiers = {
    hasDeadline: Array.from(deadlines.keys()).map(d => parseISO(d)),
    isOverdue: Array.from(deadlines.entries())
        .filter(([_, tasks]) => tasks.some(t => isPast(parseISO(t.deadline)) && !isToday(parseISO(t.deadline)) && t.status !== "Completed"))
        .map(([dateStr]) => parseISO(dateStr)),
    isUrgent: Array.from(deadlines.entries())
        .filter(([_, tasks]) => tasks.some(t => {
            const diff = differenceInDays(parseISO(t.deadline), new Date());
            return diff >= 0 && diff <= 3;
        }))
        .map(([dateStr]) => parseISO(dateStr)),
  };

  const taskProgressData = useMemo(() => {
    const counts = tasks.reduce((acc, task) => {
        if (task.status === "To Do") acc.todo++;
        if (task.status === "In Progress") acc.inProgress++;
        if (task.status === "Completed") acc.completed++;
        return acc;
    }, { todo: 0, inProgress: 0, completed: 0 });
    return [
        { label: "To Do", tasks: counts.todo, fill: "var(--color-todo)" },
        { label: "In Progress", tasks: counts.inProgress, fill: "var(--color-inProgress)" },
        { label: "Completed", tasks: counts.completed, fill: "var(--color-completed)" },
    ];
  }, [tasks]);

   if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
         return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Load Dashboard</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>My Tasks</CardTitle>
                      <CardDescription>A list of tasks assigned to you.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Sort by:</span>
                            <Select value={sortConfig.key} onValueChange={(value: SortKey) => setSortConfig(prev => ({ ...prev, key: value }))}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="Sort" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="deadline">Deadline</SelectItem>
                                    <SelectItem value="priority">Priority</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="icon" onClick={() => setSortConfig(prev => ({...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                <ArrowUpDown className="h-4 w-4" />
                            </Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ListFilter className="mr-2 h-4 w-4" />
                              Filter
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statuses.map(status => (
                              <DropdownMenuCheckboxItem
                                key={status}
                                checked={filters.status[status as keyof typeof filters.status]}
                                onCheckedChange={() => handleFilterChange('status', status)}
                              >
                                {status}
                              </DropdownMenuCheckboxItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Filter by Project</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {projects.map(project => (
                              <DropdownMenuCheckboxItem
                                key={project.id}
                                checked={filters.project[project.id as keyof typeof filters.project]}
                                onCheckedChange={() => handleFilterChange('project', project.id)}
                              >
                                {project.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                             <DropdownMenuSeparator />
                            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {priorities.map(priority => (
                              <DropdownMenuCheckboxItem
                                key={priority}
                                checked={filters.priority[priority as keyof typeof filters.priority]}
                                onCheckedChange={() => handleFilterChange('priority', priority)}
                              >
                                {priority}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead className="hidden sm:table-cell">Project</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead className="hidden md:table-cell">Deadline</TableHead>
                          <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedAndFilteredTasks.length > 0 ? (
                          sortedAndFilteredTasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell className="hidden sm:table-cell">{task.project?.name || "Unknown Project"}</TableCell>
                              <TableCell>
                                <Badge variant={task.status === "Completed" ? "default" : "secondary"}>
                                  {task.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"}>
                                  {task.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">{format(parseISO(task.deadline), "MMM d, yyyy")}</TableCell>
                              <TableCell>
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                              <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent>
                                          <DropdownMenuItem onSelect={() => handleOpenDetailDialog(task)}>
                                              <Edit className="mr-2 h-4 w-4" /> View / Edit Details
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                  </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24">
                              No tasks found for the selected filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Notifications</CardTitle>
                        <CardDescription>Stay up to date with assignments and mentions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-4">
                            {notifications.length > 0 ? notifications.map((notification, index) => (
                               <React.Fragment key={notification.id}>
                                <div className="flex items-start gap-4">
                                    <notification.icon className="h-5 w-5 text-muted-foreground mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm">{notification.text}</p>
                                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDismissNotification(notification.id)}>
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Dismiss</span>
                                    </Button>
                                </div>
                                {index < notifications.length - 1 && <Separator />}
                                </React.Fragment>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center">No new notifications.</p>
                            )}
                       </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>My Task Progress</CardTitle>
                        <CardDescription>A breakdown of your task statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={taskProgressChartConfig} className="min-h-[200px] w-full">
                            <BarChart layout="vertical" data={taskProgressData} margin={{ left: 10 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} />
                                <XAxis dataKey="tasks" type="number" hide />
                                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="tasks" layout="vertical" radius={5} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>My Projects</CardTitle>
                        <CardDescription>A summary of your current projects.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {projects.map(proj => (
                            <div key={proj.name} onClick={() => window.location.href = `/projects/${proj.id}`} className="cursor-pointer hover:bg-muted p-2 rounded-md -mx-2">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <FolderKanban className="h-4 w-4 text-muted-foreground"/>
                                        {proj.name}
                                    </h4>
                                    <span className="text-xs text-muted-foreground">{proj.progress}%</span>
                                </div>
                                <Progress value={proj.progress} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
        <div className="lg:col-span-1">
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                    <CardDescription>Hover over a date to see tasks.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        modifiers={deadlineModifiers}
                        modifiersClassNames={{
                            hasDeadline: "bg-primary/20",
                            isUrgent: "bg-yellow-400/30 text-yellow-800 font-semibold",
                            isOverdue: "bg-destructive/20 text-destructive font-semibold",
                        }}
                        components={{
                            DayContent: (props) => {
                                const dateStr = format(props.date, "yyyy-MM-dd");
                                const tasksForDay = deadlines.get(dateStr);
                                if (tasksForDay) {
                                    return (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <div className="w-full h-full relative flex items-center justify-center">
                                                    {props.date.getDate()}
                                                </div>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium leading-none">Tasks for {format(props.date, "MMM d")}</h4>
                                                    <div className="space-y-1">
                                                        {tasksForDay.map(task => (
                                                            <div key={task.id} className="text-sm">
                                                                <span className={`font-semibold ${task.priority === 'High' ? 'text-destructive' : ''}`}>{task.title}</span>
                                                                <p className="text-xs text-muted-foreground">{task.project?.name || "Unknown Project"}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    );
                                }
                                return <div>{props.date.getDate()}</div>;
                            }
                        }}
                    />
                </CardContent>
            </Card>
        </div>
      </div>
      <TaskDetailDialog
        task={selectedTask}
        isOpen={isDetailOpen}
        onClose={handleCloseDetailDialog}
        onComment={handleComment}
        onStatusChange={handleStatusChange}
        onAttachmentAdd={handleAttachmentAdd}
      />
    </div>
  );
};

/**
 * The main Dashboard page component.
 * It dynamically renders either the Manager/Admin dashboard or the Collaborator dashboard
 * based on the authenticated user's role.
 * @returns {JSX.Element} The appropriate dashboard for the current user.
 */
export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'Collaborator') {
    return <CollaboratorDashboard />;
  }
  
  return <ManagerAdminDashboard />;
}

    

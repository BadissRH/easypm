
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Edit, Trash2, MessageSquare, Paperclip, Upload, FolderKanban, CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/auth-provider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


/**
 * @typedef {"Backlog" | "To Do" | "In Progress" | "Review" | "Completed" | "Requirements" | "Design" | "Implementation" | "Deployment"} TaskStatus - The possible statuses for a task, varying by methodology.
 */
type TaskStatus = "Backlog" | "To Do" | "In Progress" | "Review" | "Completed" | "Requirements" | "Design" | "Implementation" | "Deployment";
/**
 * @typedef {"Low" | "Medium" | "High"} TaskPriority - The possible priority levels for a task.
 */
type TaskPriority = "Low" | "Medium" | "High";

/**
 * @typedef {object} Comment - Represents a comment on a task.
 * @property {string} id - Unique ID for the comment.
 * @property {object} author - The author of the comment.
 * @property {string} author.name - Name of the author.
 * @property {string} author.avatar - URL for the author's avatar.
 * @property {string} author.fallback - Fallback text for the avatar.
 * @property {string} text - The comment content.
 * @property {string} timestamp - When the comment was made.
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
 * @property {string} type - The file type (e.g., 'PDF').
 */
type Attachment = {
  name: string;
  url: string;
  type: string;
};

/**
 * @typedef {object} Assignee - Represents a user assigned to a task.
 * @property {string} name - Name of the assignee.
 * @property {string} avatar - URL for the assignee's avatar.
 * @property {string} fallback - Fallback text for the avatar.
 */
type Assignee = {
    id: string;
    name: string;
    avatar: string;
    fallback: string;
};

/**
 * @typedef {object} Task - Represents a single task in a project.
 * @property {string} id - Unique ID for the task.
 * @property {string} title - The title of the task.
 * @property {string} description - Detailed description of the task.
 * @property {TaskStatus} status - The current status of the task.
 * @property {TaskPriority} priority - The priority level of the task.
 * @property {string} project - The name of the project this task belongs to.
 * @property {Assignee} assignee - The user assigned to the task.
 * @property {Comment[]} comments - Array of comments on the task.
 * @property {Attachment[]} attachments - Array of files attached to the task.
 * @property {string} [dueDate] - Optional due date for the task.
 * @property {number} [storyPoints] - Optional story points for Agile tasks.
 * @property {string} [phase] - The phase this task belongs to for Waterfall projects.
 * @property {object} [projectDetails] - Details about the project's methodology.
 * @property {number} [projectDetails.wipLimit] - Work-in-Progress limit for Kanban.
 * @property {ProjectMethodology} [projectDetails.methodology] - The project's methodology.
 * @property {{ name: string, milestoneDate?: string }[]} [projectDetails.phases] - Phases for Waterfall projects.
 */
type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
  projectId: string;
  assignee: Assignee;
  comments: Comment[];
  attachments: Attachment[];
  dueDate?: string;
  storyPoints?: number;
  phase?: string;
};

/**
 * @typedef {"None" | "Agile (Scrum)" | "Kanban" | "Waterfall" | "Lean"} ProjectMethodology - The available project management methodologies.
 */
type ProjectMethodology = "None" | "Agile (Scrum)" | "Kanban" | "Waterfall" | "Lean";

type Project = {
    id: string;
    name: string;
    methodology: ProjectMethodology;
    wipLimit?: number;
    phases?: { name: string }[];
}

const taskSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Task title is required.").max(100),
  description: z.string().max(1000).optional(),
  assigneeId: z.string().min(1, "Assignee is required."),
  dueDate: z.date().optional(),
  priority: z.enum(["Low", "Medium", "High"]),
  storyPoints: z.number().positive().optional(),
  phase: z.string().optional(),
});


/**
 * A dialog for creating a new task or editing an existing one.
 * It dynamically displays fields based on the project's methodology.
 * @param {object} props - The component props.
 * @param {Task | null} [props.task] - The task to edit, or null for a new task.
 * @param {(data: Omit<Task, 'project' | 'projectId' | 'comments' | 'attachments' | 'assignee'> & {assigneeId: string}) => void} props.onSave - Callback to save the task.
 * @param {() => void} props.onClose - Callback to close the dialog.
 * @param {boolean} props.isOpen - Whether the dialog is open.
 * @param {Project | null} [props.project] - The project context for the task.
 * @param {Assignee[]} props.availableUsers - List of users that can be assigned.
 * @returns {JSX.Element} The task dialog component.
 */
const TaskDialog = ({
  task,
  onSave,
  onClose,
  isOpen,
  project,
  availableUsers
}: {
  task?: Task | null;
  onSave: (data: Omit<Task, 'project' | 'projectId' | 'comments' | 'attachments' | 'assignee'> & {assigneeId: string}) => void;
  onClose: () => void;
  isOpen: boolean;
  project?: Project | null;
  availableUsers: Assignee[];
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isCollaborator = user?.role === "Collaborator";
  const methodology = project?.methodology;
  const isLean = methodology === 'Lean';

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      assigneeId: "",
      dueDate: undefined,
      priority: "Medium",
      storyPoints: undefined,
      phase: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (task) {
            form.reset({
                id: task.id,
                title: task.title,
                description: task.description,
                assigneeId: task.assignee?.id,
                dueDate: task.dueDate ? parseISO(task.dueDate) : undefined,
                priority: task.priority,
                storyPoints: task.storyPoints,
                phase: task.phase,
            });
        } else {
            form.reset({
                title: "",
                description: "",
                assigneeId: isCollaborator ? user?.id : "",
                dueDate: undefined,
                priority: "Medium",
                storyPoints: undefined,
                phase: undefined,
            });
        }
    }
  }, [task, isOpen, form, isCollaborator, user]);


  const handleSubmit = async (data: z.infer<typeof taskSchema>) => {
    setIsSaving(true);
    await onSave(data);
    setIsSaving(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        toast({ title: "Note", description: "File upload is a demo feature."})
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
          <DialogDescription>
            {task ? "Update the details for this task." : "Enter the details for the new task."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto px-2">
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Task Title</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Design Homepage Mockup" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the task details and deliverables..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="flex items-center gap-2">
                    <Input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} multiple />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mr-2 h-4 w-4"/>
                        Upload Attachments
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="assigneeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assignee</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isCollaborator}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {availableUsers.map(user => (
                                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                           <FormItem className="flex flex-col">
                            <FormLabel>Due Date</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                    >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                             <FormItem>
                                <FormLabel>{isLean ? 'Value Category' : 'Priority'}</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a priority" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Low">Low</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {methodology === 'Agile (Scrum)' && (
                         <FormField
                            control={form.control}
                            name="storyPoints"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Story Points</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 3" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                     {methodology === 'Waterfall' && project?.phases && (
                         <FormField
                            control={form.control}
                            name="phase"
                            render={({ field }) => (
                                 <FormItem>
                                    <FormLabel>Phase</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a phase" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {project.phases?.map(p => (
                                                <SelectItem key={p.name} value={p.name}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Task
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * A card component representing a single task on the task board.
 * @param {object} props - The component props.
 * @param {Task} props.task - The task data to display.
 * @param {() => void} props.onEdit - Callback to trigger edit mode.
 * @param {() => void} props.onDelete - Callback to delete the task.
 * @param {() => void} props.onView - Callback to view task details.
 * @param {ProjectMethodology} [props.methodology] - The project's methodology.
 * @returns {JSX.Element} The task card component.
 */
const TaskCard = ({ task, onEdit, onDelete, onView, methodology }: { task: Task; onEdit: () => void; onDelete: () => void; onView: () => void; methodology?: ProjectMethodology; }) => {
    const priorityClasses = {
        Low: "border-blue-500",
        Medium: "border-yellow-500",
        High: "border-red-500",
    };
    
    const isLean = methodology === 'Lean';

    const getPriorityLabel = (priority: TaskPriority) => {
        if (isLean) {
            return `${priority} Value`;
        }
        return priority;
    }

    return (
        <Card className={`mb-4 border-l-4 ${priorityClasses[task.priority]} hover:shadow-md transition-shadow cursor-pointer`} onClick={onView}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <h3 className="text-base font-semibold leading-none tracking-tight">{task.title}</h3>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={onEdit}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4 truncate">{task.description}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Badge variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "secondary" : "outline"}>{getPriorityLabel(task.priority)}</Badge>
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                <span className="text-xs">{task.comments.length}</span>
                            </div>
                             <div className="flex items-center gap-1">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-xs">{task.attachments.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm hidden sm:inline">{task.assignee.name}</span>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{task.assignee.fallback}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * A column on the task board, representing a task status.
 * @param {object} props - The component props.
 * @param {string} props.title - The title of the column.
 * @param {Task[]} props.tasks - The tasks to display in this column.
 * @param {number} props.count - The total count of tasks in the column.
 * @param {(task: Task) => void} props.onEdit - Callback for editing a task.
 * @param {(task: Task) => void} props.onDelete - Callback for deleting a task.
 * @param {(task: Task) => void} props.onView - Callback for viewing a task's details.
 * @param {number} [props.wipLimit] - Optional Work-in-Progress limit for the column.
 * @param {ProjectMethodology} [props.methodology] - The project's methodology.
 * @returns {JSX.Element} The task column component.
 */
const TaskColumn = ({ title, tasks, count, onEdit, onDelete, onView, wipLimit, methodology }: { title: string; tasks: Task[]; count: number; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onView: (task: Task) => void; wipLimit?: number; methodology?: ProjectMethodology; }) => {
    const isOverLimit = wipLimit !== undefined && count > wipLimit;
    return (
        <div className="flex flex-col w-full min-w-[300px]">
            <div className="flex items-center justify-between p-2 mb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    {title} 
                    {wipLimit !== undefined ? (
                        <Badge variant={isOverLimit ? "destructive" : "secondary"}>
                            {count} / {wipLimit}
                        </Badge>
                    ) : (
                        <Badge variant="secondary">{count}</Badge>
                    )}
                </h2>
            </div>
            <Card className="flex-1 bg-muted/50 p-4 min-h-[300px] overflow-y-auto">
                {tasks.map(task => <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} onDelete={() => onDelete(task)} onView={() => onView(task)} methodology={methodology} />)}
            </Card>
        </div>
    )
}

const TaskBoardSkeleton = () => (
     <div className="flex-1 flex gap-6 items-start overflow-x-auto pb-4">
        {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col w-full min-w-[300px]">
                 <div className="p-2 mb-2">
                    <Skeleton className="h-7 w-1/2" />
                </div>
                <div className="flex-1 bg-muted/50 p-4 min-h-[300px] space-y-4">
                    {[...Array(3)].map((_, j) => (
                        <Skeleton key={j} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        ))}
    </div>
);


/**
 * The main task board component, which organizes tasks into columns based on their status and the project's methodology.
 * @param {object} props - The component props.
 * @param {Task[]} props.tasks - The list of tasks to display.
 * @param {(task: Task) => void} props.onEdit - Callback for editing a task.
 * @param {(task: Task) => void} props.onDelete - Callback for deleting a task.
 * @param {(task: Task) => void} props.onView - Callback for viewing a task's details.
 * @param {ProjectMethodology} props.methodology - The methodology of the current project.
 * @param {number} [props.wipLimit] - Optional Work-in-Progress limit for Kanban boards.
 * @returns {JSX.Element} The task board component.
 */
const TaskBoard = ({ tasks, onEdit, onDelete, onView, methodology, wipLimit }: { tasks: Task[]; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onView: (task: Task) => void; methodology: ProjectMethodology; wipLimit?: number }) => {

    const agileColumns = [
        { title: "Backlog", status: "Backlog" as TaskStatus },
        { title: "To Do", status: "To Do" as TaskStatus },
        { title: "In Progress", status: "In Progress" as TaskStatus, wipLimit: methodology === 'Kanban' ? wipLimit : undefined },
        { title: "Review", status: "Review" as TaskStatus },
        { title: "Completed", status: "Completed" as TaskStatus },
    ];
    
    const waterfallColumns = [
        { title: "Requirements", status: "Requirements" as TaskStatus },
        { title: "Design", status: "Design" as TaskStatus },
        { title: "Implementation", status: "Implementation" as TaskStatus },
        { title: "Review", status: "Review" as TaskStatus }, // Can be used for Testing
        { title: "Deployment", status: "Deployment" as TaskStatus },
        { title: "Completed", status: "Completed" as TaskStatus },
    ];

    let columnsToShow;
    switch(methodology) {
        case 'Agile (Scrum)':
        case 'Kanban':
        case 'Lean':
        case 'None':
            columnsToShow = agileColumns;
            break;
        case 'Waterfall':
            columnsToShow = waterfallColumns;
            break;
        default:
            columnsToShow = agileColumns;
    }

    const tasksByStatus = useMemo(() => {
        return tasks.reduce((acc, task) => {
            const status = task.status as TaskStatus;
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(task);
            return acc;
        }, {} as Record<TaskStatus, Task[]>);
    }, [tasks]);

    return (
         <div className="flex flex-col flex-1">
            {methodology === 'Agile (Scrum)' && (
                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Sprint 2</CardTitle>
                        <CardDescription>Ends in 10 days</CardDescription>
                    </CardHeader>
                </Card>
            )}
            <div className="flex-1 flex gap-6 items-start overflow-x-auto pb-4">
                {columnsToShow.map(col => {
                    const columnTasks = tasksByStatus[col.status] || [];
                    return (
                        <TaskColumn 
                            key={col.status} 
                            title={col.title} 
                            tasks={columnTasks} 
                            count={columnTasks.length} 
                            onEdit={onEdit} 
                            onDelete={onDelete} 
                            onView={onView} 
                            wipLimit={col.wipLimit}
                            methodology={methodology}
                        />
                    );
                })}
            </div>
        </div>
    )
}

/**
 * A placeholder component displayed when no project is selected.
 * @returns {JSX.Element} The placeholder component.
 */
const Placeholder = () => (
    <Card className="flex flex-col items-center justify-center h-96 border-dashed">
        <FolderKanban className="h-16 w-16 text-muted-foreground" />
        <CardTitle className="mt-4">Select a Project</CardTitle>
        <CardDescription className="mt-2">Choose a project from the dropdown above to see its tasks.</CardDescription>
    </Card>
);

/**
 * The main page for viewing and managing tasks in a Kanban-style board.
 * Users can select a project to view its tasks, add new tasks, edit, and delete them.
 * Accessible to all user roles, with role-based filtering of projects and tasks.
 * @returns {JSX.Element} The tasks page component.
 */
export default function TasksPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [availableUsers, setAvailableUsers] = useState<Assignee[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedProjectId');
        }
        return null;
    });
    
    const [isLoadingProjects, setIsLoadingProjects] = useState(true);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    // Persist selected project ID
    useEffect(() => {
        if (selectedProjectId) {
            localStorage.setItem('selectedProjectId', selectedProjectId);
        } else {
            localStorage.removeItem('selectedProjectId');
        }
    }, [selectedProjectId]);

    // Fetch projects on component mount
    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoadingProjects(true);
            setError(null);
            try {
                // Import the API utility functions
                const { apiGet } = await import('@/lib/api');
                
                const res = await apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`);
                if (!res.ok) throw new Error("Failed to fetch projects.");
                const data = await res.json();
                setProjects(data);

                const storedProjectId = localStorage.getItem('selectedProjectId');
                if (storedProjectId && data.some((p: Project) => p.id === storedProjectId)) {
                    setSelectedProjectId(storedProjectId);
                } else if (data.length > 0) {
                    setSelectedProjectId(data[0].id);
                }

            } catch (err) {
                const msg = (err as Error).message;
                setError(msg);
                toast({ title: "Error", description: msg, variant: "destructive" });
            } finally {
                setIsLoadingProjects(false);
            }
        };
        const fetchUsers = async () => {
             try {
                // Import the API utility functions
                const { apiGet } = await import('@/lib/api');
                
                const res = await apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/assignable`);
                if (!res.ok) throw new Error("Failed to fetch assignable users.");
                setAvailableUsers(await res.json());
            } catch (err) {
                const msg = (err as Error).message;
                toast({ title: "Error", description: msg, variant: "destructive" });
            }
        }
        if (user) {
            fetchProjects();
            fetchUsers();
        }
    }, [user, toast]);

    // Fetch tasks when selected project changes
    useEffect(() => {
        if (!selectedProjectId) {
            setTasks([]);
            return;
        };
        const fetchTasks = async () => {
            setIsLoadingTasks(true);
            setError(null);
            try {
                // Import the API utility functions
                const { apiGet } = await import('@/lib/api');
                
                const res = await apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${selectedProjectId}/tasks`);
                if (!res.ok) throw new Error("Failed to fetch tasks for this project.");
                setTasks(await res.json());
            } catch (err) {
                 const msg = (err as Error).message;
                setError(msg);
                toast({ title: "Error", description: msg, variant: "destructive" });
            } finally {
                setIsLoadingTasks(false);
            }
        }
        fetchTasks();
    }, [selectedProjectId, toast]);

    
    const handleOpenTaskDialog = (task?: Task | null) => {
        setSelectedTask(task || null);
        setIsTaskDialogOpen(true);
    };

    const handleCloseTaskDialog = () => {
        setSelectedTask(null);
        setIsTaskDialogOpen(false);
    };

    const handleSaveTask = async (data: Omit<Task, 'project' | 'projectId' | 'comments' | 'attachments' | 'assignee'> & {assigneeId: string}) => {
        const isEditing = !!data.id;
        const url = isEditing 
            ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${data.id}` 
            : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${selectedProjectId}/tasks`;

        try {
            // Import the API utility functions
            const { apiPut, apiPost } = await import('@/lib/api');
            
            const response = isEditing 
                ? await apiPut(url, data)
                : await apiPost(url, data);
                
            if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} task.`);

            const savedTask = await response.json();
            if (isEditing) {
                setTasks(tasks.map(t => t.id === savedTask.id ? savedTask : t));
            } else {
                setTasks([...tasks, savedTask]);
            }
            toast({ title: "Success", description: `Task has been ${isEditing ? 'updated' : 'created'}.`});
            handleCloseTaskDialog();
        } catch (err) {
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };

    const handleDeleteTask = async (taskToDelete: Task) => {
        try {
            // Import the API utility functions
            const { apiDelete } = await import('@/lib/api');
            
            const res = await apiDelete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskToDelete.id}`);
            if (!res.ok) throw new Error("Failed to delete task.");
            setTasks(tasks.filter(task => task.id !== taskToDelete.id));
            toast({ title: "Success", description: "Task deleted."});
        } catch(err) {
             toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };
    
    const handleStatusChange = async (taskId: string, status: TaskStatus) => {
        const originalTasks = [...tasks];
        // Optimistic update
        setTasks(tasks.map(task => task.id === taskId ? { ...task, status } : task));
        try {
             // Import the API utility functions
             const { apiPut } = await import('@/lib/api');
             
             const res = await apiPut(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/tasks/${taskId}`, { status });
             if (!res.ok) throw new Error("Failed to update task status.");
             const updatedTask = await res.json();
             // Final update from server
             setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
        } catch(err) {
            setTasks(originalTasks); // Revert on error
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        }
    };
    
    const selectedProject = useMemo(() => {
        return projects.find(p => p.id === selectedProjectId);
    }, [projects, selectedProjectId]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Task Board</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <Select onValueChange={setSelectedProjectId} value={selectedProjectId || ""} disabled={isLoadingProjects}>
                <SelectTrigger className="w-full md:w-[280px]">
                    <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project..."} />
                </SelectTrigger>
                <SelectContent>
                    {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                                <span>{p.name}</span>
                                <Badge variant="outline">{p.methodology}</Badge>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {selectedProjectId && (
                <Button onClick={() => handleOpenTaskDialog()} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Task
                </Button>
            )}
        </div>
      </div>
      
       {isLoadingTasks ? (
            <TaskBoardSkeleton />
        ) : error ? (
            <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Tasks</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : selectedProject ? (
            <TaskBoard 
                tasks={tasks} 
                onEdit={handleOpenTaskDialog} 
                onDelete={handleDeleteTask} 
                onView={() => toast({title: "Info", description: "Task detail view coming soon."})}
                methodology={selectedProject.methodology}
                wipLimit={selectedProject.wipLimit}
            />
        ) : (
            !isLoadingProjects && <Placeholder />
        )}

       <TaskDialog 
        isOpen={isTaskDialogOpen}
        onClose={handleCloseTaskDialog}
        onSave={handleSaveTask}
        task={selectedTask}
        project={selectedProject}
        availableUsers={availableUsers}
      />
    </div>
  );
}


"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from 'date-fns';
import { useAuth } from "@/components/auth-provider";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, PlusCircle, Archive, XCircle, FolderKanban, Edit, Trash2, Users, Upload, CalendarIcon, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


/**
 * @typedef {object} TeamMember - Represents a member of a project team.
 * @property {string} id - The unique identifier of the team member.
 * @property {string} name - The name of the team member.
 * @property {string} avatar - URL for the team member's avatar image.
 * @property {string} fallback - Fallback text for the avatar (e.g., initials).
 * @property {"Administrator" | "Project Manager" | "Collaborator"} role - The role of the team member.
 */
type TeamMember = { id: string; name: string; avatar: string; fallback: string; role: "Administrator" | "Project Manager" | "Collaborator"; };

/**
 * @typedef {"Active" | "On Hold" | "Completed" | "Archived"} ProjectStatus - The possible statuses for a project.
 */
type ProjectStatus = "Active" | "On Hold" | "Completed" | "Archived";
/**
 * @typedef {"None" | "Agile (Scrum)" | "Kanban" | "Waterfall" | "Lean"} ProjectMethodology - The project management methodologies.
 */
type ProjectMethodology = "None" | "Agile (Scrum)" | "Kanban" | "Waterfall" | "Lean";

/**
 * @typedef {object} Project - Represents a project in the system.
 * @property {string} id - The unique identifier for the project.
 * @property {string} name - The name of the project.
 * @property {string} description - A detailed description of the project.
 * @property {ProjectStatus} status - The current status of the project.
 * @property {number} progress - The completion progress of the project (0-100).
 * @property {TeamMember[]} team - An array of team members assigned to the project.
 * @property {string} lastUpdate - The date of the last update.
 * @property {string} startDate - The start date of the project.
 * @property {string} [deadline] - The optional deadline for the project.
 * @property {ProjectMethodology} methodology - The methodology used for the project.
 * @property {number} [budget] - The optional budget for the project.
 * @property {number} [sprintDuration] - Duration of sprints in weeks (for Agile).
 * @property {string} [initialBacklog] - Initial tasks for the backlog (for Agile).
 * @property {number} [wipLimit] - Work-in-Progress limit (for Kanban).
 * @property {string[]} [columnNames] - Custom column names for the Kanban board.
 * @property {{ name: string, milestoneDate?: string }[]} [phases] - Project phases (for Waterfall).
 * @property {string} [valueGoals] - Primary value objectives (for Lean).
 * @property {string[]} [wasteCategories] - Categories of waste to track (for Lean).
 */
type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  team: TeamMember[];
  lastUpdate: string;
  startDate: string;
  deadline?: string;
  methodology: ProjectMethodology;
  budget?: number;
  sprintDuration?: number;
  initialBacklog?: string;
  wipLimit?: number;
  columnNames?: string[];
  phases?: { name: string, milestoneDate?: string }[];
  valueGoals?: string;
  wasteCategories?: string[];
};

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Project name is required.").max(100),
  description: z.string().max(500).optional(),
  methodology: z.enum(["Agile (Scrum)", "Kanban", "Waterfall", "Lean", "None"], {
    required_error: "You need to select a project methodology.",
  }),
  startDate: z.date({
    required_error: "A start date is required.",
  }),
  deadline: z.date().optional(),
  team: z.array(z.string()).min(1, "At least one team member must be selected."),
  budget: z.number().positive().optional(),
  sprintDuration: z.number().optional(),
  wipLimit: z.number().positive().optional(),
  phases: z.array(z.object({
    name: z.string().min(1, "Phase name cannot be empty.").max(50),
    milestoneDate: z.date().optional()
  })).optional(),
  valueGoals: z.string().max(500).optional(),
}).refine(data => {
    if (data.deadline && data.startDate) {
        return data.deadline > data.startDate;
    }
    return true;
}, {
    message: "End date must be after the start date.",
    path: ["deadline"],
});

/**
 * A dialog for creating a new project or editing an existing one.
 * It includes fields for project details, methodology, team members, and budget.
 * @param {object} props - The component props.
 * @param {Project | null | undefined} props.project - The project to edit, or null/undefined for a new project.
 * @param {(project: z.infer<typeof projectSchema>) => Promise<void>} props.onSave - Callback function to save the project data.
 * @param {() => void} props.onClose - Callback function to close the dialog.
 * @param {boolean} props.isOpen - Whether the dialog is currently open.
 * @param {TeamMember[]} props.availableUsers - A list of users that can be assigned to the project.
 * @returns {JSX.Element} The project creation/edit dialog.
 */
const ProjectDialog = ({
  project,
  onSave,
  onClose,
  isOpen,
  availableUsers,
}: {
  project?: Project | null;
  onSave: (project: z.infer<typeof projectSchema>) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
  availableUsers: TeamMember[];
}) => {
    const { user } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const isAdmin = user?.role === 'Administrator';

    const form = useForm<z.infer<typeof projectSchema>>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: "",
            description: "",
            methodology: "None",
            startDate: new Date(),
            deadline: undefined,
            team: [],
            budget: undefined,
            sprintDuration: 2,
            wipLimit: undefined,
            phases: [{ name: "" }],
            valueGoals: "",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "phases"
    });

    useEffect(() => {
        if (isOpen) {
            if (project) {
                form.reset({
                    id: project.id,
                    name: project.name,
                    description: project.description,
                    methodology: project.methodology || "None",
                    startDate: project.startDate ? parseISO(project.startDate) : new Date(),
                    deadline: project.deadline ? parseISO(project.deadline) : undefined,
                    team: project.team.map(t => t.id),
                    budget: project.budget,
                    sprintDuration: project.sprintDuration,
                    wipLimit: project.wipLimit,
                    phases: project.phases?.map(p => ({
                        ...p,
                        milestoneDate: p.milestoneDate ? parseISO(p.milestoneDate) : undefined
                    })) || [{ name: "" }],
                    valueGoals: project.valueGoals,
                });
            } else {
                 form.reset({ // Reset to default for new project
                    name: "",
                    description: "",
                    methodology: "None",
                    startDate: new Date(),
                    deadline: undefined,
                    team: [],
                    budget: undefined,
                    sprintDuration: 2,
                    wipLimit: undefined,
                    phases: [{ name: "" }],
                    valueGoals: "",
                });
            }
        }
    }, [project, isOpen, form]);

    const watchedMethodology = form.watch("methodology");

    async function onSubmit(data: z.infer<typeof projectSchema>) {
        setIsSaving(true);
        await onSave(data);
        setIsSaving(false);
    }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "Add New Project"}</DialogTitle>
          <DialogDescription>
            {project ? "Update the details for this project." : "Enter the details for the new project."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto px-2">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Website Redesign" {...field} />
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
                            <FormLabel>Project Description</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the project goals and key deliverables..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="methodology"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Project Management Methodology</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a methodology" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Agile (Scrum)">Agile (Scrum)</SelectItem>
                                    <SelectItem value="Kanban">Kanban</SelectItem>
                                    <SelectItem value="Waterfall">Waterfall</SelectItem>
                                    <SelectItem value="Lean">Lean</SelectItem>
                                    <SelectItem value="None">None</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
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
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                            <FormLabel>End Date (Optional)</FormLabel>
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
                                    {field.value ? (
                                        format(field.value, "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < form.getValues("startDate")}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                
                 {/* Methodology-Specific Fields */}
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="text-sm font-medium">Methodology Specifics</h3>
                    {watchedMethodology === 'Agile (Scrum)' && (
                        <FormField
                            control={form.control}
                            name="sprintDuration"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sprint Duration</FormLabel>
                                    <Select onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select sprint duration" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1">1 week</SelectItem>
                                            <SelectItem value="2">2 weeks</SelectItem>
                                            <SelectItem value="3">3 weeks</SelectItem>
                                            <SelectItem value="4">4 weeks</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {watchedMethodology === 'Kanban' && (
                         <FormField
                            control={form.control}
                            name="wipLimit"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Work-in-Progress (WIP) Limit</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 5" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                     {watchedMethodology === 'Waterfall' && (
                        <div className="space-y-2">
                             <FormLabel>Phases</FormLabel>
                             {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`phases.${index}.name`}
                                        render={({ field }) => (
                                            <FormItem className="flex-grow">
                                                <FormControl><Input placeholder={`Phase ${index + 1} Name`} {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <Button type="button" variant="outline" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                             ))}
                             <Button type="button" size="sm" variant="outline" onClick={() => append({ name: "" })}>Add Phase</Button>
                        </div>
                    )}
                     {watchedMethodology === 'Lean' && (
                        <FormField
                            control={form.control}
                            name="valueGoals"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Value Goals</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe the key value this project delivers..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {watchedMethodology === 'None' && <p className="text-sm text-muted-foreground">No specific settings for this methodology.</p>}
                </div>
                
                <FormField
                    control={form.control}
                    name="team"
                    render={({ field }) => (
                         <FormItem>
                            <div className="mb-4">
                                <FormLabel>Team Members</FormLabel>
                                <FormDescription>Select users to assign to this project.</FormDescription>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-48 overflow-y-auto p-2 border rounded-md">
                                {availableUsers
                                    .map((user) => (
                                    <FormItem key={user.id} className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(user.id)}
                                                onCheckedChange={(checked) => {
                                                    return checked
                                                    ? field.onChange([...(field.value || []), user.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                            (value) => value !== user.id
                                                        )
                                                        )
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person portrait"/>
                                                <AvatarFallback>{user.fallback}</AvatarFallback>
                                            </Avatar>
                                            {user.name}
                                        </FormLabel>
                                    </FormItem>
                                ))}
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {isAdmin && (
                    <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Budget (Optional)</FormLabel>
                                 <FormControl>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">TND</span>
                                        <Input type="number" placeholder="e.g., 5000" className="pl-12" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Project
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * A skeleton loader component for the projects table.
 * Displays a placeholder UI while data is being fetched.
 * @returns {JSX.Element} The skeleton loading component for the projects table.
 */
const ProjectsTableSkeleton = () => (
    <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center space-x-4 p-4">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
                 <Skeleton className="h-8 w-24 hidden sm:block" />
                 <Skeleton className="h-8 w-32 hidden md:block" />
                 <Skeleton className="h-8 w-24 hidden lg:block" />
                 <Skeleton className="h-8 w-8" />
            </div>
        ))}
    </div>
);


/**
 * The main page for managing projects.
 * It fetches and displays a list of all projects and allows for creation, editing, and deletion via API calls.
 * Accessible to Administrators and Project Managers.
 * @returns {JSX.Element} The projects page component.
 */
export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [availableUsers, setAvailableUsers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogAction, setDialogAction] = useState<"close" | "archive" | "delete" | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        setError(null);
        try {
            // Import the API utility functions
            const { apiGet } = await import('@/lib/api');
            
            const [projectsRes, usersRes] = await Promise.all([
                apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`),
                apiGet(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/assignable`)
            ]);

            if (!projectsRes.ok) {
                const errorData = await projectsRes.json().catch(() => ({ message: 'Failed to fetch projects' }));
                throw new Error(errorData.message);
            }
             if (!usersRes.ok) {
                const errorData = await usersRes.json().catch(() => ({ message: 'Failed to fetch users' }));
                throw new Error(errorData.message);
            }

            const projectsData = await projectsRes.json();
            const usersData = await usersRes.json();
            
            setProjects(projectsData);
            setAvailableUsers(usersData);

        } catch (error) {
            const errorMessage = (error as Error).message || "An unknown error occurred.";
            setError(errorMessage);
            toast({
                title: "Error",
                description: "Failed to load project data. Please check if the backend is running.",
                variant: "destructive"
            });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }
    if (user) {
        fetchData();
    }
  }, [toast, user]);

  const openConfirmationDialog = (project: Project, action: "close" | "archive" | "delete") => {
    setSelectedProject(project);
    setDialogAction(action);
  };
  
  const handleOpenProjectDialog = (project?: Project | null) => {
    setSelectedProject(project || null);
    setIsProjectDialogOpen(true);
  };
  
  const handleCloseProjectDialog = () => {
    setSelectedProject(null);
    setIsProjectDialogOpen(false);
  };

  const handleSaveProject = async (projectData: z.infer<typeof projectSchema>) => {
    const isEditing = !!projectData.id;
    const url = isEditing ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${projectData.id}` : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData),
        });

        if (!response.ok) {
            throw new Error(`Failed to ${isEditing ? 'update' : 'create'} project.`);
        }

        const savedProject = await response.json();

        if (isEditing) {
            setProjects(projects.map(p => p.id === savedProject.id ? savedProject : p));
        } else {
            setProjects([savedProject, ...projects]);
        }

        toast({
            title: "Success",
            description: `Project "${savedProject.name}" has been ${isEditing ? 'updated' : 'created'} successfully.`,
        });

        handleCloseProjectDialog();
    } catch (error) {
         toast({
            title: "Error",
            description: (error as Error).message || "An unexpected error occurred.",
            variant: "destructive"
        });
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedProject || !dialogAction) return;

    let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/projects/${selectedProject.id}`;
    let method = 'PUT';
    let body: any = { ...selectedProject };
    let actionVerb = "";

    if (dialogAction === "delete") {
        method = 'DELETE';
        actionVerb = 'deleted';
    } else {
        const newStatus = dialogAction === "close" ? "Completed" : "Archived";
        body.status = newStatus;
        if(newStatus === "Completed") body.progress = 100;
        actionVerb = dialogAction;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            throw new Error(`Failed to ${dialogAction} project.`);
        }

        if (dialogAction === "delete") {
            setProjects(projects.filter((p) => p.id !== selectedProject.id));
        } else {
            const updatedProject = await response.json();
            setProjects(
                projects.map((p) =>
                    p.id === selectedProject.id ? updatedProject : p
                )
            );
        }
        
        toast({
            title: "Success",
            description: `Project "${selectedProject.name}" has been ${actionVerb} successfully.`
        });

    } catch (error) {
        toast({
            title: "Error",
            description: (error as Error).message || `Could not ${dialogAction} the project.`,
            variant: "destructive"
        });
    } finally {
        setSelectedProject(null);
        setDialogAction(null);
    }
  };

  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case "Active":
        return "default";
      case "Completed":
        return "secondary";
      case "On Hold":
        return "outline";
      case "Archived":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <FolderKanban className="h-6 w-6" />
                Project Oversight
            </h1>
            <p className="text-muted-foreground">
                A list of all projects across the platform.
            </p>
        </div>
        <Button onClick={() => handleOpenProjectDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Project
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
                <ProjectsTableSkeleton />
            ) : error ? (
                <Alert variant="destructive" className="m-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to Load Projects</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Progress</TableHead>
                    <TableHead className="hidden lg:table-cell">Team</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => (
                    <TableRow key={project.id}>
                        <TableCell>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground hidden sm:inline-block truncate max-w-xs">{project.description}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                            {project.status}
                        </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                            <Progress value={project.progress} className="w-24" />
                            <span className="text-muted-foreground text-xs">{project.progress}%</span>
                        </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center -space-x-2">
                            {project.team.map((member) => (
                            <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                                <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="person portrait"/>
                                <AvatarFallback>{member.fallback}</AvatarFallback>
                            </Avatar>
                            ))}
                            {project.team.length === 0 && <span className="text-xs text-muted-foreground">No members</span>}
                        </div>
                        </TableCell>
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => handleOpenProjectDialog(project)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => openConfirmationDialog(project, "close")}
                                disabled={project.status === 'Completed' || project.status === 'Archived'}
                            >
                                <XCircle className="mr-2 h-4 w-4" /> Close Project
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => openConfirmationDialog(project, "archive")}
                                disabled={project.status === 'Archived'}
                            >
                                <Archive className="mr-2 h-4 w-4" /> Archive Project
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => openConfirmationDialog(project, "delete")}
                                className="text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Project
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            )}
          </div>
        </CardContent>
      </Card>
        
      <Dialog open={!!dialogAction} onOpenChange={() => {setSelectedProject(null); setDialogAction(null)}}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Confirm Action</DialogTitle>
                <DialogDescription>
                    Are you sure you want to {dialogAction} the project "{selectedProject?.name}"? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleConfirmAction} variant={dialogAction === 'delete' ? 'destructive' : 'default'}>
                    Confirm
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ProjectDialog 
        isOpen={isProjectDialogOpen}
        onClose={handleCloseProjectDialog}
        onSave={handleSaveProject}
        project={selectedProject}
        availableUsers={availableUsers}
      />
      
    </div>
  );
}


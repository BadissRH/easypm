
"use client";

import React, { useState, useEffect } from "react";
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoreHorizontal, PlusCircle, Trash2, Edit, Users, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


/**
 * @typedef {object} User - Represents a user in the system.
 * @property {string} id - The unique identifier for the user.
 * @property {string} name - The full name of the user.
 * @property {string} email - The email address of the user.
 * @property {"Administrator" | "Project Manager" | "Collaborator"} role - The role assigned to the user.
 */
type User = {
  id: string;
  name: string;
  email: string;
  role: "Administrator" | "Project Manager" | "Collaborator";
};

/**
 * A dialog for inviting a new user or editing an existing one.
 * It captures user details like name, email, and role.
 * @param {object} props - The component props.
 * @param {User | null} [props.user] - The user to edit, or null for a new invitation.
 * @param {(user: Partial<User>, isNew: boolean) => Promise<void>} props.onSave - Callback to save user data.
 * @param {React.ReactNode} props.children - The trigger element for the dialog.
 * @returns {JSX.Element} The user dialog component.
 */
const UserDialog = ({
  user,
  onSave,
  children,
}: {
  user?: User | null;
  onSave: (user: Partial<User>, isNew: boolean) => Promise<void>;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<User["role"]>("Collaborator");
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!user;

  // Effect to populate form when editing
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
    } else if (!user && isOpen) {
      // Reset for new user
      setName("");
      setEmail("");
      setRole("Collaborator");
    }
  }, [user, isOpen]);
  

  const handleSubmit = async () => {
    setIsSaving(true);
    const userData: Partial<User> = {
      id: user?.id,
      name,
      email,
      role,
    };
    await onSave(userData, !isEditMode);
    setIsSaving(false);
    setIsOpen(false);
  };

  const title = isEditMode ? "Edit User" : "Invite New User";
  const description = isEditMode 
    ? "Update the details for this user."
    : "Enter the user's details to send an invitation. A temporary password will be generated and emailed to them.";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && setIsOpen(open)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Full Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="e.g., John Doe" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="e.g., john.doe@example.com" disabled={isEditMode} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select value={role} onValueChange={(value: User["role"]) => setRole(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Project Manager">Project Manager</SelectItem>
                <SelectItem value="Collaborator">Collaborator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary" disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Save Changes" : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/**
 * The main page for managing users.
 * It displays a table of all users and allows for inviting, editing, and deleting users.
 * Accessible only to Administrators.
 * @returns {JSX.Element} The user management page component.
 */
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users`);
            if (!response.ok) {
                throw new Error("Failed to fetch users.");
            }
            const data = await response.json();
            setUsers(data);
        } catch (err) {
            setError((err as Error).message);
            toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }
    fetchUsers();
  }, [toast]);

  const handleSaveUser = async (user: Partial<User>, isNew: boolean) => {
    const url = isNew ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/invite` : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${user.id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Failed to ${isNew ? 'invite' : 'update'} user.`);
        }

        if (isNew) {
            setUsers(prev => [result, ...prev]);
            toast({
                title: "Invitation Sent",
                description: `An invitation email has been sent to ${result.email}.`,
            });
        } else {
            setUsers(prev => prev.map(u => u.id === result.id ? result : u));
            toast({
                title: "User Updated",
                description: `Details for ${result.name} have been updated.`,
            });
        }
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error("Failed to delete user.");
        }
        setUsers(users.filter((user) => user.id !== userId));
        toast({
            title: "User Deleted",
            description: "The user has been removed from the platform.",
            variant: "destructive"
        });
    } catch (error) {
        toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
    }
  };
  
  const getRoleBadgeVariant = (role: User["role"]) => {
    switch (role) {
      case "Administrator":
        return "destructive";
      case "Project Manager":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                User Management
            </h1>
            <p className="text-muted-foreground">
                A list of all the users in the system.
            </p>
         </div>
         <UserDialog onSave={handleSaveUser}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Invite New User
            </Button>
        </UserDialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
              {isLoading ? (
                <div className="space-y-2 p-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : error ? (
                <Alert variant="destructive" className="m-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                        <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
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
                                <UserDialog user={user} onSave={handleSaveUser}>
                                <button className="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </button>
                                </UserDialog>
                                <DropdownMenuItem onSelect={() => handleDeleteUser(user.id)} className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
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
    </div>
  );
}

    
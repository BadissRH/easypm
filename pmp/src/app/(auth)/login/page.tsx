
"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Icons } from "@/components/icons";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const defaultUsers = {
    "admin@example.com": { password: "adminpassword", user: { id: "1", name: "Admin User", email: "admin@example.com", role: "Administrator" } },
    "manager@example.com": { password: "managerpassword", user: { id: "2", name: "Project Manager", email: "manager@example.com", role: "Project Manager" } },
    "collaborator@example.com": { password: "collaboratorpassword", user: { id: "3", name: "Collaborator User", email: "collaborator@example.com", role: "Collaborator" } }
};


/**
 * The main login page for the application.
 * It provides a form for users to enter their email and password to authenticate.
 * Also includes a link to the "Forgot Password" page.
 * @returns {JSX.Element} The login page component.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    // Demo login logic
    const defaultUser = defaultUsers[data.email as keyof typeof defaultUsers];
    if (defaultUser && defaultUser.password === data.password) {
        setTimeout(() => {
            // For demo users, create a mock token
            const mockUserWithToken = {
                ...defaultUser.user,
                token: `mock-token-${defaultUser.user.id}`
            };
            login(mockUserWithToken as any);
            router.push("/dashboard");
            setIsLoading(false);
        }, 1000);
        return;
    }

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Login failed");
        }

        // Store the user with the token
        login({
            ...result.user,
            token: result.token
        });
        router.push("/dashboard");

    } catch (error) {
        toast({
            title: "Login Failed",
            description: (error as Error).message,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center items-center gap-2">
           <Icons.logo className="h-6 w-6" />
          <CardTitle className="text-2xl font-bold">EasyPM</CardTitle>
        </div>
        <CardDescription>
          Enter your credentials to access your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="e.g., you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Login
                </Button>
            </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center pt-4">
        <Separator className="mb-4" />
         <Button variant="link" asChild>
            <Link href="/forgot-password">Forgot Password?</Link>
         </Button>
      </CardFooter>
    </Card>
  );
}

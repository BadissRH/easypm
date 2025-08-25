
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email(),
  resetCode: z.string().length(6, { message: "The reset code must be 6 characters." }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

/**
 * Page for resetting a user's password using a reset code.
 * Users enter the code from their email, a new password, and confirm it.
 * @returns {JSX.Element} The reset password page component.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const email = searchParams.get('email');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: email || "",
      resetCode: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (email) {
      form.setValue("email", email);
    }
  }, [email, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
        // Import the API utility functions
        const { apiPost } = await import('@/lib/api');
        
        const response = await apiPost('/api/auth/reset-password', data);

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || "Failed to reset password.");
        }
        
        toast({
        title: "Password Reset Successful",
        description: "Your password has been changed. Please log in.",
        });
        router.push("/login");
    } catch (error) {
        toast({
            title: "Error",
            description: (error as Error).message,
            variant: "destructive"
        });
    } finally {
        setIsLoading(false);
    }
  };

  if (!email) {
      return (
          <Card className="mx-auto max-w-sm">
            <CardHeader>
                <CardTitle>Invalid Link</CardTitle>
                <CardDescription>The password reset link is missing an email. Please try again from the Forgot Password page.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/forgot-password">Go to Forgot Password</Link>
                </Button>
            </CardContent>
          </Card>
      )
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center items-center gap-2">
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
        </div>
        <CardDescription>
          Enter the 6-character code from your email and your new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resetCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reset Code</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., X7B9P4" {...field} />
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
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
            </Button>
             <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Back to Login</Link>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    
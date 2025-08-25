
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
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
import { useState } from "react";
import { Loader2 } from "lucide-react";


const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

/**
 * Page for initiating the password reset process.
 * Users can enter their email address to receive a reset code.
 * @returns {JSX.Element} The forgot password page component.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
        // Import the API utility functions
        const { apiPost } = await import('@/lib/api');
        
        const response = await apiPost('/api/auth/forgot-password', data);
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to send reset code.");
        }

        toast({
            title: "Reset Code Sent",
            description: `A password reset code has been sent to ${data.email}.`,
        });
        router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);

    } catch (error) {
        toast({
            title: "Error",
            description: (error as Error).message,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader className="space-y-2 text-center">
         <div className="flex justify-center items-center gap-2">
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
        </div>
        <CardDescription>
          Enter your email address and we'll send you a code to reset your password.
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
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Code
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

    
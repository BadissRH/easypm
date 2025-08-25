
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { Chatbot } from "@/components/chatbot";

/**
 * The main layout for the authenticated sections of the application.
 * It includes a persistent header with navigation and user controls.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {JSX.Element} The rendered app layout.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-foreground">
          <Icons.logo className="h-6 w-6" />
          <h1 className="text-lg font-semibold sm:text-xl">
            EasyPM
          </h1>
        </Link>
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <MainNav className="ml-6 hidden md:flex" />
            <div className="ml-auto flex-1 sm:flex-initial">
                 <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search tasks, projects..."
                      className="pl-8 w-full sm:w-[300px] md:w-[200px] lg:w-[300px]"
                    />
                </div>
            </div>
            <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
      <Chatbot />
    </div>
  );
}

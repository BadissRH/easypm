/**
 * The layout for authentication-related pages (Login, Forgot Password, etc.).
 * It centers the content on the page.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered within the layout.
 * @returns {JSX.Element} The rendered authentication layout.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      {children}
    </main>
  );
}

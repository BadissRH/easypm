import { redirect } from 'next/navigation';

/**
 * The root page of the application.
 * Its sole purpose is to redirect the user to the main dashboard.
 * This ensures that users are always taken to a meaningful page upon entry.
 * @returns {null} This component performs a redirect and does not render anything.
 */
export default function RootPage() {
  redirect('/dashboard');
}

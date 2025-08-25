import { COOKIE_TOKEN } from '@/config';
import { LoginForm } from '@/components/login-form';
import { ThemeToggle } from '@/components/theme-toggle';
import { api } from '@/convex/_generated/api';
import { cookies } from 'next/headers';
import { fetchMutation } from 'convex/nextjs';
import { redirect } from 'next/navigation';

export default async function Login() {
  const cookie = await cookies();

  const token = cookie.get(COOKIE_TOKEN)?.value;

  if (token) {
    const validUser = await fetchMutation(api.auth.validateUser, { id: token });

    if (validUser) {
      return redirect('/dashboard');
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

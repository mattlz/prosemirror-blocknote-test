"use client";

/**
 * SignInForm - User authentication sign-in form component
 *
 * @remarks
 * Handles user authentication with email and password credentials.
 * Supports both sign-in and automatic sign-up for new users.
 * Provides comprehensive error handling and success messaging.
 * Integrates with Convex auth system and Next.js routing.
 *
 * @example
 * ```tsx
 * <SignInForm />
 * ```
 */

// 1. External imports
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthActions } from '@convex-dev/auth/react';
import Link from 'next/link';
import { CheckCircle, XCircle } from 'lucide-react';

// 2. Internal imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// 3. Types
interface SignInFormProps {
  // No props required for this component
}

// 4. Component definition
export const SignInForm = memo(function SignInForm({}: SignInFormProps) {
  // === 1. DESTRUCTURE PROPS ===
  // (No props to destructure)

  // === 2. HOOKS (Custom hooks first, then React hooks) ===
  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // === 3. MEMOIZED VALUES (useMemo for computations) ===
  // (No complex computations needed)

  // === 4. CALLBACKS (useCallback for all functions) ===
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await signIn('password', {
        email,
        password,
        flow: 'signIn',
      });
      router.push('/docs');
    } catch (err) {
      if (err instanceof Error && err.message.includes('InvalidAccountId')) {
        try {
          await signIn('password', {
            email,
            password,
            flow: 'signUp',
          });
          router.push('/docs');
        } catch (signUpErr) {
          let errorMessage = 'Authentication failed';
          if (signUpErr instanceof Error) {
            if (signUpErr.message.includes('InvalidSecret')) {
              errorMessage = 'Invalid email or password. Please check your credentials and try again.';
            } else if (signUpErr.message.includes('password')) {
              errorMessage = 'Incorrect password. Please try again or reset your password.';
            } else {
              errorMessage = signUpErr.message;
            }
          }
          setError(errorMessage);
        }
      } else {
        let errorMessage = 'Sign in failed';
        if (err instanceof Error) {
          if (err.message.includes('InvalidSecret')) {
            errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          } else if (err.message.includes('password')) {
            errorMessage = 'Incorrect password. Please try again or reset your password.';
          } else if (err.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, signIn, router]);

  // === 5. EFFECTS (useEffect for side effects) ===
  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'password_reset_success') {
      setSuccessMessage('Password reset successful! You can now sign in with your new password.');
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  // === 6. EARLY RETURNS (loading, error states) ===
  // (No early returns needed)

  // === 7. RENDER (JSX) ===
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="w-full max-w-md space-y-6">

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {successMessage && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  autoComplete="email"
                  placeholder="name@company.com"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/auth/reset-password" className="text-sm text-primary underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default SignInForm; 
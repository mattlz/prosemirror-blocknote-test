# Next.js + Convex Architecture Standards
> Reusable standards for all Next.js/Convex projects

## 1. Project Structure

### Required Directory Layout
```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   ├── (dashboard)/              # Dashboard route group
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── forms/                    # Form components
│   ├── layouts/                  # Layout components
│   └── features/                 # Feature-specific components
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts
│   ├── use-debounce.ts
│   └── use-[feature].ts
├── lib/                          # Core application logic
│   ├── utils.ts                  # Utility functions
│   ├── constants.ts              # App constants
│   └── validators.ts             # Validation logic
├── types/                        # TypeScript definitions
│   ├── globals.d.ts
│   └── [domain].types.ts
├── providers/                    # Context providers
│   └── [provider-name].tsx
└── styles/                       # Additional styles
    └── [component].module.css

convex/                           # Convex backend
├── _generated/                   # Generated files
├── schema.ts                     # Database schema
├── [table].ts                    # Table queries/mutations
├── auth.ts                       # Auth functions
└── lib/                          # Shared backend logic
```

## 2. Naming Conventions

### Files and Folders
- **Components**: `kebab-case.tsx` (e.g., `user-profile.tsx`)
- **Hooks**: `use-kebab-case.ts` (e.g., `use-auth-state.ts`)
- **Types**: `kebab-case.types.ts` (e.g., `user.types.ts`)
- **Utils**: `kebab-case.ts` (e.g., `date-helpers.ts`)
- **Routes**: `kebab-case/page.tsx`

### Code Entities
- **Components**: `PascalCase` (e.g., `UserProfile`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useAuthState`)
- **Types/Interfaces**: `PascalCase` (e.g., `UserProfile`, `IUserData`)
- **Functions**: `camelCase` (e.g., `formatDate`, `validateEmail`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_TIMEOUT`)
- **Enums**: `PascalCase` (e.g., `UserRole`, `Status`)

## 3. Component Architecture

### Component Template
```typescript
/**
 * ComponentName - Brief description
 * 
 * @remarks
 * Additional implementation notes
 */

// 1. External imports
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ExternalLib } from 'external-package';

// 2. Internal imports
import { LocalComponent } from '@/components/ui/local';
import { useCustomHook } from '@/hooks/use-custom';
import type { ComponentProps } from '@/types/component.types';

// 3. Types (if not in separate file)
interface ComponentNameProps {
  /** Required prop description */
  requiredProp: string;
  /** Optional prop description */
  optionalProp?: boolean;
  /** Callback prop description */
  onAction?: (value: string) => void;
}

// 4. Component definition
export function ComponentName({ 
  requiredProp,
  optionalProp = false,
  onAction,
}: ComponentNameProps) {
  // 5. State and refs
  const [localState, setLocalState] = useState<string>('');
  
  // 6. Hooks
  const customValue = useCustomHook();
  
  // 7. Memoized values
  const computedValue = useMemo(() => {
    return expensiveComputation(requiredProp);
  }, [requiredProp]);
  
  // 8. Callbacks
  const handleClick = useCallback((event: React.MouseEvent) => {
    onAction?.(localState);
  }, [localState, onAction]);
  
  // 9. Effects
  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup
    };
  }, [dependency]);
  
  // 10. Render
  return (
    <div className="component-wrapper">
      {/* Component JSX */}
    </div>
  );
}
```

### Component Rules
- Single responsibility principle
- Props interface always defined
- No inline styles (use Tailwind/CSS modules)
- Event handlers prefixed with `handle`
- Loading/error states handled
- Memoization for expensive operations
- Proper cleanup in effects

## 4. Type Safety

### Type Definition Standards
```typescript
// types/user.types.ts

/** User role enumeration */
export enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

/** Base user interface */
export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/** User creation data */
export type CreateUserInput = Pick<IUser, 'email' | 'name' | 'role'>;

/** User update data */
export type UpdateUserInput = Partial<Omit<IUser, 'id' | 'createdAt'>>;

/** API response types */
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/** Type guards */
export function isUser(value: unknown): value is IUser {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  );
}
```

### Type Rules
- No `any` types (use `unknown` for dynamic)
- All functions fully typed (params and return)
- Interfaces for objects, types for unions/primitives
- Type guards for runtime validation
- Generic constraints properly defined
- TSDoc comments for public APIs

## 5. Convex Patterns

### Schema Definition
```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("guest")),
    isActive: v.boolean(),
    metadata: v.optional(v.object({
      lastLogin: v.optional(v.number()),
      preferences: v.optional(v.any()),
    })),
  })
    .index("by_email", ["email"])
    .index("by_role", ["role", "isActive"]),
});
```

### Query/Mutation Pattern
```typescript
// convex/users.ts
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/** List all active users */
export const list = query({
  args: {
    role: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("users")
      .withIndex("by_role", q => 
        args.role 
          ? q.eq("role", args.role).eq("isActive", true)
          : q.eq("isActive", true)
      );
    
    return await query.collect();
  },
});

/** Create a new user */
export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("admin"), v.literal("user"), v.literal("guest")),
  },
  handler: async (ctx, args) => {
    // Validation
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first();
    
    if (existing) {
      throw new Error("User already exists");
    }
    
    // Creation
    return await ctx.db.insert("users", {
      ...args,
      isActive: true,
    });
  },
});
```

## 6. Hook Patterns

### Custom Hook Template
```typescript
// hooks/use-feature.ts

/**
 * useFeature - Description of hook purpose
 * 
 * @param config - Configuration options
 * @returns Hook state and methods
 */
export function useFeature(config?: FeatureConfig) {
  // Input validation
  if (config?.required && !config.value) {
    throw new Error('useFeature: required value missing');
  }
  
  // State
  const [state, setState] = useState<State>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs for stable values
  const configRef = useRef(config);
  
  // Memoized values
  const derivedValue = useMemo(() => {
    return computeValue(state);
  }, [state]);
  
  // Callbacks
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await performAction();
      setState(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Effects
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
  
  // Return stable API
  return useMemo(() => ({
    state,
    loading,
    error,
    execute,
    derivedValue,
  }), [state, loading, error, execute, derivedValue]);
}
```

### Hook Rules
- Always prefix with `use`
- Return stable references
- Handle loading/error states
- Proper dependency arrays
- Cleanup in effects
- Input validation
- TSDoc documentation

## 7. State Management

### Context Pattern
```typescript
// providers/feature-provider.tsx

interface FeatureContextValue {
  state: FeatureState;
  actions: {
    update: (value: Partial<FeatureState>) => void;
    reset: () => void;
  };
}

const FeatureContext = createContext<FeatureContextValue | undefined>(undefined);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FeatureState>(initialState);
  
  const actions = useMemo(() => ({
    update: (value: Partial<FeatureState>) => {
      setState(prev => ({ ...prev, ...value }));
    },
    reset: () => {
      setState(initialState);
    },
  }), []);
  
  const value = useMemo(() => ({
    state,
    actions,
  }), [state, actions]);
  
  return (
    <FeatureContext.Provider value={value}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  const context = useContext(FeatureContext);
  if (!context) {
    throw new Error('useFeature must be used within FeatureProvider');
  }
  return context;
}
```

### State Rules
- Context for global state
- Local state for component-specific
- Derived state via useMemo
- Immutable updates only
- No redundant state
- Clear data flow

## 8. Performance Standards

### Partial Pre-rendering (Next.js 15+)
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true, // Enable Partial Pre-rendering
  },
};

export default nextConfig;
```

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';

// Static shell - pre-rendered at build time
export default function DashboardPage() {
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        {/* Static UI elements */}
      </header>
      
      {/* Dynamic content with streaming */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

// Dynamic component - rendered at request time
async function DashboardContent() {
  noStore(); // Opt out of static rendering for this component
  const data = await fetchDashboardData();
  
  return (
    <div className="dashboard-content">
      {/* Dynamic content */}
    </div>
  );
}
```

### Streaming and Suspense
```typescript
// app/products/page.tsx
import { Suspense } from 'react';

export default function ProductsPage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductList category="featured" />
      </Suspense>
      
      <Suspense fallback={<ProductSkeleton />}>
        <ProductList category="new" />
      </Suspense>
      
      <Suspense fallback={<ProductSkeleton />}>
        <ProductList category="sale" />
      </Suspense>
    </div>
  );
}

// Each ProductList can load independently
async function ProductList({ category }: { category: string }) {
  const products = await fetchProducts(category);
  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} {...product} />
      ))}
    </div>
  );
}
```

### Server Actions (Next.js 15+)
```typescript
// app/actions/user.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  // Validate input
  if (!name || !email) {
    return { error: 'Missing required fields' };
  }
  
  // Update in database
  await updateUserInDB({ name, email });
  
  // Revalidate cache
  revalidatePath('/profile');
  redirect('/profile');
}

// app/profile/edit/page.tsx
import { updateUser } from '@/app/actions/user';

export default function EditProfile() {
  return (
    <form action={updateUser}>
      <input name="name" required />
      <input name="email" type="email" required />
      <button type="submit">Update Profile</button>
    </form>
  );
}
```

### Data Cache and Revalidation
```typescript
// Granular cache control
export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-static'; // Force static generation

// app/blog/[slug]/page.tsx
import { unstable_cache } from 'next/cache';

const getCachedPost = unstable_cache(
  async (slug: string) => fetchPostBySlug(slug),
  ['post-by-slug'],
  {
    revalidate: 3600,
    tags: ['posts'],
  }
);

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getCachedPost(params.slug);
  return <Article {...post} />;
}

// Revalidate on demand
import { revalidateTag } from 'next/cache';

export async function createPost() {
  // Create post logic
  revalidateTag('posts'); // Invalidate all cached posts
}
```

### Optimistic Updates
```typescript
// app/components/like-button.tsx
'use client';

import { useOptimistic } from 'react';
import { likePost } from '@/app/actions/posts';

export function LikeButton({ postId, initialLikes }: Props) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (state, newLike: number) => state + newLike
  );
  
  async function handleLike() {
    addOptimisticLike(1);
    await likePost(postId);
  }
  
  return (
    <button onClick={handleLike}>
      ❤️ {optimisticLikes}
    </button>
  );
}
```

### Parallel Data Fetching
```typescript
// app/dashboard/page.tsx
export default async function Dashboard() {
  // Parallel fetching - all start at same time
  const [user, stats, notifications] = await Promise.all([
    fetchUser(),
    fetchStats(),
    fetchNotifications(),
  ]);
  
  return (
    <div>
      <UserProfile {...user} />
      <StatsWidget {...stats} />
      <NotificationList items={notifications} />
    </div>
  );
}
```

### Image Optimization
```typescript
// app/components/optimized-image.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      placeholder="blur"
      blurDataURL={shimmer(800, 600)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={false} // Only for above-fold images
      loading="lazy" // Default behavior
      quality={75} // Balance quality vs size
    />
  );
}
```

### Route Segment Config
```typescript
// app/api/posts/route.ts
export const runtime = 'edge'; // Use Edge Runtime for better performance
export const preferredRegion = 'auto'; // Deploy close to data

// app/posts/page.tsx
export const fetchCache = 'force-cache'; // Cache all fetches
export const revalidate = 3600; // ISR - revalidate hourly
export const dynamic = 'error'; // Error if dynamic rendering required
```

### Optimization Checklist
- [ ] Partial Pre-rendering enabled for hybrid static/dynamic
- [ ] Streaming with Suspense for progressive loading
- [ ] Server Actions for form mutations
- [ ] Parallel data fetching with Promise.all
- [ ] React.memo for expensive components
- [ ] useMemo for computed values
- [ ] useCallback for stable functions
- [ ] Dynamic imports for code splitting
- [ ] Image optimization with next/image
- [ ] Debounced search/filter inputs
- [ ] Virtual scrolling for long lists
- [ ] Suspense boundaries for async components
- [ ] Edge Runtime for API routes where appropriate
- [ ] Proper cache strategies (static/dynamic/ISR)
- [ ] Optimistic updates for better UX
- [ ] Prefetching critical routes
- [ ] Bundle analysis and optimization
- [ ] Font optimization with next/font

### Performance Patterns
```typescript
// Memoized component
export const ExpensiveComponent = memo(({ data }: Props) => {
  return <div>{/* Component */}</div>;
});

// Debounced input
const debouncedValue = useDebounce(inputValue, 500);

// Lazy loading
const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <Skeleton />,
});
```

## 9. Error Handling

### Error Boundary
```typescript
// components/error-boundary.tsx
'use client';

interface Props {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

export function ErrorBoundary({ children, fallback: Fallback }: Props) {
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(new Error(event.message));
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (error && Fallback) {
    return <Fallback error={error} />;
  }
  
  return <>{children}</>;
}
```

### Error Handling Rules
- Try-catch in async operations
- Error boundaries at route level
- User-friendly error messages
- Logging for debugging
- Graceful degradation
- Recovery mechanisms

## 10. Authentication Architecture

### Middleware-Based Authentication (Next.js 15+)
```typescript
// middleware.ts (in project root)
import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/session';

// Define protected and public routes
const protectedRoutes = ['/dashboard', '/admin', '/profile'];
const publicRoutes = ['/login', '/signup', '/'];
const authRoutes = ['/login', '/signup'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);
  const isAuthRoute = authRoutes.includes(path);

  // Get session from cookie
  const sessionCookie = req.cookies.get('session')?.value;
  const session = await verifySession(sessionCookie);

  // Redirect logic
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes for auth
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
```

### Session Management
```typescript
// lib/auth/session.ts
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface SessionData {
  userId: string;
  email: string;
  role: 'admin' | 'user';
  expiresAt: Date;
}

export async function createSession(data: Omit<SessionData, 'expiresAt'>): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const token = await new SignJWT({ ...data, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  (await cookies()).set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function verifySession(token: string | undefined): Promise<SessionData | null> {
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionData;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  (await cookies()).delete('session');
}
```

### Route Handler Authentication
```typescript
// app/api/protected/route.ts
import { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value;
  const session = await verifySession(sessionCookie);
  
  if (!session) {
    return new Response(null, { status: 401 });
  }
  
  if (session.role !== 'admin') {
    return new Response(null, { status: 403 });
  }
  
  // Handle authorized request
  return Response.json({ data: 'protected data' });
}
```

### Server Component Authentication
```typescript
// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth/session';

export default async function DashboardPage() {
  const sessionCookie = (await cookies()).get('session')?.value;
  const session = await verifySession(sessionCookie);
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div>
      <h1>Welcome, {session.email}</h1>
      {/* Dashboard content */}
    </div>
  );
}
```

### Authentication Rules
- Use middleware for route-level protection
- Never expose sensitive data in JWT payload
- Always use httpOnly cookies for sessions
- Implement CSRF protection for mutations
- Use secure flag in production
- Rotate session tokens periodically
- Implement proper logout (clear client & server)
- Rate limit authentication endpoints
- Log authentication events for security

### Convex Authentication Integration
```typescript
// convex/auth.ts
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const authenticateUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify credentials
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", args.email))
      .first();
    
    if (!user || !await verifyPassword(args.password, user.hashedPassword)) {
      throw new Error("Invalid credentials");
    }
    
    // Return user data (handle session creation in API route)
    return {
      userId: user._id,
      email: user.email,
      role: user.role,
    };
  },
});

export const getCurrentUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});
```

## 11. Code Quality

### Quality Checklist
- [ ] ESLint configuration strict
- [ ] Prettier for formatting
- [ ] TypeScript strict mode
- [ ] No console.log in production
- [ ] No commented code
- [ ] Meaningful variable names
- [ ] Functions < 50 lines
- [ ] Files < 300 lines
- [ ] Cyclomatic complexity < 10

### Git Commit Standards
```
type(scope): subject

body (optional)

footer (optional)
```

Types: feat, fix, docs, style, refactor, test, chore

## 12. Testing Standards

### Test Structure
```typescript
// __tests__/component.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from '../component-name';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('should handle user interaction', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## 13. Documentation

### Documentation Requirements
- TSDoc for all public APIs
- README for complex features
- Inline comments for complex logic
- Architecture decisions in /docs
- API documentation
- Setup instructions

### TSDoc Example
```typescript
/**
 * Formats a date string to user-friendly format
 * 
 * @param date - ISO date string or Date object
 * @param format - Output format (short, long, relative)
 * @returns Formatted date string
 * 
 * @example
 * ```ts
 * formatDate('2024-01-01', 'short') // "Jan 1, 2024"
 * formatDate(new Date(), 'relative') // "2 hours ago"
 * ```
 */
export function formatDate(
  date: string | Date, 
  format: 'short' | 'long' | 'relative' = 'short'
): string {
  // Implementation
}
```

## 14. Security Standards

### Security Checklist
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Convex handles)
- [ ] XSS prevention (React handles)
- [ ] CSRF tokens for mutations
- [ ] Rate limiting on APIs
- [ ] Secure headers configured
- [ ] Environment variables for secrets
- [ ] No sensitive data in git

## 15. Accessibility

### Accessibility Checklist
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Color contrast compliance
- [ ] Screen reader testing
- [ ] Alt text for images
- [ ] Error messages associated with inputs

## 16. Environment Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
```

### Configuration Rules
- Never commit .env files
- Use NEXT_PUBLIC_ prefix for client vars
- Validate env vars at startup
- Type-safe env access
- Document all env vars

## Implementation Priority

### Next.js 15+ Specific Updates
- **App Router is now stable** - Use `app/` directory by default
- **Server Components by default** - Components are Server Components unless 'use client'
- **Partial Pre-rendering** - Combine static and dynamic rendering in same route
- **Server Actions** - Progressive enhancement for forms and mutations
- **Async Request APIs** - cookies(), headers() now require await
- **Improved TypeScript** - Better type inference and stricter defaults
- **React 19 Support** - Compatible with latest React features
- **Turbopack** - Available for faster development builds
- **unstable_cache** - Granular caching control for data fetching
- **Streaming by default** - Better initial page load performance
- **Enhanced Image Component** - Better performance with automatic optimization
- **Parallel Routes** - Load multiple pages simultaneously
- **Intercepting Routes** - Modal patterns with URL preservation

### Phase 1: Foundation
1. File structure alignment
2. Naming conventions
3. Type safety
4. Component patterns

### Phase 2: Quality
1. Error handling
2. Performance optimization
3. Testing setup
4. Documentation

### Phase 3: Excellence
1. Accessibility
2. Security hardening
3. Monitoring
4. CI/CD optimization
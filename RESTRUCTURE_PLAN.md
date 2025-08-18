# App Restructuring Plan - Clean Architecture & Next.js Standards

## Overview
This document outlines a comprehensive restructuring of the collaborative editor application to follow Next.js best practices, clean architecture principles, and modern React patterns. The goal is to improve maintainability, scalability, and developer experience while preserving all existing functionality.

## Current Architecture Issues

### 1. Monolithic Components
- `app/editor.tsx` is 570+ lines with mixed concerns
- Multiple components defined in single files
- Business logic mixed with UI rendering
- No clear separation of responsibilities

### 2. Authentication & Security
- Client-side authentication checks instead of middleware
- No route protection at the middleware level
- Auth logic scattered across components
- Missing proper session management

### 3. File Organization
- Flat component structure
- No clear feature boundaries
- Missing custom hooks for business logic
- Insufficient TypeScript type coverage

### 4. Code Quality Issues
- Missing error boundaries
- No loading states for async operations
- Inconsistent naming conventions
- Limited documentation and comments

## Target Architecture

### Folder Structure
```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Route group for auth pages
│   │   ├── signin/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   ├── layout.tsx            # Auth-specific layout
│   │   ├── loading.tsx           # Auth loading state
│   │   └── error.tsx             # Auth error boundary
│   ├── (dashboard)/              # Protected routes group
│   │   ├── docs/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── loading.tsx
│   │   │   │   └── error.tsx
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── layout.tsx            # Dashboard layout with nav
│   │   └── not-found.tsx         # Dashboard 404 page
│   ├── api/                      # API routes (future expansion)
│   ├── globals.css
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing/welcome page
│   ├── loading.tsx               # Global loading
│   ├── error.tsx                 # Global error boundary
│   ├── not-found.tsx             # Global 404 page
│   └── providers.tsx             # App-wide providers
├── components/                    # Reusable UI components
│   ├── ui/                       # Base UI components (shadcn/ui style)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── index.ts              # Barrel exports
│   ├── editor/                   # Editor-specific components
│   │   ├── block-note-editor.tsx
│   │   ├── editor-toolbar.tsx
│   │   ├── presence-avatars.tsx
│   │   ├── remote-cursor-plugin.tsx
│   │   └── index.ts
│   ├── sidebar/                  # Sidebar components
│   │   ├── page-sidebar.tsx
│   │   ├── page-tree.tsx
│   │   ├── page-menu.tsx
│   │   ├── icon-picker.tsx
│   │   └── index.ts
│   ├── comments/                 # Comment system
│   │   ├── comments-sidebar.tsx
│   │   ├── comment-thread.tsx
│   │   ├── comment-form.tsx
│   │   ├── comment-item.tsx
│   │   └── index.ts
│   ├── auth/                     # Auth components
│   │   ├── auth-form.tsx
│   │   ├── auth-controls.tsx
│   │   ├── sign-in-form.tsx
│   │   ├── sign-up-form.tsx
│   │   └── index.ts
│   └── layout/                   # Layout components
│       ├── top-bar.tsx
│       ├── main-layout.tsx
│       ├── dashboard-nav.tsx
│       └── index.ts
├── hooks/                        # Custom React hooks
│   ├── auth/
│   │   ├── use-auth.ts
│   │   └── use-auth-redirect.ts
│   ├── data/
│   │   ├── use-documents.ts
│   │   ├── use-pages.ts
│   │   ├── use-comments.ts
│   │   └── use-presence.ts
│   ├── editor/
│   │   ├── use-editor.ts
│   │   ├── use-block-selection.ts
│   │   └── use-editor-sync.ts
│   ├── ui/
│   │   ├── use-sidebar.ts
│   │   ├── use-modal.ts
│   │   └── use-toast.ts
│   └── index.ts                  # Barrel exports
├── lib/                          # Utility functions & configs
│   ├── convex.ts                 # Convex client setup
│   ├── auth.ts                   # Auth utilities
│   ├── utils.ts                  # General utilities (cn, etc.)
│   ├── constants.ts              # App constants
│   ├── validations.ts            # Form validation schemas
│   └── types.ts                  # Shared type guards
├── types/                        # TypeScript type definitions
│   ├── auth.ts
│   ├── documents.ts
│   ├── pages.ts
│   ├── comments.ts
│   ├── editor.ts
│   ├── api.ts
│   └── index.ts                  # Barrel exports
└── middleware.ts                 # Next.js middleware for auth
```

## Implementation Phases

### Phase 1: Infrastructure Setup
**Goal**: Establish proper project structure and middleware

#### Tasks:
1. **Create src/ directory structure**
   - Set up all folders according to the target structure
   - Create index.ts barrel export files for components

2. **Implement middleware authentication**
   - Create `middleware.ts` with proper route protection
   - Remove client-side auth checks from components
   - Add proper redirect logic

3. **Set up route groups**
   - Create `(auth)` route group for signin/signup
   - Create `(dashboard)` route group for protected routes
   - Add appropriate layouts for each group

4. **Add error boundaries and loading states**
   - Global error boundary in root layout
   - Route-specific loading and error pages
   - Proper error handling patterns

### Phase 2: Component Decomposition
**Goal**: Break down monolithic components into focused, reusable pieces

#### Tasks:
1. **Extract editor components**
   - Move `DocumentEditor` → `components/editor/block-note-editor.tsx`
   - Extract `remoteCursorPlugin` → `components/editor/remote-cursor-plugin.tsx`
   - Create `components/editor/editor-toolbar.tsx` for toolbar functionality
   - Move `PresenceAvatars` → `components/editor/presence-avatars.tsx`

2. **Extract sidebar components**
   - Move `Sidebar` → `components/sidebar/page-sidebar.tsx`
   - Extract page tree logic → `components/sidebar/page-tree.tsx`
   - Move page menu → `components/sidebar/page-menu.tsx`
   - Move `IconPicker` → `components/sidebar/icon-picker.tsx`

3. **Extract auth components**
   - Move `AuthControls` → `components/auth/auth-controls.tsx`
   - Create `components/auth/sign-in-form.tsx`
   - Create `components/auth/sign-up-form.tsx`
   - Create shared `components/auth/auth-form.tsx`

4. **Extract layout components**
   - Create `components/layout/top-bar.tsx`
   - Create `components/layout/main-layout.tsx`
   - Create `components/layout/dashboard-nav.tsx`

### Phase 3: Custom Hooks Extraction
**Goal**: Separate business logic from UI components

#### Tasks:
1. **Create data hooks**
   ```typescript
   // hooks/data/use-documents.ts
   export function useDocuments() {
     // Document CRUD operations
   }
   
   // hooks/data/use-pages.ts
   export function usePages(documentId: string | null) {
     // Page hierarchy management
   }
   
   // hooks/data/use-comments.ts
   export function useComments(docId: string) {
     // Comment operations
   }
   ```

2. **Create editor hooks**
   ```typescript
   // hooks/editor/use-editor.ts
   export function useBlockNoteEditor(docId: string) {
     // Editor initialization and sync
   }
   
   // hooks/editor/use-block-selection.ts
   export function useBlockSelection(editor: BlockNoteEditor) {
     // Block selection utilities
   }
   ```

3. **Create UI hooks**
   ```typescript
   // hooks/ui/use-sidebar.ts
   export function useSidebar() {
     // Sidebar state management
   }
   
   // hooks/ui/use-modal.ts
   export function useModal() {
     // Modal state management
   }
   ```

### Phase 4: TypeScript Enhancement
**Goal**: Add comprehensive type safety throughout the application

#### Tasks:
1. **Create type definitions**
   ```typescript
   // types/documents.ts
   export interface Document {
     _id: string
     title: string
     createdAt: number
     ownerId?: string
     archivedAt?: number
   }
   
   // types/pages.ts
   export interface Page {
     _id: string
     documentId: string
     parentPageId?: string
     docId: string
     title: string
     icon?: string
     order: number
     createdAt: number
   }
   ```

2. **Add component prop interfaces**
   - Proper TypeScript interfaces for all component props
   - Generic types for reusable components
   - Strict typing for Convex API responses

3. **Create utility types**
   - Form validation types
   - API response types
   - State management types

### Phase 5: Code Quality & Documentation
**Goal**: Add comprehensive documentation and improve code quality

#### Tasks:
1. **Add JSDoc comments**
   ```typescript
   /**
    * Custom hook for managing page hierarchy and operations
    * @param documentId - The ID of the document containing the pages
    * @returns Page management functions and state
    */
   export function usePages(documentId: string | null) {
     // Implementation
   }
   ```

2. **Create component documentation**
   - Props documentation for all components
   - Usage examples in comments
   - Clear component responsibilities

3. **Add error handling**
   - Proper error boundaries
   - Error toast notifications
   - Graceful failure handling

## Migration Strategy

### Step-by-Step Process:
1. **Create new structure** alongside existing code
2. **Migrate components one by one** while maintaining functionality
3. **Update imports** progressively
4. **Test each migration step** thoroughly
5. **Remove old files** only after successful migration

### Testing Strategy:
- Test each component migration individually
- Verify all existing functionality works
- Check authentication flows
- Test comment system integration
- Verify editor synchronization

## Success Metrics

### Code Quality:
- Reduced file sizes (no files > 200 lines)
- Improved TypeScript coverage (100% for new code)
- Clear separation of concerns
- Consistent naming conventions

### Developer Experience:
- Faster development iteration
- Easier testing and debugging
- Clear file organization
- Comprehensive documentation

### Performance:
- Better code splitting
- Reduced bundle sizes
- Improved loading times
- Better caching strategies

## Maintenance Guidelines

### File Organization Rules:
1. One component per file
2. Co-locate related components
3. Use barrel exports for clean imports
4. Follow consistent naming conventions

### Component Design Principles:
1. Single responsibility principle
2. Props interface first
3. Comprehensive JSDoc comments
4. Error boundary integration

### Hook Design Patterns:
1. Separate data fetching from UI logic
2. Return stable object references
3. Handle loading and error states
4. Provide clear return type interfaces

This restructuring will create a maintainable, scalable codebase that follows modern React and Next.js best practices while preserving all existing functionality.
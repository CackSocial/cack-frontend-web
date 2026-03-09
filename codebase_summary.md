# Cack Frontend Web - Codebase Summary

This document provides a comprehensive overview of the `cack-frontend-web` codebase. It is designed to help AI agents and developers quickly understand the project structure, architectural patterns, state management, routing, styling, and key components.

## Overview
The `cack-frontend-web` project is a modern web application built with:
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** React Router 7
- **State Management:** Zustand
- **Testing:** Vitest and React Testing Library

The application features a clear distinction between public (login/register) and protected (home, profile, etc.) routes. It uses a clean architecture separating UI components, business logic (stores), and data fetching (API).

## Architecture & Patterns

### 1. Routing (`src/App.tsx`, `src/main.tsx`)
React Router 7 is used for navigation. The application employs route guards (`ProtectedRoute` and `PublicRoute`) to manage access based on authentication state, supporting lazy loading for performance.

### 2. State Management (`src/stores/`)
Zustand is utilized for global state management, with a domain-driven approach dividing the state into specific stores:
- `authStore.ts`: Manages authentication state and user profile data.
- `postsStore.ts`: Centralized state for posts, timelines, and social interactions like likes and reposts.
- Other stores handle messages, notifications, explore, themes, and toasts.

### 3. API Layer (`src/api/`)
The application uses a custom fetch wrapper (`client.ts`) that handles:
- CSRF tokens
- Bearer authentication headers
- Error handling (`APIError`)
This layer provides a clean interface for UI components to interact with backend services.

### 4. Styling & Theming (`src/styles/`, `src/components/`)
- **Methodology:** CSS Modules are used for component-level styling, ensuring encapsulation.
- **Theming:** A robust light/dark theming system is implemented using global CSS variables (`variables.css`), driven by `[data-theme='light']` and `[data-theme='dark']` attributes.

## Key Files & Locations

| File Path | Description | Key Symbols |
|-----------|-------------|-------------|
| `src/App.tsx` | Defines the routing structure and access control for the application. | `App`, `ProtectedRoute`, `PublicRoute` |
| `src/api/client.ts` | The base API client handling authentication headers and CSRF tokens. | `request`, `get`, `post`, `APIError` |
| `src/stores/authStore.ts` | Manages authentication state and user profile. | `useAuthStore` |
| `src/stores/postsStore.ts` | Centralized state for posts, timeline, and social interactions. | `usePostsStore` |
| `src/styles/variables.css` | Contains the theme-switching logic using CSS variables. | `[data-theme='light']`, `[data-theme='dark']` |
| `src/components/layout/AppLayout.tsx` | The main layout component structuring the Sidebar, Main Content, and Right Panel. | `AppLayout` |

## Exploration Trace
For context on how this summary was compiled, the following areas were investigated:
1. Read `package.json` to identify the technology stack.
2. Examined `PROJECT-DEFINITION.md` for project goals and core features.
3. Analyzed `src/main.tsx` and `src/App.tsx` for entry point, global styles, and routing configuration.
4. Explored `src/api/` directory and `client.ts` to understand the custom API fetch layer.
5. Investigated `src/stores/` to understand Zustand state management.
6. Reviewed `src/styles/` for the styling approach using CSS Variables and Modules.
7. Examined `src/components/` and `src/pages/` to understand the UI architecture and layout.
8. Checked `src/types/index.ts` for the core data models.
9. Looked into `src/test/` and `__tests__` folders for the Vitest testing setup.
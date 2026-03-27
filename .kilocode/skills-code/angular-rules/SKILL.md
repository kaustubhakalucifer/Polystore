# 🔷 Polystore Frontend - Angular Coding Standards & Skills

This document defines the architectural patterns, coding standards, and best practices for the Polystore Angular application. **All developers and AI coding agents must adhere strictly to these guidelines.**

## 1. Core Architecture & Angular Version

- **Version:** Angular 17+
- **Paradigm:** We use **Standalone Components** exclusively. Do NOT generate or use `NgModules`.
- **Control Flow:** Use the new declarative control flow syntax (`@if`, `@for`, `@switch`) instead of structural directives (`*ngIf`, `*ngFor`).
- **Lazy Loading:** Use functional route declarations (`loadComponent`, `loadChildren`) in `app.routes.ts`.

## 2. State Management (Signals First)

- **Signals:** Use Angular Signals (`signal`, `computed`, `effect`) for all synchronous local component state and shared UI state (e.g., `ThemeService`, `SidebarService`).
- **RxJS:** Use RxJS (`Observable`, `BehaviorSubject`) primarily for asynchronous data streams, HTTP requests, and complex event handling.
- **Interoperability:** Use `toSignal()` and `toObservable()` when bridging between the two paradigms.

## 3. Component Design (Smart vs. Presentational)

- **Smart (Container) Components:**
  - Placed in `src/app/pages/` or `src/app/features/`.
  - Responsible for injecting services, fetching data, and managing state.
  - Pass data down to child components via `@Input()`.
- **Presentational (Dumb) Components:**
  - Placed in `src/app/shared/components/`.
  - Receive data via `@Input()` and emit events via `@Output()`.
  - Should have zero knowledge of backend APIs or routing.

## 4. Styling & Tailwind CSS

- **Framework:** We use Tailwind CSS strictly. Do not write custom CSS in `.css`/`.scss` files unless absolutely necessary for complex animations or third-party overrides.
- **Dark Mode:** We use the `class` strategy. Prefix dark mode styles with `dark:` (e.g., `bg-white dark:bg-slate-900`). The `ThemeService` handles toggling the `.dark` class on the `<html>` root element.
- **Custom Colors:** Always use the Polystore color palette defined in the Tailwind config/theme (`poly-50` to `poly-950`, `surface-light`, `surface-dark`).

## 5. Forms & Validation

- **Strategy:** Use **Reactive Forms** (`ReactiveFormsModule`) exclusively. Do not use Template-Driven forms (`[(ngModel)]`).
- **Strong Typing:** Always type your forms using the generic `FormGroup<{...}>` or `FormControl<T>` to ensure compile-time safety.
- **FormBuilders:** Use the injected `FormBuilder` service (`inject(NonNullableFormBuilder)` preferred) to construct forms.

## 6. HTTP & Infrastructure

- **Interceptors:** Use functional interceptors (`HttpInterceptorFn`).
  - `auth.interceptor.ts`: Attaches the `Authorization: Bearer <token>` header.
  - `organization.interceptor.ts`: Attaches the `x-organization-id` header based on the active organization context.
- **Guards:** Use functional guards (`CanActivateFn`).
  - Rely on `inject(Router)` and `inject(AuthService)` to protect routes.
- **Typed Responses:** All HTTP calls must expect the backend's generic response wrapper:
  `Observable<ApiResponse<T>>` or `Observable<PaginatedResult<T>>`.

## 7. Dependency Injection

- **Syntax:** Prefer using the `inject()` function over constructor injection for cleaner classes, especially when extending classes or writing functional guards/interceptors.

  ```typescript
  // Prefer this:
  private authService = inject(AuthService);
  private router = inject(Router);

  // Over this:
  // constructor(private authService: AuthService, private router: Router) {}
  ```

8. Naming Conventions & File Structure
   Files: kebab-case (e.g., user-profile.component.ts).
   Classes: PascalCase (e.g., UserProfileComponent).
   Methods/Variables: camelCase (e.g., fetchUserData()).
   Interfaces: PascalCase, do NOT prefix with 'I' (e.g., User, not IUser).
   Observables: Suffix with $ (e.g., users$ = this.http.get(...)).
9. Security
   Never store sensitive credentials (AWS keys, etc.) in the frontend code.
   Always sanitize user input if rendering raw HTML (use DomSanitizer).
   Tokens (JWT) should be stored securely and managed by the AuthService.

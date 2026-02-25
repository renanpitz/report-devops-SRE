# AI Coding Rules for This App

These rules are for AI assistants modifying this codebase. Follow them strictly to keep the project consistent and maintainable.

---

## Tech Stack Overview (5–10 key points)

- **Framework:** React with **TypeScript**, using functional components and hooks only (no class components).
- **Routing:** **React Router** with the main routing configuration in `src/App.tsx`.
- **Structure:**
  - Pages in `src/pages/`
  - Reusable components in `src/components/`
  - Main (default) page in `src/pages/Index.tsx`
- **UI Library:** **shadcn/ui** components as the primary UI building blocks, backed by Radix UI primitives.
- **Styling:** **Tailwind CSS** for all layout, spacing, colors, and general styling via utility classes.
- **Icons:** **lucide-react** as the single source for icons.
- **Language & Types:** Strict preference for **typed** code; new code must be written in TypeScript (`.tsx` / `.ts`).
- **State & Data Flow:** Use React hooks (`useState`, `useEffect`, etc.) and component props for state; avoid introducing new global state libraries unless explicitly requested.
- **Build & Dev:** The app is run and managed by the host environment (Rebuild / Restart / Refresh buttons) rather than shell commands.

---

## Library & Tooling Rules

### 1. React & TypeScript

- Use **function components** with hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, etc.).
- Prefer **explicit prop types** via `type` or `interface` declarations.
- Avoid `any` whenever reasonably possible; use generics and union types for clarity.
- New files should use the `.tsx` extension for components and `.ts` for non-React modules.

### 2. Routing (React Router)

- All routes must be added or updated in **`src/App.tsx`**.
- Each URL path should point to a component from **`src/pages/`**.
- Do not introduce a second routing system or manual history management.

### 3. File & Folder Organization

- **Pages**
  - Place top-level route components in `src/pages/`.
  - Name files with **PascalCase** (e.g., `Dashboard.tsx`, `UserProfile.tsx`).
- **Components**
  - Place shared/reusable UI pieces in `src/components/`.
  - Prefer small, focused components over large, monolithic ones.
- **Rule:** When adding new UI that will be navigated to directly, create a page under `src/pages/` and wire it up in `src/App.tsx`.

### 4. UI Components: shadcn/ui

- **shadcn/ui is the default UI library.**
  - Use shadcn/ui for buttons, forms, dialogs, dropdowns, navigation, cards, inputs, etc.
- **Do NOT edit shadcn/ui source files directly.**
  - If you need custom behavior, **wrap** shadcn/ui components in new components under `src/components/`.
- Favor composition:
  - Build new components by composing shadcn/ui primitives (e.g., `Button`, `Input`, `Card`, `Dialog`, `Tabs`, etc.).

### 5. Styling: Tailwind CSS

- **Tailwind is the only styling system** for layout and visual design.
  - Use Tailwind utility classes directly in `className` strings.
- Do **not** add CSS-in-JS libraries (styled-components, emotion, etc.).
- Avoid new global CSS files unless absolutely necessary.
- Keep className usage readable by:
  - Grouping related utilities (layout, spacing, typography) logically.
  - Extracting complex combinations into small wrapper components when reused.

### 6. Icons: lucide-react

- Use **lucide-react** for all icons.
- Do not add alternative icon libraries (Heroicons, Font Awesome, etc.).
- Import icons **individually** from `lucide-react` (e.g., `import { Search } from "lucide-react";`).

### 7. State Management & Data Fetching

- Use **React hooks** and local component state by default.
- Lift state up via props where necessary; keep data flow predictable and simple.
- Do not add new global state management libraries (Redux, Zustand, MobX, etc.) unless explicitly requested.
- For async logic, use `async/await` and proper error handling where appropriate, but avoid overengineering.

### 8. App Lifecycle & Commands

- Do not instruct users to run shell commands (e.g., `npm install`, `npm run dev`).
- When relevant, suggest using the **Rebuild**, **Restart**, or **Refresh** actions via the host UI.

### 9. Implementation Discipline

- **No partial implementations:**
  - Every feature you add must be fully wired into the UI and reachable (especially via `src/pages/Index.tsx` when applicable).
  - Avoid leaving `TODO` comments or unimplemented placeholders.
- **Minimalism:**
  - Implement the **simplest thing that satisfies the request**.
  - Avoid unnecessary abstractions, configuration, or optimizations.

### 10. Main Page Rules

- The default page is `src/pages/Index.tsx`.
- When you add new top-level components or key features, **update `Index.tsx`** so the user can see them in the main preview unless the feature belongs on another specific route.

---

## When in Doubt

- Prefer:
  - React + TypeScript
  - shadcn/ui for components
  - Tailwind CSS for styling
  - lucide-react for icons
  - React Router with routes in `src/App.tsx`
- Keep changes scoped, clear, and easy to read.
- If a requested change seems to contradict these rules, call it out and choose the option that preserves consistency unless the instructions explicitly override these rules.

# Job Grading Tool

An internal job role grading tool using the **Point-Factor Method**.

## Features

- **Pure frontend** — no backend, no database, no authentication
- **Portable** — state stored in JSON files (import/export)
- **Zero cloud dependency** — runs entirely in the browser, works offline
- **GitHub Pages ready** — deploy as a static site for free

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

The built output will be in the `dist/` directory.

### Testing

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

## Usage

1. **Company Setup** — Enter your company details and revenue bracket
2. **Import Roles** — Add job roles via CSV/JSON import or manual entry
3. **Grade Roles** — Assign point values across factors (Knowledge, Skills, Impact, etc.)
4. **Review & Compare** — View graded roles, compare positions, and export results

## Export & Import

- **Export** — Download your grading project as a JSON file
- **Import** — Load a previously saved JSON project
- **CSV Export** — Export graded roles as CSV for sharing

## Tech Stack

- [Svelte 5](https://svelte.dev/) — UI framework
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Vite](https://vite.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Vitest](https://vitest.dev/) — Testing

## License

Private — internal use only.

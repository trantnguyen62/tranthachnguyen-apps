# Contributing to TranThachNguyen Apps

Thank you for your interest in contributing! This document provides guidelines for contributing to any of the projects in this monorepo.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Project Structure](#project-structure)

---

## 🚀 Getting Started

1. **Fork the repository** and clone it locally
2. **Install dependencies** for the app you want to work on:
   ```bash
   cd <app-name>
   npm install
   ```
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

---

## 🛠️ Development Setup

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- Docker (optional, for deployment testing)

### Environment Variables

Most apps require a Gemini API key:

```bash
cp .env.example .env.local
# Add your GEMINI_API_KEY
```

### Running Locally

```bash
# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🎨 Code Style

### General Guidelines

- Use **TypeScript** where possible
- Follow **ESLint** rules (if configured)
- Use **meaningful variable names**
- Add **comments** for complex logic
- Keep functions **small and focused**

### File Naming

- React components: `PascalCase.tsx`
- Utilities/hooks: `camelCase.ts`
- Styles: `kebab-case.css`
- Constants: `UPPER_SNAKE_CASE`

### React Best Practices

- Use functional components with hooks
- Keep components focused on one responsibility
- Extract reusable logic into custom hooks
- Use proper TypeScript types for props

---

## 📝 Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(linguaflow): add voice recording indicator
fix(nanoedit-ai): resolve image upload timeout
docs(readme): update deployment instructions
```

---

## 🔀 Pull Requests

1. **Update your branch** with the latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Test your changes** thoroughly

3. **Create a PR** with:
   - Clear title following commit message format
   - Description of changes
   - Screenshots for UI changes
   - Link to related issues

4. **Address review feedback** promptly

---

## 📁 Project Structure

Each app follows a similar structure:

```
app-name/
├── index.html          # Entry HTML
├── index.tsx           # React entry point
├── App.tsx             # Main component
├── components/         # Reusable components
├── hooks/              # Custom React hooks
├── services/           # API services
├── utils/              # Utility functions
├── types.ts            # TypeScript types
├── package.json        # Dependencies
├── Dockerfile          # Docker config
└── README.md           # App documentation
```

---

## ❓ Questions?

If you have questions, feel free to open an issue or reach out!

---

© 2025 Tran Thach Nguyen

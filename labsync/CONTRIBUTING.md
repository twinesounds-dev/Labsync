# Contributing to LabSync

Thank you for considering contributing to LabSync! This document provides guidelines for contributing to the project.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)
- **Environment details** (OS, browser, Node version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case/rationale**
- **Proposed solution**
- **Alternative solutions** (if any)

### Pull Requests

1. Fork the repository
2. Create a new branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Write or update tests
5. Ensure all tests pass
6. Update documentation
7. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
8. Push to the branch (`git push origin feature/AmazingFeature`)
9. Open a Pull Request

## Development Setup

1. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/labsync.git
   cd labsync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use proper typing (avoid `any` when possible)
- Document complex functions

### React Components

- Use functional components with hooks
- Keep components small and focused
- Use proper prop typing
- Add comments for complex logic

### Styling

- Use Tailwind CSS utility classes
- Follow the existing color scheme
- Ensure responsive design
- Test on different screen sizes

### Git Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (Add, Update, Fix, Remove)
- Reference issues when applicable
- Keep messages under 72 characters

Example:
```
Add patient search functionality

- Implement search by patient ID
- Add search by name
- Update UI with search results

Fixes #123
```

## Testing

- Write tests for new features
- Update tests when modifying existing features
- Ensure all tests pass before submitting PR

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for functions
- Update type definitions
- Add examples for new features

## Questions?

Feel free to create an issue for:
- Questions about the codebase
- Clarification on contributing guidelines
- Feature proposals
- General discussion

Thank you for contributing to LabSync! 🎉

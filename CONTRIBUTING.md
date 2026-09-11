# Contributing to Private Revenue Split

Thank you for your interest in contributing! This document outlines the process for contributing to the Private Revenue Split dApp.

## Code of Conduct

By participating in this project, you agree to maintain a respectful, harassment-free environment.

## How to Contribute

### Reporting Bugs

1. Search existing [GitHub Issues](https://github.com/midnight-developer/private-revenue-split/issues) to ensure the bug hasn't been reported.
2. Open a new issue using the **Bug Report** template.
3. Include steps to reproduce, expected behavior, and actual behavior.

### Suggesting Features

1. Open a [Feature Request issue](https://github.com/midnight-developer/private-revenue-split/issues/new).
2. Describe the problem it solves and how it aligns with the privacy-first ethos of the project.

### Submitting Pull Requests

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/your-feature-name`.
3. Make your changes, ensuring:
   - TypeScript types are correct (`npm run tsc --noEmit`).
   - All existing tests pass (`npm test`).
   - New functionality is covered by tests.
4. Commit with descriptive messages following [Conventional Commits](https://www.conventionalcommits.org/).
5. Open a PR targeting the `main` branch with a clear description.

## Privacy Guidelines

All contributions must preserve the zero-knowledge privacy guarantees:
- **Never** expose recipient secrets or salt values on-chain.
- **Never** log private witness data to the console in production paths.
- **Always** use ZK nullifiers for one-time action enforcement.

## Development Setup

See [README.md](README.md) for full setup instructions.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).

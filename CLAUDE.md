# Bestpresso Development Guide

Bestpresso is a companion web app for Decent Espresso machines, built with React and Vite.

## Quick Start

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm test          # Run test suite
npm run lint      # Lint code
```

## Architecture

- **React 19** with TypeScript
- **Vite** for bundling
- **Decaid WebSocket API** for machine communication (localhost:8080)
- **GitHub Releases** for distribution to Decent machines

### Key Directories

- `src/app/` - App shell and layout
- `src/features/` - Feature modules (brew, profiles, settings, history)
- `src/components/` - Reusable UI components
- `src/domain/` - Domain logic and types
- `src/api/` - API integrations (Decaid)
- `test/` - Test files

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feat/your-feature
# Work on your feature
npm test         # Verify tests pass
npm run build    # Verify build succeeds
```

### Running Tests

```bash
npm test
```

All changes must pass the full test suite (157 tests).

## Release Process

Use the `/release` command to create a GitHub release:

```
/release
```

This will:
1. Prompt for version number
2. Build the app
3. Create a .zip asset
4. Generate GitHub release with notes
5. Push to your fork

## Deployment

Decent machines pull skins from GitHub releases. When you create a release:

1. Visit: https://github.com/dbarranco/bestpresso/releases
2. Download the `.zip` asset
3. Install on your Decent machine

## Git Conventions

- `main` - Production-ready code
- `feat/` - Feature branches (create PRs from these)
- `settings-panel` - Separate feature branch (not in main PR)

### Example Branches

- `feat/carousel-improvements` → PR#21 (carousel UI/UX)
- `settings-panel` → Separate feature (in-app settings)

## Pull Requests

For xinghendri/bestpresso:
- Create focused PRs with minimal scope
- Clean commit history (squash if needed)
- All tests must pass
- Use `/release` only after main PR is merged

## Performance

- Use React.memo for expensive components
- Use useMemo for derived values
- Maintain 60fps carousel interactions
- CSS uses custom properties for theming

## Component Patterns

### Settings Components

Settings follow the `EditableSetting` pattern with:
- `min`/`max` for value bounds
- `step` for increment
- `presets` for quick selections
- `onSave` callback for persistence

Example: `VALUE_ADJUSTMENTS` in `src/domain/valueAdjustments.ts`

### Utilities

Machine utilities (steam, water, scale) are defined in the model and rendered via:
- `MachineUtilityCard` - Card UI
- `Metric` - Individual metric display
- `editForMachineSetting` - Edit configuration

## Resources

- [React 19 Docs](https://react.dev)
- [Vite Docs](https://vitejs.dev)
- [Decent Documentation](https://www.decentespresso.com)

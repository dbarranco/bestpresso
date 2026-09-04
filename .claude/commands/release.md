# Create a GitHub Release

Create a new release for Bestpresso with a versioned .zip asset.

**Prerequisites:**
- All changes committed to main
- Tests passing locally
- GitHub CLI (gh) installed

**Steps:**

1. Ask for the version number (semantic versioning: e.g., 0.1.24)
2. Verify main branch is up to date
3. Run full test suite
4. Build production assets
5. Create .zip of dist folder
6. Generate release notes from recent commits
7. Create GitHub release with the zip asset
8. Clean up temporary files

**Example Usage:**

```
/release
```

Then enter version when prompted (e.g., `0.1.24`).

**What it does:**

- Creates git tag for the version
- Builds the app with `npm run build`
- Zips the dist folder: `bestpresso-vX.X.X.zip`
- Creates GitHub release at: `https://github.com/dbarranco/bestpresso/releases/tag/vX.X.X`
- Uploads .zip as release asset
- Machine can now pull the skin via Decaid

**After Release:**

- Verify on GitHub: https://github.com/dbarranco/bestpresso/releases
- Check that .zip asset is present
- Download and test on Decent machine

**Rollback:**

If something goes wrong:
```bash
git tag -d vX.X.X
gh release delete vX.X.X
```

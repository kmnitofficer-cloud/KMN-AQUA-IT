# KMN-AQUA-IT DASHBOARD

[![Deploy to GitHub Pages](https://github.com/kmnitofficer-cloud/KMN-AQUA-IT/actions/workflows/deploy.yml/badge.svg)](https://github.com/kmnitofficer-cloud/KMN-AQUA-IT/actions/workflows/deploy.yml)

🌐 **Live GitHub Pages Preview**: [https://kmnitofficer-cloud.github.io/KMN-AQUA-IT/](https://kmnitofficer-cloud.github.io/KMN-AQUA-IT/)

---

## ⚡ Automated CI/CD Workflow

This repository is equipped with a GitHub Actions workflow (`.github/workflows/deploy.yml`):
- **Trigger**: Automatically runs whenever code is pushed or merged into the `main` branch (and supports manual execution via `workflow_dispatch`).
- **Build & Package**:
  - Automatically identifies pre-built distribution assets or executes `npm run build` if a Node.js project is present.
  - Automatically provisions `.nojekyll` to ensure all asset paths and routing operate smoothly.
- **GitHub Pages Preview**: Automatically publishes the site to GitHub Pages and prints the direct preview URL in the GitHub Actions summary.

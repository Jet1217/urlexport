# Website Export Service

A service that exports websites as PDF or image files using Puppeteer.

## Features

- Export websites as PDF files
- Export websites as images (PNG or JPEG)
- Full page or viewport screenshots
- No permanent storage - exports are streamed directly to the client
- Cost-optimized with resource limits and timeouts

## Deployment on Render

### Option 1: Deploy as a Web Service using Docker

1. Create a new Render account or log in to your existing account
2. Go to the Dashboard and click "New" > "Web Service"
3. Connect your GitHub/GitLab repository or use the "Public Git repository" option
4. Configure the service:
   - **Name**: Choose a service name
   - **Environment**: Docker
   - **Branch**: main (or your preferred branch)
   - **Plan**: Select the appropriate plan (Starter plan is recommended for cost-effectiveness)
   - **Instance Type**: Choose the smallest that works for your needs (at least 512MB RAM)
   - **Health Check Path**: `/health`

5. Click "Create Web Service"

### Option 2: Deploy as a Web Service without Docker

1. Create a new Render account or log in to your existing account
2. Go to the Dashboard and click "New" > "Web Service"
3. Connect your GitHub/GitLab repository or use the "Public Git repository" option
4. Configure the service:
   - **Name**: Choose a service name
   - **Environment**: Node
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Plan**: Select the appropriate plan (Starter plan is recommended for cost-effectiveness)
   - **Instance Type**: Choose the smallest that works for your needs (at least 512MB RAM)
   - **Health Check Path**: `/health`
   - **Advanced** > **Environment Variables**:
     - Add `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true`
     - Add `PUPPETEER_EXECUTABLE_PATH: /usr/bin/google-chrome-stable`

5. Click "Create Web Service"
6. After the initial deployment, go to the service settings and add a custom Dockerfile to install Chrome and required dependencies

## Usage

### PDF Export

```
GET /export/pdf?url=https://example.com&filename=example.pdf
```

Parameters:
- `url`: The website URL to export (required)
- `filename`: Name of the download file (default: export.pdf)

### Image Export

```
GET /export/image?url=https://example.com&filename=example.png&format=png&fullPage=true
```

Parameters:
- `url`: The website URL to export (required)
- `filename`: Name of the download file (default: export.png)
- `format`: Image format, 'png' or 'jpeg' (default: png)
- `fullPage`: Whether to capture the full page, 'true' or 'false' (default: true)

## Cost Optimization

To keep costs down, this service:

1. Uses timeouts to prevent resource exhaustion
2. Closes browser instances after each request
3. Employs memory-efficient Puppeteer options
4. Doesn't store any files (direct download only)
5. Uses compression to reduce bandwidth
6. Can be configured to use the smallest viable instance on Render

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
``` 
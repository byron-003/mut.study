# LibreOffice Setup Guide for Word-to-PDF Conversion

## Quick Installation Guide

### Windows

**Option 1: Direct Download**
1. Visit https://www.libreoffice.org/download/download/
2. Download the Windows installer
3. Run the installer and follow the wizard
4. LibreOffice will be added to PATH automatically

**Option 2: Chocolatey (Recommended for Servers)**
```powershell
# Install Chocolatey if not already installed
# Visit: https://chocolatey.org/install

# Install LibreOffice
choco install libreoffice -y

# Verify installation
soffice --version
```

**Option 3: WinGet**
```powershell
winget install TheDocumentFoundation.LibreOffice
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt-get update

# Install LibreOffice
sudo apt-get install -y libreoffice

# Verify installation
soffice --version
```

### Linux (CentOS/RHEL/Fedora)

```bash
# Install LibreOffice
sudo yum install -y libreoffice

# Or for newer versions:
sudo dnf install -y libreoffice

# Verify installation
soffice --version
```

### macOS

**Option 1: Homebrew**
```bash
# Install LibreOffice
brew install --cask libreoffice

# Verify installation
/Applications/LibreOffice.app/Contents/MacOS/soffice --version
```

**Option 2: Direct Download**
1. Visit https://www.libreoffice.org/download/download/
2. Download the macOS .dmg file
3. Open and drag to Applications folder

### Docker

If running the application in Docker, add to your Dockerfile:

```dockerfile
# For Debian/Ubuntu base images
RUN apt-get update && \
    apt-get install -y libreoffice && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# For Alpine base images (smaller)
RUN apk add --no-cache libreoffice
```

## Verification

Test that LibreOffice is properly installed and accessible:

```bash
# Check if soffice is in PATH
which soffice    # Linux/macOS
where soffice    # Windows

# Check version
soffice --version

# Test conversion
echo "Test" > test.txt
soffice --headless --convert-to pdf test.txt --outdir ./
ls test.pdf  # Should exist
```

## Configuration for Node.js

The system will automatically detect LibreOffice if it's in the system PATH. No additional configuration needed.

To verify within your Node.js application:

```javascript
import { checkLibreOfficeAvailability } from './services/documentConverter.js';

// Check if LibreOffice is available
const isAvailable = await checkLibreOfficeAvailability();

if (isAvailable) {
    console.log('✅ LibreOffice is ready for document conversion');
} else {
    console.log('⚠️ LibreOffice not found. Will use fallback conversion method.');
}
```

## Troubleshooting

### "soffice: command not found"

**Cause:** LibreOffice is not in system PATH

**Solution (Linux/macOS):**
```bash
# Find LibreOffice installation
find / -name soffice 2>/dev/null

# Add to PATH (example for Ubuntu)
export PATH=$PATH:/usr/lib/libreoffice/program

# Make permanent by adding to ~/.bashrc or ~/.zshrc
echo 'export PATH=$PATH:/usr/lib/libreoffice/program' >> ~/.bashrc
source ~/.bashrc
```

**Solution (Windows):**
1. Find LibreOffice installation (usually `C:\Program Files\LibreOffice\program`)
2. Add to system PATH:
   - Right-click "This PC" → Properties
   - Advanced system settings → Environment Variables
   - Edit PATH variable
   - Add: `C:\Program Files\LibreOffice\program`

### Permission Issues (Linux)

If running as a service user (e.g., `www-data`, `node`):

```bash
# Ensure the service user can access LibreOffice
sudo chmod +x /usr/lib/libreoffice/program/soffice
sudo chmod +x /usr/lib/libreoffice/program/soffice.bin
```

### Headless Mode Issues

LibreOffice runs in headless mode (no GUI). If you encounter issues:

```bash
# Test headless mode manually
soffice --headless --convert-to pdf sample.docx --outdir ./

# If this fails, check system libraries
sudo apt-get install -y libreoffice-core libreoffice-common
```

## Server Deployment

### Render.com

Add to your `render.yaml` or build command:

```yaml
services:
  - type: web
    name: mut-study-hub-api
    env: node
    buildCommand: apt-get update && apt-get install -y libreoffice && npm install
    startCommand: npm start
```

### Heroku

Add buildpack to `app.json`:

```json
{
  "buildpacks": [
    {
      "url": "https://github.com/heroku/heroku-buildpack-apt"
    },
    {
      "url": "heroku/nodejs"
    }
  ]
}
```

Create `Aptfile` in project root:

```
libreoffice
```

### AWS EC2 / DigitalOcean

```bash
# SSH into server
ssh user@your-server

# Install LibreOffice
sudo apt-get update
sudo apt-get install -y libreoffice

# Restart your Node.js application
pm2 restart all
```

### Kubernetes

Add init container or sidecar:

```yaml
initContainers:
  - name: install-libreoffice
    image: ubuntu:22.04
    command:
      - /bin/bash
      - -c
      - |
        apt-get update
        apt-get install -y libreoffice
```

## Performance Considerations

### Resource Requirements

- **Memory:** ~100-200MB per conversion
- **CPU:** Moderate usage during conversion
- **Disk:** Temporary files in `/tmp` (auto-cleaned)

### Optimization Tips

1. **Concurrent Conversions:** Limit to 2-3 simultaneous conversions
2. **Timeout:** Set reasonable timeout (30 seconds recommended)
3. **Cleanup:** Ensure `/tmp` directory is regularly cleaned
4. **Monitoring:** Watch memory usage under load

## Alternative: Skip LibreOffice

If you can't install LibreOffice, the system will automatically use the Mammoth + PDF-lib fallback method. This works without any external dependencies but provides basic text-only conversion.

To skip LibreOffice entirely:
- Don't install LibreOffice
- The system will detect its absence
- All conversions will use Mammoth fallback
- Users will still be able to upload Word documents

## Testing

After installation, test the conversion system:

```bash
# Navigate to server directory
cd server

# Run test (if you have a test file)
node -e "
import('./services/documentConverter.js').then(async (module) => {
  const available = await module.checkLibreOfficeAvailability();
  console.log('LibreOffice available:', available);
});
"
```

## Support

- LibreOffice Documentation: https://www.libreoffice.org/get-help/documentation/
- Community Forum: https://ask.libreoffice.org/
- Installation Issues: Check server logs for detailed error messages

---

**Need Help?** Check the main documentation at `WORD_TO_PDF_CONVERSION.md`

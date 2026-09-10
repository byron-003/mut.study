# MUT Study Hub - Production Deployment Guide

This guide explains how to deploy the MUT Study Hub with the client served from the same server (localhost:5000 in production).

## Architecture

- **Server**: Express.js API + Static File Server (Port 5000)
- **Client**: React SPA served as static files from `/client/dist`
- **Admin**: Separate deployment (to be hosted independently)

## Development vs Production

### Development Mode
- Client runs on `localhost:5173` (Vite dev server)
- Server runs on `localhost:5000` (Express API)
- Admin runs on `localhost:5174` (Vite dev server)

### Production Mode
- Server runs on `localhost:5000`
- Client served from `localhost:5000` (same as server)
- Admin hosted separately

---

## Production Deployment Steps

### 1. Build the Client

Navigate to the client directory and build the production bundle:

```powershell
cd client
npm run build
```

This will create a `dist` folder in the client directory with optimized production files.

**Output**: `client/dist/` folder with:
- `index.html`
- `assets/` (JS, CSS, images)

### 2. Configure Environment Variables

#### Server Environment (`.env`)

Update `server/.env` for production:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_secure_jwt_secret_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@yourdomain.com
CLIENT_URL=http://your-domain.com
ADMIN_URL=http://admin.yourdomain.com
```

**Important**: 
- Set `NODE_ENV=production` to enable static file serving
- Use secure values for `JWT_SECRET`
- Update URLs to match your domain

#### Client Environment (`.env.production`)

Already configured! The client will use `/api` (relative path) in production.

```env
VITE_API_URL=/api
```

### 3. Start the Production Server

Navigate to the server directory and start:

```powershell
cd server
npm start
```

Or with Node directly:

```powershell
node server.js
```

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:5000
```

The server will:
- Serve API routes at `/api/*`
- Serve client static files for all other routes
- Handle Socket.IO connections

---

## Testing Production Build Locally

Before deploying to a real server, test locally:

1. **Build the client**:
   ```powershell
   cd client
   npm run build
   ```

2. **Update server .env**:
   ```env
   NODE_ENV=production
   ```

3. **Start the server**:
   ```powershell
   cd server
   npm start
   ```

4. **Test**:
   - Open `http://localhost:5000`
   - Should see the MUT Study Hub homepage
   - Test login, navigation, file uploads, etc.

5. **Check API**:
   - `http://localhost:5000/api/health` should return JSON
   - All API routes should work

---

## How It Works

### Server Configuration (`server.js`)

```javascript
// In production, serve static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// API routes (always available)
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
// ... other routes

// In production, serve client for all non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}
```

### Request Flow

1. **API Requests** (`/api/*`):
   - Handled by Express routes
   - Returns JSON responses

2. **Static Assets** (`/assets/*`):
   - Served from `client/dist/assets/`
   - Cached by browser

3. **All Other Routes** (`/*`):
   - Returns `client/dist/index.html`
   - React Router handles client-side routing

---

## Deployment to Cloud Server

### Option 1: Traditional VPS (Ubuntu/Linux)

1. **Install dependencies**:
   ```bash
   # Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # PostgreSQL (if not using managed DB)
   sudo apt-get install postgresql
   ```

2. **Clone repository**:
   ```bash
   git clone <your-repo>
   cd mut-study-hub
   ```

3. **Install dependencies**:
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

4. **Build client**:
   ```bash
   cd client
   npm run build
   ```

5. **Configure environment**:
   ```bash
   cd ../server
   nano .env  # Update with production values
   ```

6. **Run with PM2** (recommended):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "mut-study-hub"
   pm2 save
   pm2 startup
   ```

7. **Setup Nginx reverse proxy** (optional but recommended):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Option 2: Heroku

1. **Create Heroku app**:
   ```bash
   heroku create mut-study-hub
   ```

2. **Add buildpacks**:
   ```bash
   heroku buildpacks:add heroku/nodejs
   ```

3. **Add Procfile** (root directory):
   ```
   web: cd server && npm start
   ```

4. **Add heroku-postbuild script** to root `package.json`:
   ```json
   {
     "scripts": {
       "heroku-postbuild": "cd client && npm install && npm run build"
     }
   }
   ```

5. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret
   # ... other vars
   ```

6. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 3: Docker

1. **Create Dockerfile** (root directory):
   ```dockerfile
   FROM node:20-alpine

   WORKDIR /app

   # Copy package files
   COPY client/package*.json ./client/
   COPY server/package*.json ./server/

   # Install dependencies
   RUN cd client && npm install
   RUN cd server && npm install

   # Copy source code
   COPY client ./client
   COPY server ./server

   # Build client
   RUN cd client && npm run build

   # Expose port
   EXPOSE 5000

   # Start server
   WORKDIR /app/server
   CMD ["node", "server.js"]
   ```

2. **Build image**:
   ```bash
   docker build -t mut-study-hub .
   ```

3. **Run container**:
   ```bash
   docker run -p 5000:5000 --env-file server/.env mut-study-hub
   ```

---

## Troubleshooting

### Issue: 404 on page refresh

**Cause**: Server not serving index.html for client routes

**Solution**: Ensure `NODE_ENV=production` and server.js has the catch-all route:
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});
```

### Issue: API calls fail

**Cause**: Client trying to call wrong API URL

**Solution**: 
1. Check `.env.production` has `VITE_API_URL=/api`
2. Rebuild client: `npm run build`

### Issue: Static files not loading

**Cause**: Vite base path incorrect

**Solution**: Check `vite.config.js` has `base: '/'`

### Issue: Socket.IO not connecting

**Cause**: WebSocket upgrade not handled

**Solution**: Ensure Socket.IO is initialized correctly and proxy configured:
```javascript
// vite.config.js
'/socket.io': {
  target: 'http://localhost:5000',
  ws: true,
}
```

---

## Performance Optimization

### 1. Enable Gzip Compression

```javascript
import compression from 'compression';
app.use(compression());
```

### 2. Set Cache Headers

```javascript
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(clientDistPath, {
    maxAge: '1y',
    etag: false
  }));
}
```

### 3. Use CDN for Static Assets

Upload `dist/assets/` to a CDN and update `vite.config.js`:
```javascript
build: {
  base: 'https://cdn.yourdomain.com/'
}
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "MUT Study Hub API is running",
  "database": { "connected": true },
  "websocket": { "connected": true, "activeConnections": 5 }
}
```

### Logs

**Development**: Console logs

**Production with PM2**:
```bash
pm2 logs mut-study-hub
```

---

## Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Enable HTTPS with SSL certificate
- [ ] Set secure CORS origins (no `*`)
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting on API routes
- [ ] Keep dependencies updated (`npm audit`)
- [ ] Use helmet.js for security headers
- [ ] Enable database connection pooling
- [ ] Setup firewall rules
- [ ] Regular database backups

---

## Admin Panel Deployment

The admin panel should be deployed separately. Follow these steps:

1. **Build admin**:
   ```powershell
   cd admin
   npm run build
   ```

2. **Deploy to separate hosting**:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Separate subdomain with Nginx

3. **Update server CORS**:
   ```env
   ADMIN_URL=https://admin.yourdomain.com
   ```

---

## Support

For issues or questions:
- Check logs: `pm2 logs` or console
- Review this guide
- Check environment variables
- Test health endpoint: `/api/health`

---

**Last Updated**: 2026-09-09
**Version**: 1.0

# Deployment Guide - MUT Study Hub

This guide covers deploying the MUT Study Hub application to production.

## Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] JWT_SECRET changed from default
- [ ] Cloudinary account active
- [ ] Domain name registered (optional)

## Deployment Options

### Option 1: Traditional VPS/Server (Recommended for Full Control)

#### Requirements
- Ubuntu 20.04+ or Windows Server
- Node.js 18+
- PostgreSQL 14+
- Nginx (reverse proxy)
- SSL Certificate (Let's Encrypt)

#### Steps

1. **Setup Server**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Nginx
sudo apt install nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

2. **Configure PostgreSQL**
```bash
# Create database and user
sudo -u postgres psql
CREATE DATABASE mut_study_hub;
CREATE USER mut_admin WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mut_study_hub TO mut_admin;
```

3. **Deploy Application**
```bash
# Clone or upload your code
git clone <your-repo-url>
cd mut-study-hub

# Install backend dependencies
cd server
npm install --production
cp .env.example .env
# Edit .env with production credentials
nano .env

# Setup and seed database
npm run db:setup
npm run db:seed

# Install frontend dependencies
cd ../client
npm install
npm run build
```

4. **Configure PM2**
```bash
cd ../server
pm2 start server.js --name mut-api
pm2 startup
pm2 save
```

5. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/mut-study-hub
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/mut-study-hub/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/mut-study-hub /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

6. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Heroku (Backend) + Vercel (Frontend)

#### Backend on Heroku

1. **Create Heroku App**
```bash
# Install Heroku CLI
# Then login
heroku login

# Create app
heroku create mut-study-hub-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
heroku config:set NODE_ENV=production
```

2. **Create Procfile** in server directory:
```
web: node server.js
```

3. **Deploy**
```bash
cd server
git init
heroku git:remote -a mut-study-hub-api
git add .
git commit -m "Initial deploy"
git push heroku main

# Run database setup
heroku run npm run db:setup
heroku run npm run db:seed
```

#### Frontend on Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Configure Environment**
Create `client/.env.production`:
```
VITE_API_URL=https://mut-study-hub-api.herokuapp.com/api
```

3. **Deploy**
```bash
cd client
vercel --prod
```

### Option 3: Railway (All-in-One)

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Deploy Backend**
```bash
cd server
railway login
railway init
railway up

# Add PostgreSQL
railway add postgresql

# Set environment variables in Railway dashboard
```

3. **Deploy Frontend**
```bash
cd ../client
railway init
railway up
```

## Environment Variables for Production

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=very_long_random_secure_string
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mut_study_hub_docs
MAX_FILE_SIZE=10485760
CLIENT_URL=https://your-frontend-domain.com
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend-api.com/api
```

## Post-Deployment

### 1. Verify Deployment
- [ ] Homepage loads correctly
- [ ] Search functionality works
- [ ] User registration works
- [ ] User login works
- [ ] File upload works
- [ ] Cloudinary integration works
- [ ] Database queries work
- [ ] All API endpoints respond

### 2. Monitor Application
```bash
# Check PM2 logs (VPS deployment)
pm2 logs mut-api

# Check Heroku logs
heroku logs --tail

# Setup monitoring
pm2 install pm2-logrotate
```

### 3. Setup Backups

#### PostgreSQL Backup Script
```bash
#!/bin/bash
pg_dump -U mut_admin mut_study_hub > backup_$(date +%Y%m%d_%H%M%S).sql
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

### 4. Security Checklist
- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Rate limiting enabled
- [ ] SQL injection protection (using parameterized queries ✓)
- [ ] File upload validation active
- [ ] Environment variables secure
- [ ] Database backups automated

## Performance Optimization

### 1. Enable Gzip Compression (Nginx)
```nginx
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. Setup CDN (Optional)
- Use Cloudinary's CDN for files (already configured ✓)
- Consider CloudFlare for static assets

### 3. Database Optimization
```sql
-- Add indexes (already included in schema ✓)
-- Monitor slow queries
-- Regular VACUUM
```

### 4. Caching (Optional)
- Redis for session management
- Cache search results
- Cache static data

## Monitoring and Maintenance

### Tools
- **PM2**: Process monitoring
- **New Relic**: Application performance
- **Sentry**: Error tracking
- **UptimeRobot**: Uptime monitoring

### Regular Tasks
- [ ] Weekly: Check error logs
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review database performance
- [ ] Quarterly: Security audit

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql
\conninfo
```

### Application Not Starting
```bash
# Check PM2 status
pm2 status
pm2 logs mut-api --lines 100

# Check Heroku status
heroku ps
heroku logs --tail
```

### Cloudinary Upload Fails
- Verify API credentials
- Check file size limits
- Review Cloudinary quota

## Rollback Procedure

```bash
# PM2 deployment
pm2 stop mut-api
git checkout <previous-commit>
npm install
pm2 restart mut-api

# Restore database backup
psql -U mut_admin mut_study_hub < backup_file.sql
```

## Scaling

### Horizontal Scaling
- Load balancer (Nginx/HAProxy)
- Multiple application instances
- Database replication

### Vertical Scaling
- Increase server resources
- Upgrade database plan
- Optimize queries

## Support and Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)

## License

ISC

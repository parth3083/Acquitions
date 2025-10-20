# 🌩️ Cloud Deployment Guide

This guide covers deploying the Dockerized Acquisitions application to various cloud platforms with Neon Database.

## General Architecture

```
┌─────────────────────────────────┐
│    Cloud Platform               │
│  ┌───────────────────────────┐  │
│  │   Docker Container        │  │
│  │   (Your App)              │  │
│  │                           │  │
│  │   Environment Variables   │  │
│  │   - DATABASE_URL          │  │
│  │   - JWT_SECRET            │  │
│  │   - Other configs         │  │
│  └──────────┬────────────────┘  │
│             │                   │
└─────────────┼───────────────────┘
              │
              │ HTTPS/SSL
              ▼
   ┌──────────────────────┐
   │  Neon Cloud Database │
   │  (Production Branch) │
   └──────────────────────┘
```

---

## Platform-Specific Guides

### 1. Docker Hub + Any Cloud VM (AWS EC2, Azure VM, GCP Compute)

#### Step 1: Build and Push to Docker Hub

```bash
# Build the production image
docker build -t yourusername/acquisitions:latest -f Dockerfile .

# Push to Docker Hub
docker login
docker push yourusername/acquisitions:latest
```

#### Step 2: Deploy on Cloud VM

SSH into your cloud VM and run:

```bash
# Pull the image
docker pull yourusername/acquisitions:latest

# Create environment file
cat > .env.production <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgres://user:password@ep-xxxxx.aws.neon.tech/dbname?sslmode=require
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
COOKIE_SECRET=your_secure_cookie_secret_here
ARCJET_KEY=your_arcjet_key
LOG_LEVEL=info
EOF

# Run the container
docker run -d \
  --name acquisitions-app \
  -p 80:3000 \
  --env-file .env.production \
  --restart always \
  yourusername/acquisitions:latest

# Check logs
docker logs -f acquisitions-app
```

#### Step 3: Setup Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/acquisitions
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/acquisitions /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 2. AWS Elastic Container Service (ECS) with Fargate

#### Step 1: Push to Amazon ECR

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Create repository
aws ecr create-repository --repository-name acquisitions --region us-east-1

# Build and tag
docker build -t acquisitions:latest .
docker tag acquisitions:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/acquisitions:latest

# Push
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/acquisitions:latest
```

#### Step 2: Create Task Definition

Create `task-definition.json`:

```json
{
  "family": "acquisitions",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "acquisitions-app",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/acquisitions:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3000"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:acquisitions/DATABASE_URL"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:acquisitions/JWT_SECRET"
        },
        {
          "name": "COOKIE_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789:secret:acquisitions/COOKIE_SECRET"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/acquisitions",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Step 3: Store Secrets in AWS Secrets Manager

```bash
# Store DATABASE_URL
aws secretsmanager create-secret \
  --name acquisitions/DATABASE_URL \
  --secret-string "postgres://user:password@ep-xxxxx.aws.neon.tech/dbname?sslmode=require" \
  --region us-east-1

# Store JWT_SECRET
aws secretsmanager create-secret \
  --name acquisitions/JWT_SECRET \
  --secret-string "your_secure_jwt_secret" \
  --region us-east-1

# Store COOKIE_SECRET
aws secretsmanager create-secret \
  --name acquisitions/COOKIE_SECRET \
  --secret-string "your_secure_cookie_secret" \
  --region us-east-1
```

#### Step 4: Deploy to ECS

```bash
# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster your-cluster \
  --service-name acquisitions \
  --task-definition acquisitions \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

---

### 3. Google Cloud Run

#### Step 1: Build and Push to Google Container Registry

```bash
# Authenticate
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/your-project-id/acquisitions:latest .
docker push gcr.io/your-project-id/acquisitions:latest
```

#### Step 2: Deploy to Cloud Run

```bash
# Deploy
gcloud run deploy acquisitions \
  --image gcr.io/your-project-id/acquisitions:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,PORT=3000 \
  --set-secrets DATABASE_URL=acquisitions-database-url:latest,JWT_SECRET=acquisitions-jwt-secret:latest,COOKIE_SECRET=acquisitions-cookie-secret:latest

# Get the service URL
gcloud run services describe acquisitions --region us-central1 --format 'value(status.url)'
```

**Store secrets in Google Secret Manager first:**

```bash
# Create secrets
echo -n "postgres://user:password@ep-xxxxx.aws.neon.tech/dbname?sslmode=require" | \
  gcloud secrets create acquisitions-database-url --data-file=-

echo -n "your_jwt_secret" | \
  gcloud secrets create acquisitions-jwt-secret --data-file=-

echo -n "your_cookie_secret" | \
  gcloud secrets create acquisitions-cookie-secret --data-file=-
```

---

### 4. Azure Container Instances

#### Step 1: Push to Azure Container Registry

```bash
# Login to Azure
az login

# Create resource group
az group create --name acquisitions-rg --location eastus

# Create ACR
az acr create --resource-group acquisitions-rg --name acquisitionsacr --sku Basic

# Login to ACR
az acr login --name acquisitionsacr

# Build and push
docker build -t acquisitionsacr.azurecr.io/acquisitions:latest .
docker push acquisitionsacr.azurecr.io/acquisitions:latest
```

#### Step 2: Deploy to Container Instances

```bash
# Create container with environment variables
az container create \
  --resource-group acquisitions-rg \
  --name acquisitions-app \
  --image acquisitionsacr.azurecr.io/acquisitions:latest \
  --cpu 1 \
  --memory 1 \
  --registry-login-server acquisitionsacr.azurecr.io \
  --registry-username $(az acr credential show --name acquisitionsacr --query username -o tsv) \
  --registry-password $(az acr credential show --name acquisitionsacr --query passwords[0].value -o tsv) \
  --ip-address Public \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000 \
  --secure-environment-variables \
    DATABASE_URL="postgres://user:password@ep-xxxxx.aws.neon.tech/dbname?sslmode=require" \
    JWT_SECRET="your_jwt_secret" \
    COOKIE_SECRET="your_cookie_secret"

# Get the IP
az container show --resource-group acquisitions-rg --name acquisitions-app --query ipAddress.ip -o tsv
```

---

### 5. Heroku

#### Step 1: Create Heroku App

```bash
# Login
heroku login

# Create app
heroku create acquisitions-app

# Set buildpack for Docker
heroku stack:set container
```

#### Step 2: Create `heroku.yml`

Create this file in your project root:

```yaml
build:
  docker:
    web: Dockerfile
run:
  web: node src/index.js
```

#### Step 3: Configure Environment Variables

```bash
heroku config:set NODE_ENV=production -a acquisitions-app
heroku config:set DATABASE_URL="postgres://user:password@ep-xxxxx.aws.neon.tech/dbname?sslmode=require" -a acquisitions-app
heroku config:set JWT_SECRET="your_jwt_secret" -a acquisitions-app
heroku config:set COOKIE_SECRET="your_cookie_secret" -a acquisitions-app
heroku config:set ARCJET_KEY="your_arcjet_key" -a acquisitions-app
```

#### Step 4: Deploy

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

---

### 6. DigitalOcean App Platform

#### Step 1: Push to DigitalOcean Container Registry

```bash
# Install doctl and authenticate
doctl auth init

# Create registry
doctl registry create acquisitions-registry

# Login
doctl registry login

# Build and push
docker build -t registry.digitalocean.com/acquisitions-registry/acquisitions:latest .
docker push registry.digitalocean.com/acquisitions-registry/acquisitions:latest
```

#### Step 2: Create App via CLI

Create `app.yaml`:

```yaml
name: acquisitions
services:
  - name: web
    image:
      registry_type: DOCR
      repository: acquisitions
      tag: latest
    http_port: 3000
    instance_count: 1
    instance_size_slug: basic-xxs
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      - key: DATABASE_URL
        value: postgres://user:password@ep-xxxxx.aws.neon.tech/dbname?sslmode=require
        type: SECRET
      - key: JWT_SECRET
        value: your_jwt_secret
        type: SECRET
      - key: COOKIE_SECRET
        value: your_cookie_secret
        type: SECRET
    health_check:
      http_path: /health
```

Deploy:

```bash
doctl apps create --spec app.yaml
```

---

## Best Practices for All Platforms

### 1. Environment Variables Management

✅ **DO:**
- Use platform-native secret management (AWS Secrets Manager, GCP Secret Manager, etc.)
- Rotate secrets regularly
- Use different secrets for each environment
- Never commit secrets to git

❌ **DON'T:**
- Hardcode secrets in Dockerfiles
- Use the same secrets in dev and prod
- Store secrets in plain text files on servers

### 2. Database Connection

✅ **Always use:**
- SSL/TLS connections (`?sslmode=require`)
- Connection pooling (built into Neon serverless driver)
- Proper error handling and retries

### 3. Health Checks

Ensure your platform health check points to:
```
http://your-app/health
```

Expected response:
```json
{"status":"OK","timestamp":"2025-10-05T...","uptime":123.456}
```

### 4. Logging

- Use platform logging services (CloudWatch, Stackdriver, etc.)
- Set `LOG_LEVEL=info` in production
- Monitor error logs regularly

### 5. Scaling

**Horizontal Scaling:**
- Most platforms support auto-scaling based on CPU/memory
- Neon handles database scaling automatically
- No session state in containers (use JWT)

**Vertical Scaling:**
- Start small (512MB-1GB)
- Monitor and adjust based on usage

### 6. Database Migrations

**Before deploying new version:**
```bash
# Run migrations as a one-off task
docker run --rm \
  -e DATABASE_URL="$PROD_DATABASE_URL" \
  yourimage:latest \
  npm run db:migrate
```

Or use platform-specific one-off containers.

---

## Monitoring and Maintenance

### Application Monitoring

1. **Health Endpoint**: http://your-app/health
2. **Platform Metrics**: CPU, Memory, Request count
3. **Application Logs**: Check for errors and performance issues

### Database Monitoring

1. **Neon Console**: https://console.neon.tech
   - Monitor queries
   - Check connection counts
   - Review storage usage

2. **Connection Pooling**: Built into `@neondatabase/serverless`

### Alerting

Set up alerts for:
- High error rates
- Increased response times
- Database connection failures
- High memory/CPU usage

---

## Troubleshooting

### "Cannot connect to database"

1. Check DATABASE_URL format includes `?sslmode=require`
2. Verify Neon database is active in console
3. Check network/firewall rules allow outbound HTTPS

### "Memory issues"

1. Increase container memory allocation
2. Check for memory leaks in logs
3. Review Node.js heap usage

### "Slow responses"

1. Check Neon query performance in console
2. Add database indexes if needed
3. Enable query caching if applicable

---

## Cost Optimization

### Neon Database
- **Free Tier**: Great for small apps
- **Scale to Zero**: Automatically pauses after inactivity
- **Branching**: Use for staging/testing without extra cost

### Compute
- **Start small**: 0.5 CPU, 512MB RAM
- **Auto-scaling**: Only pay for what you use
- **Reserved instances**: For predictable workloads (AWS, Azure)

---

## Security Checklist

- [ ] All secrets stored in platform secret manager
- [ ] HTTPS/SSL enabled for all connections
- [ ] Database requires SSL (`?sslmode=require`)
- [ ] Different secrets for dev/staging/prod
- [ ] Regular security updates for dependencies
- [ ] Rate limiting enabled (via ArcJet)
- [ ] CORS configured properly
- [ ] Helmet.js security headers enabled

---

## Support

- **Neon Support**: https://neon.tech/docs/introduction/support
- **Platform Documentation**: Refer to specific cloud provider docs
- **Application Issues**: Check logs first, then open GitHub issue

---

## License

See project LICENSE file.

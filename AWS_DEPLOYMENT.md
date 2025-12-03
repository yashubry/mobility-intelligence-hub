# AWS Deployment Guide for NL4DV Chart Generation API

This guide provides step-by-step instructions for deploying the NL4DV Chart Generation API to AWS using Elastic Beanstalk or EC2.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Configuration Overview](#configuration-overview)
3. [AWS Elastic Beanstalk Deployment](#aws-elastic-beanstalk-deployment)
4. [AWS EC2 Deployment](#aws-ec2-deployment)
5. [Environment Variables](#environment-variables)
6. [Testing the Deployment](#testing-the-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- AWS Account with appropriate permissions
- AWS CLI installed and configured
- EB CLI (for Elastic Beanstalk deployment)
- Git

### Install AWS CLI
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Windows
# Download and run the AWS CLI MSI installer from:
# https://awscli.amazonaws.com/AWSCLIV2.msi
```

### Configure AWS CLI
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter your default output format (e.g., json)
```

### Install EB CLI (for Elastic Beanstalk)
```bash
pip install awsebcli
```

---

## Configuration Overview

The application supports **3 processing modes**:

### 1. semantic-parsing (Default)
- Uses traditional NLP with dependency parsing
- **No API key required**
- Requires spaCy model (`en_core_web_sm`)
- Best for: Deterministic, rule-based processing

### 2. gpt
- Uses OpenAI's GPT-4o model
- **Requires: OPENAI_API_KEY**
- Best for: OpenAI-specific implementations

### 3. language-model
- Uses LiteLLM for multi-provider support
- **Requires: API key for chosen provider**
- Supports: OpenAI, Anthropic Claude, Azure, and 100+ other providers
- Best for: Flexible LLM provider selection

---

## AWS Elastic Beanstalk Deployment

### Step 1: Initialize Your Application

Navigate to your project directory:
```bash
cd /Users/rohitdayanand/Projects/code_for_good
```

Initialize Elastic Beanstalk:
```bash
eb init -p python-3.11 nl4dv-chart-api --region us-east-1
```

You'll be prompted:
- Select a default region: Choose your preferred region (e.g., `us-east-1`)
- Application name: `nl4dv-chart-api` (or your preference)
- Do you want to set up SSH: `y` (recommended)

### Step 2: Create Environment

Create a production environment:
```bash
eb create nl4dv-production
```

This will:
- Create an EC2 instance
- Set up load balancer
- Configure auto-scaling
- Deploy your application

### Step 3: Set Environment Variables

#### For semantic-parsing mode (default, no API key needed):
```bash
eb setenv NL4DV_PROCESSING_MODE=semantic-parsing \
  NL4DV_DEPENDENCY_PARSER=spacy \
  NL4DV_VERBOSE=false
```

#### For GPT mode (requires OpenAI API key):
```bash
eb setenv NL4DV_PROCESSING_MODE=gpt \
  OPENAI_API_KEY=sk-your-openai-key-here \
  NL4DV_VERBOSE=false
```

#### For language-model mode with Claude:
```bash
eb setenv NL4DV_PROCESSING_MODE=language-model \
  LM_MODEL=claude-3-5-sonnet-20241022 \
  ANTHROPIC_API_KEY=sk-ant-your-key-here \
  NL4DV_VERBOSE=false
```

#### For language-model mode with GPT:
```bash
eb setenv NL4DV_PROCESSING_MODE=language-model \
  LM_MODEL=gpt-4o \
  OPENAI_API_KEY=sk-your-openai-key-here \
  NL4DV_VERBOSE=false
```

### Step 4: Deploy

Deploy your application:
```bash
eb deploy
```

### Step 5: Open Application

Open your application in a browser:
```bash
eb open
```

### Step 6: View Logs (Optional)

Monitor application logs:
```bash
eb logs
```

Follow logs in real-time:
```bash
eb logs --stream
```

---

## AWS EC2 Deployment

### Step 1: Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS** AMI
3. Select instance type: **t3.medium** or larger (recommended for NLP workloads)
4. Configure Security Group:
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
5. Launch instance and download key pair

### Step 2: Connect to Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install system dependencies
sudo apt install -y gcc g++ python3-dev

# Install nginx
sudo apt install -y nginx
```

### Step 4: Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/your-username/code_for_good.git
cd code_for_good

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

# Download NLTK data
python -c "import nltk; nltk.download('punkt')"
```

### Step 5: Configure Environment Variables

Create a `.env` file:
```bash
nano .env
```

Add your configuration:
```bash
# For semantic-parsing mode (default)
NL4DV_PROCESSING_MODE=semantic-parsing
NL4DV_DEPENDENCY_PARSER=spacy
NL4DV_VERBOSE=false
PORT=8000

# OR for GPT mode
# NL4DV_PROCESSING_MODE=gpt
# OPENAI_API_KEY=sk-your-key-here
# NL4DV_VERBOSE=false
# PORT=8000

# OR for language-model mode
# NL4DV_PROCESSING_MODE=language-model
# LM_MODEL=gpt-4o
# OPENAI_API_KEY=sk-your-key-here
# NL4DV_VERBOSE=false
# PORT=8000
```

Load environment variables:
```bash
export $(cat .env | xargs)
```

### Step 6: Install and Configure Gunicorn

```bash
pip install gunicorn
```

Create systemd service file:
```bash
sudo nano /etc/systemd/system/nl4dv.service
```

Add the following content:
```ini
[Unit]
Description=NL4DV Chart Generation API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/code_for_good
Environment="PATH=/home/ubuntu/code_for_good/venv/bin"
EnvironmentFile=/home/ubuntu/code_for_good/.env
ExecStart=/home/ubuntu/code_for_good/venv/bin/gunicorn --workers 4 --bind 0.0.0.0:8000 main:app

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl enable nl4dv
sudo systemctl start nl4dv
sudo systemctl status nl4dv
```

### Step 7: Configure Nginx

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/nl4dv
```

Add the following:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 public IP

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nl4dv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: (Optional) Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Environment Variables

### Required Environment Variables by Processing Mode

| Variable | semantic-parsing | gpt | language-model |
|----------|------------------|-----|----------------|
| `NL4DV_PROCESSING_MODE` | ✓ | ✓ | ✓ |
| `NL4DV_DEPENDENCY_PARSER` | ✓ | ✗ | ✗ |
| `OPENAI_API_KEY` | ✗ | ✓ | ✓ (if using GPT) |
| `ANTHROPIC_API_KEY` | ✗ | ✗ | ✓ (if using Claude) |
| `LM_MODEL` | ✗ | ✗ | ✓ |
| `NL4DV_VERBOSE` | Optional | Optional | Optional |
| `PORT` | Optional | Optional | Optional |

### Environment Variable Descriptions

- **NL4DV_PROCESSING_MODE**: Processing mode (`semantic-parsing`, `gpt`, or `language-model`)
- **NL4DV_DEPENDENCY_PARSER**: Dependency parser to use (`spacy` or `corenlp-server`)
- **OPENAI_API_KEY**: OpenAI API key (for `gpt` or `language-model` with GPT models)
- **ANTHROPIC_API_KEY**: Anthropic API key (for `language-model` with Claude models)
- **LM_MODEL**: LiteLLM model identifier (e.g., `gpt-4o`, `claude-3-5-sonnet-20241022`)
- **NL4DV_VERBOSE**: Enable verbose logging (`true` or `false`, default: `false`)
- **PORT**: Port to run the application on (default: `8000`)

---

## Testing the Deployment

### 1. Check Application Health

```bash
curl http://your-domain.com/health
```

Expected response:
```json
{
  "status": "healthy"
}
```

### 2. Check Configuration

```bash
curl http://your-domain.com/config
```

Expected response:
```json
{
  "config": {
    "processing_mode": "semantic-parsing",
    "dependency_parser": "spacy",
    "lm_model": "gpt-4o",
    "verbose": false,
    "openai_api_key_set": false,
    "anthropic_api_key_set": false
  }
}
```

### 3. List Available Datasets

```bash
curl http://your-domain.com/datasets
```

Expected response:
```json
{
  "datasets": [
    {
      "name": "sales",
      "description": "Monthly sales data with revenue and units sold by region",
      "columns": ["month", "revenue", "units_sold", "region"],
      "rows": 6
    },
    ...
  ]
}
```

### 4. Test Chart Generation

```bash
curl -X POST http://your-domain.com/get_charts \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show revenue by month",
    "table_names": ["sales"]
  }'
```

Expected response:
```json
{
  "status": "SUCCESS",
  "query": "Show revenue by month",
  "dataset": "sales",
  "visList": [...],
  "attributeMap": {...},
  "taskMap": {...},
  "message": "Generated 1 visualization(s)"
}
```

### 5. Update Configuration Programmatically

```bash
curl -X POST http://your-domain.com/config \
  -H "Content-Type: application/json" \
  -d '{
    "processing_mode": "gpt",
    "openai_api_key": "sk-your-key-here"
  }'
```

---

## Troubleshooting

### Issue: "Module not found" errors

**Solution**: Ensure all dependencies are installed
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### Issue: "OPENAI_API_KEY environment variable is required"

**Solution**: Set the API key for your chosen processing mode
```bash
# Elastic Beanstalk
eb setenv OPENAI_API_KEY=sk-your-key-here

# EC2
echo "OPENAI_API_KEY=sk-your-key-here" >> .env
source .env
sudo systemctl restart nl4dv
```

### Issue: Application not starting on EC2

**Solution**: Check logs
```bash
sudo journalctl -u nl4dv -f
```

### Issue: Nginx 502 Bad Gateway

**Solution**: Ensure Gunicorn is running
```bash
sudo systemctl status nl4dv
sudo systemctl restart nl4dv
```

### Issue: spaCy model not found

**Solution**: Download the model
```bash
python -m spacy download en_core_web_sm
```

### Issue: High memory usage

**Solution**: For EC2, use a larger instance type (at least t3.medium). For Elastic Beanstalk:
```bash
eb scale 1 --instance-type t3.medium
```

---

## Cost Estimation

### Elastic Beanstalk (us-east-1)
- **t3.small** (2 vCPU, 2 GB RAM): ~$15/month
- **t3.medium** (2 vCPU, 4 GB RAM): ~$30/month (recommended)
- **t3.large** (2 vCPU, 8 GB RAM): ~$60/month

### EC2 (us-east-1)
- **t3.small**: ~$15/month
- **t3.medium**: ~$30/month (recommended)
- **t3.large**: ~$60/month

### Additional Costs
- **Elastic Load Balancer** (if using EB): ~$16/month
- **Data Transfer**: $0.09/GB (outbound)
- **API Usage** (if using GPT/Claude):
  - OpenAI GPT-4o: $2.50/1M input tokens, $10/1M output tokens
  - Anthropic Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for all sensitive configuration
3. **Enable HTTPS** using Let's Encrypt (free) or AWS Certificate Manager
4. **Restrict security groups** to only necessary ports
5. **Use IAM roles** instead of hardcoded AWS credentials when possible
6. **Enable CloudWatch logging** for monitoring and debugging
7. **Regularly update** dependencies and security patches

---

## Useful Commands

### Elastic Beanstalk
```bash
eb status                    # Check environment status
eb logs                      # View logs
eb ssh                       # SSH into instance
eb terminate                 # Terminate environment
eb setenv VAR=value          # Set environment variable
```

### EC2
```bash
sudo systemctl status nl4dv  # Check service status
sudo systemctl restart nl4dv # Restart service
sudo journalctl -u nl4dv -f  # View logs
htop                         # Monitor resources
```

---

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review application logs
- Consult the main README.md
- Check nl4dv documentation: https://github.com/nl4dv/nl4dv

---

## License

This deployment guide is part of the NL4DV Chart Generation API project.

# NL4DV API Configuration Guide

## Quick Start: Setting API Keys Programmatically

### Method 1: Environment Variables (Recommended)

Set environment variables before starting the application:

```bash
# For semantic-parsing mode (no API key needed)
export NL4DV_PROCESSING_MODE=semantic-parsing
export NL4DV_DEPENDENCY_PARSER=spacy

# For GPT mode
export NL4DV_PROCESSING_MODE=gpt
export OPENAI_API_KEY=sk-your-openai-key-here

# For language-model mode with OpenAI
export NL4DV_PROCESSING_MODE=language-model
export LM_MODEL=gpt-4o
export OPENAI_API_KEY=sk-your-openai-key-here

# For language-model mode with Anthropic Claude
export NL4DV_PROCESSING_MODE=language-model
export LM_MODEL=claude-3-5-sonnet-20241022
export ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then start the application:
```bash
python main.py
```

### Method 2: Runtime Configuration via API

Start the application with default settings:
```bash
python main.py
```

Then update configuration via the `/config` endpoint:

```bash
# Update to use GPT mode
curl -X POST http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -d '{
    "processing_mode": "gpt",
    "openai_api_key": "sk-your-key-here"
  }'

# Update to use Claude
curl -X POST http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -d '{
    "processing_mode": "language-model",
    "lm_model": "claude-3-5-sonnet-20241022",
    "anthropic_api_key": "sk-ant-your-key-here"
  }'
```

---

## Processing Modes Explained

### 1. semantic-parsing (Default)
- **How it works**: Traditional NLP with dependency parsing (spaCy)
- **API key required**: No
- **Cost**: Free
- **Speed**: Fast
- **Best for**: Deterministic results, no API costs
- **Configuration**:
  ```bash
  export NL4DV_PROCESSING_MODE=semantic-parsing
  export NL4DV_DEPENDENCY_PARSER=spacy
  ```

### 2. gpt
- **How it works**: Uses OpenAI's GPT-4o model
- **API key required**: Yes (OpenAI)
- **Cost**: ~$2.50/1M input tokens, ~$10/1M output tokens
- **Speed**: Moderate (API call latency)
- **Best for**: High-quality results, OpenAI-specific features
- **Configuration**:
  ```bash
  export NL4DV_PROCESSING_MODE=gpt
  export OPENAI_API_KEY=sk-your-key-here
  ```

### 3. language-model
- **How it works**: Uses LiteLLM for multi-provider support
- **API key required**: Yes (depends on model)
- **Cost**: Varies by provider
- **Speed**: Moderate (API call latency)
- **Best for**: Flexibility, multiple LLM providers
- **Supported models**:
  - OpenAI: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`
  - Anthropic: `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`
  - Azure: `azure/gpt-4`
  - And 100+ other models via LiteLLM

**Configuration**:
```bash
export NL4DV_PROCESSING_MODE=language-model
export LM_MODEL=gpt-4o  # or claude-3-5-sonnet-20241022, etc.
export OPENAI_API_KEY=sk-your-key-here  # or ANTHROPIC_API_KEY
```

---

## API Endpoints

### GET /
Get API information and current configuration
```bash
curl http://localhost:8000/
```

### GET /config
Get current configuration (without exposing full API keys)
```bash
curl http://localhost:8000/config
```

Response:
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

### POST /config
Update configuration programmatically
```bash
curl -X POST http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -d '{
    "processing_mode": "gpt",
    "openai_api_key": "sk-your-key-here"
  }'
```

**Request Body**:
```json
{
  "processing_mode": "semantic-parsing" | "gpt" | "language-model",
  "dependency_parser": "spacy" | "corenlp-server",
  "openai_api_key": "sk-...",
  "anthropic_api_key": "sk-ant-...",
  "lm_model": "gpt-4o" | "claude-3-5-sonnet-20241022" | etc.
}
```

### GET /health
Health check endpoint
```bash
curl http://localhost:8000/health
```

### GET /datasets
List available datasets
```bash
curl http://localhost:8000/datasets
```

### POST /get_charts
Generate charts from natural language query
```bash
curl -X POST http://localhost:8000/get_charts \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show revenue by month",
    "table_names": ["sales"],
    "debug": false
  }'
```

**Request Body**:
```json
{
  "query": "string",              // Natural language query
  "table_names": ["string"],      // Dataset name(s)
  "debug": false,                 // Optional: include debug info
  "dialog": false,                // Optional: multi-turn conversation
  "dialog_id": "string",          // Optional: conversation ID
  "query_id": "string"            // Optional: query reference ID
}
```

---

## Environment Variables Reference

| Variable | Description | Default | Required For |
|----------|-------------|---------|--------------|
| `NL4DV_PROCESSING_MODE` | Processing mode | `semantic-parsing` | All modes |
| `NL4DV_DEPENDENCY_PARSER` | Dependency parser | `spacy` | semantic-parsing |
| `OPENAI_API_KEY` | OpenAI API key | - | gpt, language-model (GPT) |
| `ANTHROPIC_API_KEY` | Anthropic API key | - | language-model (Claude) |
| `LM_MODEL` | LiteLLM model ID | `gpt-4o` | language-model |
| `NL4DV_VERBOSE` | Verbose logging | `false` | Optional |
| `PORT` | Application port | `8000` | Optional |

---

## Example Usage Scenarios

### Scenario 1: Local Development (No API Key)
```bash
# Use semantic-parsing mode (free, no API key)
export NL4DV_PROCESSING_MODE=semantic-parsing
export NL4DV_DEPENDENCY_PARSER=spacy
python main.py
```

### Scenario 2: Production with OpenAI
```bash
# Use GPT mode with OpenAI
export NL4DV_PROCESSING_MODE=gpt
export OPENAI_API_KEY=sk-your-key-here
python main.py
```

### Scenario 3: Production with Claude
```bash
# Use language-model mode with Anthropic Claude
export NL4DV_PROCESSING_MODE=language-model
export LM_MODEL=claude-3-5-sonnet-20241022
export ANTHROPIC_API_KEY=sk-ant-your-key-here
python main.py
```

### Scenario 4: Switch Between Modes at Runtime
```bash
# Start with semantic-parsing
python main.py

# Switch to GPT mode via API
curl -X POST http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -d '{"processing_mode": "gpt", "openai_api_key": "sk-..."}'

# Switch to Claude
curl -X POST http://localhost:8000/config \
  -H "Content-Type: application/json" \
  -d '{"processing_mode": "language-model", "lm_model": "claude-3-5-sonnet-20241022", "anthropic_api_key": "sk-ant-..."}'
```

---

## Testing Configuration

Test your configuration with a simple query:

```bash
curl -X POST http://localhost:8000/get_charts \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show revenue by region",
    "table_names": ["sales"]
  }' | jq
```

Expected response:
```json
{
  "status": "SUCCESS",
  "query": "Show revenue by region",
  "dataset": "sales",
  "visList": [
    {
      "vlSpec": { ... },
      "score": 1.0,
      "visType": "barchart"
    }
  ],
  "attributeMap": { ... },
  "taskMap": { ... },
  "message": "Generated 1 visualization(s)"
}
```

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** or secrets management systems
3. **Rotate API keys regularly**
4. **Use minimal required permissions** for API keys
5. **Enable HTTPS** in production
6. **Monitor API usage** to detect anomalies
7. **Set rate limits** on your endpoints
8. **Use API key restrictions** (IP allowlists, referrer restrictions)

---

## Troubleshooting

### Issue: "OPENAI_API_KEY environment variable is required"
**Solution**: Set the API key for your processing mode
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### Issue: "ValueError: Unsupported processing mode"
**Solution**: Use a valid processing mode
```bash
export NL4DV_PROCESSING_MODE=semantic-parsing  # or gpt, or language-model
```

### Issue: spaCy model not found
**Solution**: Download the spaCy model
```bash
python -m spacy download en_core_web_sm
```

### Issue: Configuration changes not taking effect
**Solution**: Restart the application after changing environment variables
```bash
# Kill the process
pkill -f "python main.py"

# Restart
python main.py
```

### Issue: API returns empty visList
**Solution**:
- Check if the query is properly formed
- Try with `debug=true` to see more details
- Verify the dataset name is correct
- For LLM modes, check API key validity and quota

---

## Cost Optimization

### Use semantic-parsing for development
```bash
export NL4DV_PROCESSING_MODE=semantic-parsing
```
- **Cost**: $0
- **Good for**: Testing, development, low-budget deployments

### Use GPT-3.5-turbo for lower costs
```bash
export NL4DV_PROCESSING_MODE=language-model
export LM_MODEL=gpt-3.5-turbo
export OPENAI_API_KEY=sk-your-key-here
```
- **Cost**: ~10x cheaper than GPT-4
- **Good for**: Production with budget constraints

### Cache responses
Implement caching at the application level to reduce API calls

---

## Next Steps

1. Review the [AWS Deployment Guide](./AWS_DEPLOYMENT.md) for production deployment
2. Test different processing modes to find the best fit for your use case
3. Implement monitoring and logging
4. Set up CI/CD for automated deployments
5. Configure auto-scaling based on traffic patterns

---

## Support

For additional help:
- Main README: [README.md](./README.md)
- AWS Deployment: [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md)
- NL4DV Documentation: https://github.com/nl4dv/nl4dv

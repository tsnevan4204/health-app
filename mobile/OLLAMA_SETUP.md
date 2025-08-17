# Ollama AI Setup for Fitcentive

This guide explains how to set up Ollama with a lightweight AI model for analyzing your actual health data.

## Quick Setup

1. **Install Ollama** (one-time setup):
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama service**:
   ```bash
   ollama serve
   ```

3. **Download the health analysis model** (3B parameters, ~1.9GB):
   ```bash
   ollama pull llama3.2:3b
   ```

## How It Works

- **Real Data Analysis**: The AI analyzes your actual HRV, heart rate, exercise, and weight data
- **Specific Recommendations**: Gets personalized advice based on your exact metrics, not generic suggestions
- **Document Analysis**: Upload lab results or medical documents for AI interpretation
- **Privacy-First**: All analysis runs locally on your device, no cloud services
- **Lightweight**: Uses Llama 3.2 3B model for fast responses (1-3 seconds)

## Example AI Responses

**Without AI (generic)**: "Your HRV looks good. Try to exercise more."

**With AI (specific)**: "Your HRV of 52.3ms has declined 8% over the last 7 days from 56.8ms to 48.1ms. At age 22, this suggests increased stress or inadequate recovery. Consider reducing training intensity 20% this week and focus on 8+ hours sleep."

## Usage

Once setup is complete, the Ask AI feature will:
1. First try Ollama API for intelligent analysis
2. Fall back to data-driven analysis if Ollama isn't running
3. Always use your real health metrics and uploaded documents

## Troubleshooting

- **API not responding**: Make sure `ollama serve` is running in terminal
- **Model not found**: Run `ollama pull llama3.2:3b` to download
- **Slow responses**: The 3B model is optimized for speed vs. accuracy trade-off

The app works perfectly without Ollama - you'll just get rule-based analysis instead of AI-powered insights.
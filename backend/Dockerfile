FROM python:3.9-slim

WORKDIR /app

COPY . .

# Install system dependencies (Node.js, npm, and build essentials for Python packages)
RUN apt-get update && apt-get install -y \
    curl \
    build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Install Pyright using npm
RUN npm install -g pyright

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

# Use Gunicorn to serve the Flask app
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]

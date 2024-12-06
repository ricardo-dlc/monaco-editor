FROM python:3.9-slim

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

# Install system dependencies (Node.js, npm, and build essentials for Python packages)
RUN apt-get update && apt-get install -y \
    curl \
    build-essential && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Install Pyright using npm
RUN npm install -g pyright

EXPOSE 5000

CMD ["python", "app.py"]

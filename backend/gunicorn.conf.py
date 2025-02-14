# Number of worker processes
# workers = (CPU cores * 2)
workers = 4

# Bind to all IPs on port 5000
bind = "0.0.0.0:5000"

# Timeout for requests (in seconds)
timeout = 120

# Log level
loglevel = "info"

# Log file (optional)
# accesslog = "/var/log/gunicorn/access.log"
# errorlog = "/var/log/gunicorn/error.log"
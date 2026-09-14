FROM python:3.11-alpine

# Create a non-root user
RUN adduser -D runner

WORKDIR /app

# Copy the runner script
COPY runner.py /app/runner.py

# Ensure correct permissions
RUN chown -R runner:runner /app && chmod 500 /app/runner.py

# Switch to the non-root user
USER runner

# Run the script waiting for JSON payload on stdin
ENTRYPOINT ["python3", "/app/runner.py"]

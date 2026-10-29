FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application
COPY backend/ /app/

# Ensure full read/write permissions for Hugging Face non-root user (UID 1000)
RUN chmod -R 777 /app

# Collect static files
RUN python manage.py collectstatic --no-input

# Hugging Face Spaces uses port 7860
EXPOSE 7860

CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_data && gunicorn machinery_erp.wsgi:application --bind 0.0.0.0:${PORT:-7860}"]

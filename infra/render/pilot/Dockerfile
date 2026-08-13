FROM node:22.14-alpine AS frontend-build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
ARG VITE_API_URL=/api
ARG VITE_PILOT_MODE=true
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PILOT_MODE=$VITE_PILOT_MODE
RUN npm run build

FROM python:3.12-slim
WORKDIR /app/backend
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY backend /app/backend
COPY --from=frontend-build /app/dist /app/frontend-dist
CMD ["sh", "-c", "alembic upgrade head && python script/seed_pilot.py && uvicorn pilot_main:app --host 0.0.0.0 --port ${PORT:-10000} --proxy-headers --forwarded-allow-ips=*"]

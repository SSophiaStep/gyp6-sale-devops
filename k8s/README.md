# DVO-L3-7F2A91

## Gyp6.sale у Kubernetes (minikube)

Маніфести описують застосунок Gyp6.sale (B2B-маркетплейс меблів): фронтенд на Next.js, бекенд на NestJS, база даних PostgreSQL і Redis. Усі об'єкти створюються в namespace `gyp6-sale`.

### Склад каталогу k8s/

| Файл | Об'єкт | Призначення |
|---|---|---|
| `00-namespace.yaml` | Namespace `gyp6-sale` | окремий простір імен проєкту |
| `10-configmap.yaml` | ConfigMap `gyp6-config` | нечутлива конфігурація |
| `11-secret.yaml` | Secret `gyp6-secret` | чутливі параметри (тестові значення) |
| `12-frontend-proxy-configmap.yaml` | ConfigMap `frontend-proxy` | конфігурація nginx-sidecar у подах фронтенду |
| `20-postgres-pvc.yaml` | PersistentVolumeClaim `postgres-data` | сховище бази даних |
| `21-postgres-deployment.yaml` | Deployment `postgres` | PostgreSQL 18, 1 репліка |
| `22-postgres-service.yaml` | Service `postgres` | ClusterIP, порт 5432 |
| `30-redis-deployment.yaml` | Deployment `redis` | Redis з паролем, 1 репліка |
| `31-redis-service.yaml` | Service `redis` | ClusterIP, порт 6379 |
| `40-backend-deployment.yaml` | Deployment `backend` | NestJS API, 2 репліки |
| `41-backend-service.yaml` | Service `backend` | ClusterIP, порт 4200 |
| `50-frontend-deployment.yaml` | Deployment `frontend` | Next.js і nginx-sidecar, 2 репліки |
| `51-frontend-service.yaml` | Service `frontend` | NodePort 30080 |
| `60-ingress.yaml` | Ingress `gyp6` | хост `gyp6.local`: `/` на frontend, `/api/v1` на backend |

Префікси `00`–`60` задають порядок: namespace, конфігурація, база, застосунок, Ingress.

### Передумови

- Docker Desktop (запущений), minikube, kubectl
- кластер: `minikube start --driver=docker --cpus=2 --memory=4096`
- доповнення: `minikube addons enable metrics-server` і `minikube addons enable ingress`

### Збірка образів і завантаження в minikube

Образи мають версійні теги, тег `latest` не використовується. Адреси `NEXT_PUBLIC_*` вбудовуються у фронтенд під час збірки, тому вказується хост Ingress `gyp6.local`.

```
docker build -t gyp6-backend:1.0.0 -f server/Dockerfile.api server
docker build -t gyp6-frontend:1.0.0 --build-arg NEXT_PUBLIC_API_URL="http://gyp6.local/api/v1/" --build-arg NEXT_PUBLIC_FRONTEND_URL="http://gyp6.local" --build-arg NEXT_PUBLIC_BA_API_URL="http://gyp6.local" --build-arg NEXT_PUBLIC_BA_BASE_PATH="/api/v1/auth" --build-arg NEXT_PUBLIC_S3_URL="http://gyp6.local/uploads" -f client/Dockerfile.web client
minikube image load gyp6-backend:1.0.0
minikube image load gyp6-frontend:1.0.0
```

Друга версія (1.1.0) збирається тими самими командами зі зміненим тегом і потрібна для демонстрації оновлення та відкату.

### Розгортання однією командою

```
kubectl apply -f k8s/
```

### Доступ до застосунку

1. У файл `C:\Windows\System32\drivers\etc\hosts` додати рядок `127.0.0.1 gyp6.local` (від імені адміністратора).
2. В окремому терміналі від імені адміністратора залишити відкритим `minikube tunnel`.
3. Відкрити `http://gyp6.local` у браузері.

Запасний варіант без Ingress: `minikube service frontend -n gyp6-sale --url` (NodePort).

### Чому в поді фронтенду є nginx-sidecar

Серверний рендеринг Next.js звертається до публічної адреси `gyp6.local`, яка вбудована в образ під час збірки. Усередині пода цей хост через `hostAliases` вказує на `127.0.0.1`, де на порту 80 слухає nginx-sidecar: він спрямовує `/api/v1` до сервісу `backend`, а решту запитів до Next.js на порту 3000.

### Параметри ConfigMap `gyp6-config`

| Ключ | Значення | Призначення |
|---|---|---|
| `NODE_ENV` | `production` | режим роботи бекенду |
| `HTTP_PORT` | `4200` | порт бекенду |
| `HTTP_HOST` | `http://backend:4200` | внутрішня адреса бекенду |
| `HTTP_CORS` | `http://gyp6.local` | дозволений origin для CORS |
| `BACKEND_URL` | `http://gyp6.local` | публічна адреса бекенду |
| `FRONTEND_URL` | `http://gyp6.local` | публічна адреса фронтенду |
| `BETTER_AUTH_URL` | `http://gyp6.local` | базова адреса автентифікації |
| `API_URL` | `http://backend:4200` | адреса бекенду для серверної частини фронтенду |
| `INTERNAL_BACKEND_URL` | `http://backend:4200` | внутрішня адреса бекенду, у фронтенді передається як `BACKEND_URL` для серверного рендерингу |
| `POSTGRES_USER` | `gyp6` | користувач бази даних |
| `POSTGRES_DB` | `gyp6_db` | назва бази даних |
| `REDIS_USER` | `default` | користувач Redis |
| `REDIS_HOST` | `redis` | хост Redis (ім'я Service) |
| `REDIS_PORT` | `6379` | порт Redis |
| `RESEND_MAIL_FROM` | `onboarding@resend.dev` | адреса відправника листів |
| `S3_REGION` | `us-east-1` | регіон S3 |
| `S3_ENDPOINT` | `http://s3:4566` | адреса S3-сховища |
| `S3_BUCKET_NAME` | `furniture-wholesale-bucket` | назва бакета |
| `GOOGLE_CLIENT_ID`, `FACEBOOK_CLIENT_ID`, `APPLE_CLIENT_ID` | порожні | OAuth-ідентифікатори (не використовуються) |

### Параметри Secret `gyp6-secret`

Усі значення тестові, реальних паролів немає.

| Ключ | Призначення |
|---|---|
| `POSTGRES_PASSWORD` | пароль користувача бази даних |
| `DATABASE_URL` | рядок підключення до PostgreSQL |
| `REDIS_PASSWORD` | пароль Redis |
| `JWT_SECRET` | ключ підпису JWT |
| `BETTER_AUTH_SECRET` | ключ бібліотеки автентифікації |
| `RESEND_API_KEY` | ключ сервісу пошти (заглушка) |
| `S3_ACCESS_KEY`, `S3_SECRET_KEY` | ключі доступу до S3 |
| `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_SECRET`, `APPLE_CLIENT_SECRET` | OAuth-секрети (порожні) |

### Видалення

```
kubectl delete namespace gyp6-sale
```

## Подяки

Автор висловлює щиру подяку кабачку за моральну підтримку.

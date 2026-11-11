## Gyp6.sale: Helm-чарт

Чарт розгортає застосунок Gyp6.sale (B2B-маркетплейс меблів): frontend на Next.js, backend на NestJS, PostgreSQL 18 і Redis. Він замінює маніфести з каталогу `k8s/` (лабораторна робота 3) і дає той самий набір об'єктів: 2 ConfigMap, Secret, PersistentVolumeClaim, 4 Deployment, 4 Service і Ingress. Об'єкт Namespace у чарт не входить: namespace створює Helm (`--create-namespace`).

### Структура чарта

```
chart/gyp6/
├── Chart.yaml                     метадані чарта
├── values.yaml                    значення за замовчуванням (середовище dev)
├── values-dev.yaml                значення середовища dev
├── values-prod.yaml               значення середовища prod
├── .helmignore
├── README.md
└── templates/
    ├── _helpers.tpl               іменовані шаблони: gyp6.fullname, gyp6.labels та інші
    ├── NOTES.txt                  інструкція після встановлення
    ├── configmap.yaml             ConfigMap з конфігурацією застосунку
    ├── secret.yaml                Secret (значення беруться з values)
    ├── frontend-proxy-configmap.yaml   конфігурація nginx-sidecar
    ├── postgres-pvc.yaml          PersistentVolumeClaim (прапорець postgres.persistence.enabled)
    ├── postgres-deployment.yaml
    ├── postgres-service.yaml
    ├── redis-deployment.yaml
    ├── redis-service.yaml
    ├── backend-deployment.yaml
    ├── backend-service.yaml
    ├── frontend-deployment.yaml
    ├── frontend-service.yaml
    ├── ingress.yaml               Ingress (прапорець ingress.enabled)
    ├── hooks/pre-upgrade-job.yaml хук pre-upgrade: перевірка бази перед оновленням
    └── tests/test-connection.yaml тест релізу: `helm test`
```

### version і appVersion

У `Chart.yaml` є два номери версій, і вони змінюються незалежно:

- `version` (зараз `0.1.0`) це версія самого чарта. Вона зростає, коли змінюються шаблони, структура `values` або значення за замовчуванням. Наприклад, додали новий шаблон чи параметр, тому версія стала `0.2.0`.
- `appVersion` (зараз `1.0.0`) це версія застосунку, який розгортає чарт, тобто тег образів `gyp6-backend` і `gyp6-frontend`. Вона змінюється, коли виходить нова версія застосунку (`1.1.0`), навіть якщо шаблони лишилися тими самими. Якщо в `values` тег образу порожній, використовується `appVersion`.

### Передумови

- кластер minikube (`minikube start --driver=docker --cpus=2 --memory=4096`) з увімкненим доповненням `ingress`;
- Helm 3 або новіший (`helm version`);
- образи `gyp6-backend` і `gyp6-frontend` потрібних версій завантажені в minikube командою `minikube image load`.

### Встановлення

Середовище dev (мінімум реплік і ресурсів, без Ingress, доступ через NodePort):

```
helm install gyp6 chart/gyp6 -n gyp6-helm --create-namespace -f chart/gyp6/values-dev.yaml
```

Середовище prod (3 репліки backend, 2 репліки frontend, образи 1.1.0, Ingress):

```
helm install gyp6 chart/gyp6 -n gyp6-helm --create-namespace -f chart/gyp6/values-prod.yaml
```

Паролі у файлах значень є тестовими заглушками. У реальному середовищі передавайте їх через `--set secret.postgresPassword=...` або окремий файл значень, який не потрапляє в git.

Чарт можна встановити кілька разів в один кластер: імена об'єктів будуються з імені релізу, тож достатньо іншого імені релізу (і іншого `publicHost`, якщо вмикається Ingress).

### Пріоритет значень

Від найнижчого до найвищого:

1. `values.yaml` у чарті;
2. файли `-f` (якщо їх кілька, пізніший файл перекриває попередній);
3. прапорці `--set` (перекривають усе інше).

Приклад для `backend.replicaCount`: у `values.yaml` це 1, з `-f values-prod.yaml` це 3, з `-f values-prod.yaml --set backend.replicaCount=5` це 5. Без `--reuse-values` команда `helm upgrade` починає з `values.yaml`, а не з попередніх значень релізу.

### Параметри values

| Параметр | dev (за замовчуванням) | prod | Опис |
|---|---|---|---|
| `nameOverride` | `""` | — | перевизначення назви чарта в іменах об'єктів |
| `fullnameOverride` | `""` | — | повністю замінює префікс імен об'єктів (за замовчуванням береться з імені релізу) |
| `environment` | `dev` | `prod` | назва середовища, виводиться в NOTES.txt |
| `publicHost` | `gyp6.local` | — | публічний хост: Ingress, CORS, адреси автентифікації, hostAliases для nginx-sidecar |
| `commonLabels` | `{}` | — | додаткові мітки для всіх об'єктів |
| `commonAnnotations` | `{}` | — | додаткові анотації для всіх об'єктів |
| `imagePullPolicy` | `IfNotPresent` | — | політика завантаження образів |
| `utilImage.repository` | `busybox` | — | допоміжний образ (init-контейнер, хук, тест): репозиторій |
| `utilImage.tag` | `1.36` | — | допоміжний образ: тег |
| `backend.image.repository` | `gyp6-backend` | — | образ backend: репозиторій |
| `backend.image.tag` | `1.0.0` | `1.1.0` | образ backend: тег (порожній тег означає `appVersion` чарта) |
| `backend.replicaCount` | `1` | `3` | кількість реплік backend |
| `backend.port` | `4200` | — | порт контейнера backend |
| `backend.strategy.maxSurge` | `1` | — | rolling update backend: скільки зайвих подів дозволено |
| `backend.strategy.maxUnavailable` | `0` | — | rolling update backend: скільки подів можуть бути недоступні |
| `backend.service.type` | `ClusterIP` | — | тип Service backend |
| `backend.service.port` | `4200` | — | порт Service backend |
| `backend.resources.requests.cpu` | `50m` | `100m` | backend: requests (CPU) |
| `backend.resources.requests.memory` | `128Mi` | `256Mi` | backend: requests (пам'ять) |
| `backend.resources.limits.cpu` | `300m` | `1000m` | backend: limits (CPU) |
| `backend.resources.limits.memory` | `512Mi` | `768Mi` | backend: limits (пам'ять) |
| `frontend.image.repository` | `gyp6-frontend` | — | образ frontend: репозиторій |
| `frontend.image.tag` | `1.0.0` | `1.1.0` | образ frontend: тег (порожній тег означає `appVersion` чарта) |
| `frontend.replicaCount` | `1` | `2` | кількість реплік frontend |
| `frontend.port` | `3000` | — | порт контейнера frontend |
| `frontend.strategy.maxSurge` | `1` | — | rolling update frontend: скільки зайвих подів дозволено |
| `frontend.strategy.maxUnavailable` | `0` | — | rolling update frontend: скільки подів можуть бути недоступні |
| `frontend.service.type` | `NodePort` | — | тип Service frontend |
| `frontend.service.port` | `3000` | — | порт Service frontend |
| `frontend.resources.requests.cpu` | `50m` | `100m` | frontend: requests (CPU) |
| `frontend.resources.requests.memory` | `128Mi` | `256Mi` | frontend: requests (пам'ять) |
| `frontend.resources.limits.cpu` | `300m` | `1000m` | frontend: limits (CPU) |
| `frontend.resources.limits.memory` | `512Mi` | `768Mi` | frontend: limits (пам'ять) |
| `frontend.proxy.enabled` | `true` | — | чи додавати nginx-sidecar у поди frontend |
| `frontend.proxy.image.repository` | `nginx` | — | образ nginx-sidecar: репозиторій |
| `frontend.proxy.image.tag` | `1.27-alpine` | — | образ nginx-sidecar: тег |
| `frontend.proxy.resources.requests.cpu` | `25m` | — | nginx-sidecar: requests (CPU) |
| `frontend.proxy.resources.requests.memory` | `32Mi` | — | nginx-sidecar: requests (пам'ять) |
| `frontend.proxy.resources.limits.cpu` | `100m` | — | nginx-sidecar: limits (CPU) |
| `frontend.proxy.resources.limits.memory` | `64Mi` | — | nginx-sidecar: limits (пам'ять) |
| `postgres.image.repository` | `postgres` | — | образ PostgreSQL: репозиторій |
| `postgres.image.tag` | `18.3-bookworm` | — | образ PostgreSQL: тег |
| `postgres.database` | `gyp6_db` | — | назва бази даних |
| `postgres.user` | `gyp6` | — | користувач бази даних |
| `postgres.port` | `5432` | — | порт контейнера PostgreSQL |
| `postgres.service.type` | `ClusterIP` | — | тип Service PostgreSQL |
| `postgres.service.port` | `5432` | — | порт Service PostgreSQL |
| `postgres.resources.requests.cpu` | `50m` | `100m` | PostgreSQL: requests (CPU) |
| `postgres.resources.requests.memory` | `128Mi` | `256Mi` | PostgreSQL: requests (пам'ять) |
| `postgres.resources.limits.cpu` | `300m` | `500m` | PostgreSQL: limits (CPU) |
| `postgres.resources.limits.memory` | `512Mi` | `768Mi` | PostgreSQL: limits (пам'ять) |
| `postgres.persistence.enabled` | `true` | — | чи створювати PersistentVolumeClaim (інакше emptyDir) |
| `postgres.persistence.size` | `1Gi` | — | розмір тому бази даних |
| `postgres.persistence.accessMode` | `ReadWriteOnce` | — | режим доступу до тому |
| `postgres.persistence.storageClass` | `""` | — | клас сховища (порожнє значення означає клас за замовчуванням) |
| `redis.image.repository` | `redis` | — | образ Redis: репозиторій |
| `redis.image.tag` | `8.2.5-bookworm` | — | образ Redis: тег |
| `redis.user` | `default` | — | користувач Redis |
| `redis.port` | `6379` | — | порт контейнера Redis |
| `redis.service.type` | `ClusterIP` | — | тип Service Redis |
| `redis.service.port` | `6379` | — | порт Service Redis |
| `redis.resources.requests.cpu` | `50m` | — | Redis: requests (CPU) |
| `redis.resources.requests.memory` | `64Mi` | — | Redis: requests (пам'ять) |
| `redis.resources.limits.cpu` | `200m` | — | Redis: limits (CPU) |
| `redis.resources.limits.memory` | `128Mi` | — | Redis: limits (пам'ять) |
| `ingress.enabled` | `false` | `true` | чи створювати об'єкт Ingress |
| `ingress.className` | `nginx` | — | клас Ingress |
| `ingress.apiPath` | `/api/v1` | — | шлях, який Ingress і nginx-sidecar спрямовують на backend |
| `config.nodeEnv` | `production` | — | режим роботи застосунку (`NODE_ENV`) |
| `config.resendMailFrom` | `onboarding@resend.dev` | — | адреса відправника листів |
| `config.s3.region` | `us-east-1` | — | регіон S3 |
| `config.s3.endpoint` | `http://s3:4566` | — | адреса S3-сховища |
| `config.s3.bucket` | `furniture-wholesale-bucket` | — | назва бакета S3 |
| `config.oauth.googleClientId` | `""` | — | ідентифікатор Google OAuth |
| `config.oauth.facebookClientId` | `""` | — | ідентифікатор Facebook OAuth |
| `config.oauth.appleClientId` | `""` | — | ідентифікатор Apple OAuth |
| `secret.postgresPassword` | `gyp6_test_password` | `CHANGE_ME_postgres` | пароль користувача бази даних |
| `secret.redisPassword` | `redis_test_password` | `CHANGE_ME_redis` | пароль Redis |
| `secret.jwtSecret` | `test-jwt-secret-not-for-production` | `CHANGE_ME_jwt` | ключ підпису JWT |
| `secret.betterAuthSecret` | `test-better-auth-secret-not-for-production` | `CHANGE_ME_better_auth` | ключ бібліотеки автентифікації |
| `secret.resendApiKey` | `re_dummy_key_for_local_testing` | — | ключ сервісу пошти (заглушка) |
| `secret.s3AccessKey` | `test` | — | ключ доступу до S3 |
| `secret.s3SecretKey` | `test` | — | секретний ключ S3 |
| `secret.googleClientSecret` | `""` | — | секрет Google OAuth |
| `secret.facebookClientSecret` | `""` | — | секрет Facebook OAuth |
| `secret.appleClientSecret` | `""` | — | секрет Apple OAuth |
| `frontend.service.nodePort` | не задано (порт призначається автоматично) | — | фіксований NodePort frontend (лише для типу NodePort) |

Розмір тому бази (`postgres.persistence.size`) однаковий у всіх середовищах: збільшити вже створений PersistentVolumeClaim можна лише тоді, коли клас сховища підтримує розширення, а в minikube (`standard`) це не так. Спроба змінити розмір під час `helm upgrade` завершується помилкою `only dynamically provisioned pvc can be resized`.

### Хук і тест релізу

- Хук `pre-upgrade` (`templates/hooks/pre-upgrade-job.yaml`): перед кожним `helm upgrade` запускається Job, який перевіряє, що база даних доступна. Після успішного виконання Job видаляється.
- Тест (`templates/tests/test-connection.yaml`): команда `helm test <реліз> -n <namespace> --logs` запускає Pod, який перевіряє доступність PostgreSQL, Redis, backend і frontend.

### Життєвий цикл релізу

```
helm lint chart/gyp6
helm template gyp6 chart/gyp6 -n gyp6-helm -f chart/gyp6/values-dev.yaml --no-hooks
helm upgrade gyp6 chart/gyp6 -n gyp6-helm --reuse-values --set backend.image.tag=1.1.0 --set frontend.image.tag=1.1.0
helm upgrade gyp6 chart/gyp6 -n gyp6-helm -f chart/gyp6/values-prod.yaml
helm history gyp6 -n gyp6-helm
helm rollback gyp6 2 -n gyp6-helm
helm test gyp6 -n gyp6-helm --logs
helm uninstall gyp6 -n gyp6-helm
```

Стан релізу Helm зберігає в Secret типу `helm.sh/release.v1` у namespace релізу (по одному на кожну ревізію).

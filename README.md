# gyp6-sale-gitops

Репозиторій конфігурації (GitOps) для Gyp6.sale. Бажаний стан кластера описаний тут, Argo CD приводить кластер до нього.

```
bootstrap/root-app.yaml   кореневий Application (єдиний, що застосовується вручну)
argocd-apps/gyp6.yaml     Application застосунку
charts/gyp6/              Helm-чарт із ЛР-4 (values.yaml + values-minikube.yaml)
scripts/create-secret.ps1 створення Secret поза Git
```

Паролі та токени в Git не зберігаються: чарт бере `secret.existingSecret: gyp6-secret`, а Secret створює `scripts/create-secret.ps1`.
Образи: `ghcr.io/ssophiastep/gyp6-backend` і `gyp6-frontend` з конкретним тегом (див. `values-minikube.yaml`).

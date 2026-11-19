# Створює Secret gyp6-secret у кластері ПОЗА Git. Запускати один раз: .\scripts\create-secret.ps1
# Паролі генеруються випадково і ніде не зберігаються в репозиторії.
$ns = "gyp6"
kubectl create namespace $ns --dry-run=client -o yaml | kubectl apply -f -

function New-Pass { -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_}) }
$pg    = New-Pass
$redis = New-Pass
$jwt   = New-Pass
$ba    = New-Pass

kubectl -n $ns create secret generic gyp6-secret `
  --from-literal=POSTGRES_PASSWORD=$pg `
  --from-literal=DATABASE_URL="postgresql://gyp6:$pg@gyp6-postgres:5432/gyp6_db?schema=public" `
  --from-literal=REDIS_PASSWORD=$redis `
  --from-literal=JWT_SECRET=$jwt `
  --from-literal=BETTER_AUTH_SECRET=$ba `
  --from-literal=RESEND_API_KEY=re_dummy_key_for_local_testing `
  --from-literal=S3_ACCESS_KEY=test `
  --from-literal=S3_SECRET_KEY=test `
  --from-literal=GOOGLE_CLIENT_SECRET="" `
  --from-literal=FACEBOOK_CLIENT_SECRET="" `
  --from-literal=APPLE_CLIENT_SECRET="" `
  --dry-run=client -o yaml | kubectl apply -f -
kubectl -n $ns get secret gyp6-secret

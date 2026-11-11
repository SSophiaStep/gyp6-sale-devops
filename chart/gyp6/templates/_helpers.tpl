{{/*
Назва чарта (з можливістю перевизначення).
*/}}
{{- define "gyp6.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Повне ім'я об'єктів: будується з імені релізу, тому чарт можна встановити кілька разів в один кластер.
*/}}
{{- define "gyp6.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Назва та версія чарта для мітки helm.sh/chart.
*/}}
{{- define "gyp6.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Мітки для selector: контекст це словник з ключами root (корінь чарта) і component.
*/}}
{{- define "gyp6.selectorLabels" -}}
app.kubernetes.io/name: {{ include "gyp6.name" .root }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Повний набір міток об'єкта.
*/}}
{{- define "gyp6.labels" -}}
helm.sh/chart: {{ include "gyp6.chart" .root }}
{{ include "gyp6.selectorLabels" . }}
app.kubernetes.io/version: {{ .root.Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
{{- with .root.Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Мітки подів: selector-мітки плюс додаткові мітки з commonLabels.
*/}}
{{- define "gyp6.podLabels" -}}
{{ include "gyp6.selectorLabels" . }}
{{- with .root.Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end }}

{{/*
Секції labels та annotations для metadata будь-якого об'єкта.
*/}}
{{- define "gyp6.meta" -}}
labels:
  {{- include "gyp6.labels" . | nindent 2 }}
{{- with .root.Values.commonAnnotations }}
annotations:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}

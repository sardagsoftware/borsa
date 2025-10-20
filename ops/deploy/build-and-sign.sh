#!/bin/bash
# Lydian-IQ v3.0 - Build & Sign Docker Image
# Usage: ./build-and-sign.sh [version]

set -euo pipefail

VERSION="${1:-3.0.1}"
IMAGE_NAME="lydian-iq-api"
REGISTRY="${REGISTRY:-azurecr.io/ailydian}"
FULL_IMAGE="${REGISTRY}/${IMAGE_NAME}:${VERSION}"

echo "🔨 Building Lydian-IQ v${VERSION}..."

# 1. Build Docker image
docker build \
  --build-arg VERSION="${VERSION}" \
  --build-arg BUILD_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --build-arg VCS_REF="$(git rev-parse --short HEAD)" \
  --tag "${FULL_IMAGE}" \
  --tag "${REGISTRY}/${IMAGE_NAME}:latest" \
  --file ops/deploy/Dockerfile \
  .

echo "✅ Image built: ${FULL_IMAGE}"

# 2. Generate SBOM (CycloneDX format)
echo "📦 Generating SBOM..."
docker sbom "${FULL_IMAGE}" --format cyclonedx-json > "ops/sbom/lydian-iq-${VERSION}.cdx.json"

echo "✅ SBOM generated: ops/sbom/lydian-iq-${VERSION}.cdx.json"

# 3. Sign image with cosign (keyless signing via OIDC)
echo "🔐 Signing image with cosign..."
cosign sign --yes "${FULL_IMAGE}"

echo "✅ Image signed with keyless signature"

# 4. Verify signature
echo "🔍 Verifying signature..."
cosign verify \
  --certificate-identity-regexp=".*" \
  --certificate-oidc-issuer-regexp=".*" \
  "${FULL_IMAGE}"

echo "✅ Signature verified"

# 5. Push to registry
echo "📤 Pushing to registry..."
docker push "${FULL_IMAGE}"
docker push "${REGISTRY}/${IMAGE_NAME}:latest"

echo "✅ Image pushed to ${REGISTRY}"

# 6. Generate deployment manifest
cat > "ops/deploy/deployment-${VERSION}.yaml" <<ENDOFFILE
apiVersion: apps/v1
kind: Deployment
metadata:
  name: lydian-iq-api
  namespace: production
  labels:
    app: lydian-iq-api
    version: "${VERSION}"
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: lydian-iq-api
  template:
    metadata:
      labels:
        app: lydian-iq-api
        version: "${VERSION}"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3100"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: lydian-iq-api
      containers:
      - name: api
        image: ${FULL_IMAGE}
        imagePullPolicy: Always
        ports:
        - name: http
          containerPort: 3100
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3100"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: lydian-db-credentials
              key: connection-string
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: lydian-redis-credentials
              key: connection-string
        - name: JWT_PRIVATE_KEY
          valueFrom:
            secretKeyRef:
              name: lydian-jwt-keys
              key: private-key
        - name: JWT_PUBLIC_KEY
          valueFrom:
            secretKeyRef:
              name: lydian-jwt-keys
              key: public-key
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2000m"
            memory: "2Gi"
        livenessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 3100
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
---
apiVersion: v1
kind: Service
metadata:
  name: lydian-iq-api
  namespace: production
  labels:
    app: lydian-iq-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 3100
    protocol: TCP
    name: http
  selector:
    app: lydian-iq-api
ENDOFFILE

echo "✅ Deployment manifest created: ops/deploy/deployment-${VERSION}.yaml"

# 7. Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Build & Sign Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Image:      ${FULL_IMAGE}"
echo "SBOM:       ops/sbom/lydian-iq-${VERSION}.cdx.json"
echo "Signature:  Signed with cosign keyless"
echo "Manifest:   ops/deploy/deployment-${VERSION}.yaml"
echo ""
echo "Next steps:"
echo "  1. kubectl apply -f ops/deploy/deployment-${VERSION}.yaml"
echo "  2. kubectl apply -f ops/deploy/hpa.yaml"
echo "  3. Run smoke tests: ./ops/scripts/smoke-test-production.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

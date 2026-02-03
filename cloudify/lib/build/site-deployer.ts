/**
 * Site Deployer - Creates K8s Deployments and Services for deployed sites
 * Sites are served from MinIO via Nginx pods
 */

import * as k8s from "@kubernetes/client-node";
import {
  createProjectSubdomain,
  deleteProjectSubdomain,
  getProjectUrl,
} from "@/lib/integrations/cloudflare";

const SITES_NAMESPACE = "cloudify-sites";
const SYSTEM_NAMESPACE = "cloudify-system";

interface SiteDeploymentConfig {
  siteSlug: string;
  projectId: string;
  deploymentId: string;
  replicas?: number;
}

// Initialize K8s client
function getK8sClients() {
  const kc = new k8s.KubeConfig();

  try {
    kc.loadFromCluster();
  } catch {
    kc.loadFromDefault();
  }

  return {
    appsApi: kc.makeApiClient(k8s.AppsV1Api),
    coreApi: kc.makeApiClient(k8s.CoreV1Api),
  };
}

/**
 * Create or update a site deployment in K3s
 */
export async function deploySite(config: SiteDeploymentConfig): Promise<{
  success: boolean;
  serviceName?: string;
  url?: string;
  error?: string;
}> {
  const { appsApi, coreApi } = getK8sClients();
  const { siteSlug, projectId, deploymentId, replicas = 1 } = config;

  const deploymentName = `site-${siteSlug}`;
  const serviceName = `site-${siteSlug}`;

  // Nginx config for SPA routing
  const nginxConfig = `
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Cloudify-Site "${siteSlug}";

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
`;

  try {
    // Create ConfigMap for nginx config
    const configMapName = `nginx-config-${siteSlug}`;
    const configMap: k8s.V1ConfigMap = {
      metadata: {
        name: configMapName,
        namespace: SITES_NAMESPACE,
        labels: {
          "cloudify.io/site-slug": siteSlug,
          "cloudify.io/project-id": projectId,
        },
      },
      data: {
        "default.conf": nginxConfig,
      },
    };

    // Delete existing configmap if it exists
    try {
      await coreApi.deleteNamespacedConfigMap(configMapName, SITES_NAMESPACE);
    } catch {
      // Doesn't exist
    }
    await coreApi.createNamespacedConfigMap(SITES_NAMESPACE, configMap);

    // Create Deployment
    const deployment: k8s.V1Deployment = {
      metadata: {
        name: deploymentName,
        namespace: SITES_NAMESPACE,
        labels: {
          app: deploymentName,
          "cloudify.io/component": "site",
          "cloudify.io/site-slug": siteSlug,
          "cloudify.io/project-id": projectId,
          "cloudify.io/deployment-id": deploymentId,
        },
      },
      spec: {
        replicas,
        selector: {
          matchLabels: {
            app: deploymentName,
          },
        },
        template: {
          metadata: {
            labels: {
              app: deploymentName,
              "cloudify.io/site-slug": siteSlug,
            },
          },
          spec: {
            initContainers: [
              {
                name: "fetch-artifacts",
                image: "minio/mc:latest",
                command: ["/bin/sh", "-c"],
                args: [
                  `echo "Fetching artifacts for ${siteSlug}..." && ` +
                  `mc alias set minio http://minio.${SYSTEM_NAMESPACE}:9000 $MINIO_ACCESS_KEY $MINIO_SECRET_KEY && ` +
                  `mc cp -r minio/cloudify-builds/${siteSlug}/ /usr/share/nginx/html/ && ` +
                  `echo "Artifacts fetched successfully"`,
                ],
                env: [
                  {
                    name: "MINIO_ACCESS_KEY",
                    valueFrom: {
                      secretKeyRef: {
                        name: "minio-credentials",
                        key: "root-user",
                      },
                    },
                  },
                  {
                    name: "MINIO_SECRET_KEY",
                    valueFrom: {
                      secretKeyRef: {
                        name: "minio-credentials",
                        key: "root-password",
                      },
                    },
                  },
                ],
                volumeMounts: [
                  { name: "html", mountPath: "/usr/share/nginx/html" },
                ],
              },
            ],
            containers: [
              {
                name: "nginx",
                image: "nginx:alpine",
                ports: [{ name: "http", containerPort: 80 }],
                volumeMounts: [
                  { name: "html", mountPath: "/usr/share/nginx/html" },
                  {
                    name: "nginx-config",
                    mountPath: "/etc/nginx/conf.d/default.conf",
                    subPath: "default.conf",
                  },
                ],
                resources: {
                  requests: { memory: "32Mi", cpu: "10m" },
                  limits: { memory: "128Mi", cpu: "200m" },
                },
                livenessProbe: {
                  httpGet: { path: "/health", port: 80 },
                  initialDelaySeconds: 5,
                  periodSeconds: 30,
                },
                readinessProbe: {
                  httpGet: { path: "/health", port: 80 },
                  initialDelaySeconds: 2,
                  periodSeconds: 10,
                },
              },
            ],
            volumes: [
              { name: "html", emptyDir: {} },
              {
                name: "nginx-config",
                configMap: { name: configMapName },
              },
            ],
          },
        },
      },
    };

    // Delete existing deployment if it exists
    try {
      await appsApi.deleteNamespacedDeployment(deploymentName, SITES_NAMESPACE);
      // Wait for deletion
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch {
      // Doesn't exist
    }

    await appsApi.createNamespacedDeployment(SITES_NAMESPACE, deployment);

    // Create Service
    const service: k8s.V1Service = {
      metadata: {
        name: serviceName,
        namespace: SITES_NAMESPACE,
        labels: {
          "cloudify.io/site-slug": siteSlug,
          "cloudify.io/project-id": projectId,
        },
      },
      spec: {
        type: "ClusterIP",
        ports: [{ name: "http", port: 80, targetPort: 80 }],
        selector: {
          app: deploymentName,
        },
      },
    };

    // Delete existing service if it exists
    try {
      await coreApi.deleteNamespacedService(serviceName, SITES_NAMESPACE);
    } catch {
      // Doesn't exist
    }

    await coreApi.createNamespacedService(SITES_NAMESPACE, service);

    console.log(`Site deployed: ${siteSlug} -> ${serviceName}.${SITES_NAMESPACE}`);

    // Create DNS record for the project subdomain
    const dnsResult = await createProjectSubdomain(siteSlug);
    if (!dnsResult.success) {
      console.warn(`[Site Deployer] DNS creation failed for ${siteSlug}: ${dnsResult.error}`);
      // Don't fail the deployment, just log the warning
    }

    const url = getProjectUrl(siteSlug);
    console.log(`Site accessible at: ${url}`);

    return { success: true, serviceName, url };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to deploy site ${siteSlug}:`, error);
    return { success: false, error: message };
  }
}

/**
 * Delete a site deployment
 */
export async function deleteSite(siteSlug: string): Promise<boolean> {
  const { appsApi, coreApi } = getK8sClients();

  const deploymentName = `site-${siteSlug}`;
  const serviceName = `site-${siteSlug}`;
  const configMapName = `nginx-config-${siteSlug}`;

  try {
    // Delete in order: Service, Deployment, ConfigMap
    try {
      await coreApi.deleteNamespacedService(serviceName, SITES_NAMESPACE);
    } catch {
      // Doesn't exist
    }

    try {
      await appsApi.deleteNamespacedDeployment(deploymentName, SITES_NAMESPACE);
    } catch {
      // Doesn't exist
    }

    try {
      await coreApi.deleteNamespacedConfigMap(configMapName, SITES_NAMESPACE);
    } catch {
      // Doesn't exist
    }

    // Delete DNS record for the project subdomain
    const dnsDeleted = await deleteProjectSubdomain(siteSlug);
    if (!dnsDeleted) {
      console.warn(`[Site Deployer] Failed to delete DNS record for ${siteSlug}`);
    }

    console.log(`Site deleted: ${siteSlug}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete site ${siteSlug}:`, error);
    return false;
  }
}

/**
 * Get site deployment status
 */
export async function getSiteStatus(siteSlug: string): Promise<{
  exists: boolean;
  ready: boolean;
  replicas?: number;
  availableReplicas?: number;
}> {
  const { appsApi } = getK8sClients();
  const deploymentName = `site-${siteSlug}`;

  try {
    const response = await appsApi.readNamespacedDeployment(
      deploymentName,
      SITES_NAMESPACE
    );
    const deployment = response.body;

    return {
      exists: true,
      ready: (deployment.status?.availableReplicas || 0) > 0,
      replicas: deployment.status?.replicas,
      availableReplicas: deployment.status?.availableReplicas,
    };
  } catch {
    return { exists: false, ready: false };
  }
}

/**
 * Scale a site deployment
 */
export async function scaleSite(
  siteSlug: string,
  replicas: number
): Promise<boolean> {
  const { appsApi } = getK8sClients();
  const deploymentName = `site-${siteSlug}`;

  try {
    await appsApi.patchNamespacedDeployment(
      deploymentName,
      SITES_NAMESPACE,
      { spec: { replicas } },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { "Content-Type": "application/strategic-merge-patch+json" } }
    );
    return true;
  } catch (error) {
    console.error(`Failed to scale site ${siteSlug}:`, error);
    return false;
  }
}

/**
 * Rollback a site to a previous deployment
 */
export async function rollbackSite(
  siteSlug: string,
  previousSiteSlug: string,
  projectId: string,
  newDeploymentId: string
): Promise<{ success: boolean; error?: string }> {
  // Copy artifacts from previous deployment
  const { getMinioClient } = await import("./artifact-manager");
  const client = getMinioClient();

  try {
    // List all objects from previous deployment
    const objects: string[] = [];
    const stream = client.listObjects("cloudify-builds", `${previousSiteSlug}/`, true);

    await new Promise<void>((resolve, reject) => {
      stream.on("data", (obj: { name?: string }) => {
        if (obj.name) objects.push(obj.name);
      });
      stream.on("end", () => resolve());
      stream.on("error", (err: Error) => reject(err));
    });

    // Copy each object to new location
    for (const objName of objects) {
      const newName = objName.replace(previousSiteSlug, siteSlug);
      await client.copyObject(
        "cloudify-builds",
        newName,
        `/cloudify-builds/${objName}`
      );
    }

    // Deploy the site with new artifacts
    return deploySite({
      siteSlug,
      projectId,
      deploymentId: newDeploymentId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * List all deployed sites
 */
export async function listSites(): Promise<
  Array<{
    siteSlug: string;
    projectId: string;
    deploymentId: string;
    ready: boolean;
    createdAt?: Date;
  }>
> {
  const { appsApi } = getK8sClients();

  try {
    const response = await appsApi.listNamespacedDeployment(
      SITES_NAMESPACE,
      undefined,
      undefined,
      undefined,
      undefined,
      "cloudify.io/component=site"
    );

    return response.body.items.map((dep: k8s.V1Deployment) => ({
      siteSlug: dep.metadata?.labels?.["cloudify.io/site-slug"] || "",
      projectId: dep.metadata?.labels?.["cloudify.io/project-id"] || "",
      deploymentId: dep.metadata?.labels?.["cloudify.io/deployment-id"] || "",
      ready: (dep.status?.availableReplicas || 0) > 0,
      createdAt: dep.metadata?.creationTimestamp,
    }));
  } catch (error) {
    console.error("Failed to list sites:", error);
    return [];
  }
}

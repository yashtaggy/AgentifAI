import { ApiSpec, ApiEndpoint, ApiParameter } from "@/types";

export async function parseOpenApiUrl(url: string): Promise<ApiSpec> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch OpenAPI spec from ${url}`);
    }

    const spec = await response.json();
    return parseOpenApiJson(spec);
}

export function parseOpenApiJson(spec: any): ApiSpec {
    const title = spec.info?.title || "Unknown API";
    const description = spec.info?.description || "";
    const version = spec.info?.version || "1.0.0";

    let baseUrl = "";
    if (spec.servers && spec.servers.length > 0) {
        baseUrl = spec.servers[0].url;
    } else if (spec.host) {
        const scheme = spec.schemes?.[0] || 'https';
        baseUrl = `${scheme}://${spec.host}${spec.basePath || ''}`;
    }

    const endpoints: ApiEndpoint[] = [];

    if (spec.paths) {
        Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
            Object.entries(methods).forEach(([method, config]: [string, any]) => {
                if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method.toLowerCase())) {
                    endpoints.push({
                        path,
                        method: method.toUpperCase(),
                        summary: config.summary || '',
                        description: config.description || '',
                        operationId: config.operationId || '',
                        parameters: (config.parameters || []).map((p: any) => ({
                            name: p.name,
                            in: p.in,
                            description: p.description,
                            required: p.required,
                            schema: p.schema || p.type
                        })),
                        requestBody: config.requestBody,
                        responses: config.responses
                    });
                }
            });
        });
    }

    return {
        title,
        description,
        version,
        baseUrl,
        endpoints
    };
}

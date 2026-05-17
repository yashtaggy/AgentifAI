"use server";

import { parseOpenApiJson } from "@/services/openapi";
import { ApiSpec } from "@/types";

export async function fetchAndParseSpec(url: string): Promise<ApiSpec> {
    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type");
        const text = await response.text();

        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            // If it's not JSON, it might be YAML (not supported yet but we can at least catch the error cleanly)
            throw new Error("The URL did not return a valid JSON OpenAPI spec. YAML parsing is not yet supported.");
        }

        return parseOpenApiJson(json);
    } catch (error: any) {
        throw new Error(error.message || "Failed to fetch and parse the API specification.");
    }
}

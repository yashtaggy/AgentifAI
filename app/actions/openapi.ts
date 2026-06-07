"use server";

import { parseOpenApiJson } from "@/services/openapi";
import { ApiSpec } from "@/types";

import * as yaml from 'js-yaml';

export async function fetchAndParseSpec(url: string): Promise<ApiSpec> {
    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
        }

        const text = await response.text();

        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            try {
                json = yaml.load(text);
            } catch (yamlError) {
                throw new Error("The URL did not return a valid JSON or YAML OpenAPI spec.");
            }
        }

        return parseOpenApiJson(json);
    } catch (error: any) {
        throw new Error(error.message || "Failed to fetch and parse the API specification.");
    }
}

export async function fetchRawSpecJSON(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch OpenAPI spec: ${response.statusText}`);
        }

        const text = await response.text();
        try {
            JSON.parse(text);
            return text;
        } catch (e) {
            try {
                const yamlObj = yaml.load(text);
                return JSON.stringify(yamlObj);
            } catch (yamlError) {
                throw new Error("The URL did not return a valid JSON or YAML OpenAPI spec.");
            }
        }
    } catch (error: any) {
        throw new Error(error.message || "Failed to fetch raw API specification.");
    }
}

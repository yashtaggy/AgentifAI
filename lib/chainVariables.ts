export const TARGET_KEYS = [
    'token',
    'access_token',
    'id',
    'session_id',
    'key',
    'bearer',
    'userId',
    'orderId',
    'petId',
    'refresh_token',
];

const TARGET_KEYS_LOWER = TARGET_KEYS.map(k => k.toLowerCase());

export interface ExtractedVar {
    key: string;
    value: string;
    path?: string;
}

/**
 * Recursively scans response JSON for keys matching target variable names (case-insensitive).
 */
export function extractTargetVariables(data: any): ExtractedVar[] {
    const results: ExtractedVar[] = [];
    const visited = new Set<any>();

    function traverse(obj: any, currentPath: string = '') {
        if (!obj || typeof obj !== 'object') return;
        if (visited.has(obj)) return;
        visited.add(obj);

        if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
                traverse(item, currentPath ? `${currentPath}[${index}]` : `[${index}]`);
            });
            return;
        }

        Object.entries(obj).forEach(([key, val]) => {
            const lowerKey = key.toLowerCase();
            const fullPath = currentPath ? `${currentPath}.${key}` : key;

            if (TARGET_KEYS_LOWER.includes(lowerKey)) {
                if (val !== null && val !== undefined && typeof val !== 'object') {
                    const stringVal = String(val);
                    if (stringVal.trim() !== '') {
                        results.push({
                            key: key,
                            value: stringVal,
                            path: fullPath,
                        });
                    }
                }
            }

            if (val && typeof val === 'object') {
                traverse(val, fullPath);
            }
        });
    }

    traverse(data);

    // Deduplicate by key + value
    const uniqueMap = new Map<string, ExtractedVar>();
    results.forEach(item => {
        const uniqueId = `${item.key}:${item.value}`;
        if (!uniqueMap.has(uniqueId)) {
            uniqueMap.set(uniqueId, item);
        }
    });

    return Array.from(uniqueMap.values());
}

/**
 * Replaces all occurrences of {{variable_name}} with their values from the variable store.
 */
export function substituteVariables(text: string, vars: Record<string, string>): string {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\{\{\s*([a-zA-Z0-9_\-\.]+)\s*\}\}/g, (match, varName) => {
        const trimmed = varName.trim();
        return vars[trimmed] !== undefined ? vars[trimmed] : match;
    });
}

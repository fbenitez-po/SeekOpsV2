import type { oas31, ZodOpenApiOperationObject, ZodOpenApiPathsObject } from 'zod-openapi';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface RegisteredOperation {
  method: HttpMethod;
  path: string;
  operation: ZodOpenApiOperationObject;
}

// Module-level registry: the documented-route helper feeds operations here as
// each module's routes.ts is imported. buildPaths() assembles them at the time
// the OpenAPI document is generated.
const operations: RegisteredOperation[] = [];
const tags = new Map<string, oas31.TagObject>();

export function registerOperation(entry: RegisteredOperation): void {
  operations.push(entry);
}

export function registerTag(tag: oas31.TagObject): void {
  if (!tags.has(tag.name)) tags.set(tag.name, tag);
}

export function buildPaths(): ZodOpenApiPathsObject {
  const paths: ZodOpenApiPathsObject = {};
  for (const { method, path, operation } of operations) {
    const item = (paths[path] ??= {}) as Record<string, ZodOpenApiOperationObject>;
    item[method] = operation;
  }
  return paths;
}

export function getTags(): oas31.TagObject[] {
  return [...tags.values()];
}

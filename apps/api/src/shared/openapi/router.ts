import 'zod-openapi';
import { Router, type RequestHandler } from 'express';
import type { ZodObject, ZodType } from 'zod';
import type { oas31, ZodOpenApiOperationObject, ZodOpenApiParameters } from 'zod-openapi';
import { verifyToken, adminOnly, managerOrAdmin } from '../middlewares/auth';
import { validateBody, validateQuery, validateParams } from '../middlewares/validate';
import { registerOperation, registerTag, type HttpMethod } from './registry';
import { errorResponses } from './errors';

export type Role = 'ADMIN' | 'GESTOR';

export interface RouteConfig {
  summary: string;
  description?: string;
  tags?: string[];
  request?: {
    params?: ZodObject;
    query?: ZodObject;
    body?: ZodObject;
  };
  /** Success response body schema. */
  response: ZodType;
  /** Success status code (default 200). */
  status?: number;
  responseDescription?: string;
  /** When set, applies JWT auth and references the bearerAuth security scheme. */
  auth?: boolean;
  /** Restricts to roles. Implies auth. ADMIN → adminOnly; GESTOR → managerOrAdmin. */
  roles?: Role[];
  /** Error status codes to document (e.g. [400, 404]). Auth/role codes added automatically. */
  errors?: number[];
}

// Joins a base path and a route path into a normalized OpenAPI path:
// collapses duplicate slashes and strips the trailing slash (except for root).
function joinPath(base: string, route: string): string {
  const joined = `/${base}/${route}`.replace(/\/+/g, '/');
  return joined.length > 1 ? joined.replace(/\/$/, '') : joined;
}

function authMiddlewares(config: RouteConfig): RequestHandler[] {
  if (!config.auth && !config.roles) return [];
  const mw: RequestHandler[] = [verifyToken];
  if (config.roles?.includes('ADMIN') && !config.roles.includes('GESTOR')) {
    mw.push(adminOnly);
  } else if (config.roles?.length) {
    mw.push(managerOrAdmin);
  }
  return mw;
}

function buildOperation(config: RouteConfig): ZodOpenApiOperationObject {
  const requiresAuth = Boolean(config.auth || config.roles?.length);
  const autoErrors = requiresAuth ? [401, 403] : [];
  const errorCodes = [...new Set([...(config.errors ?? []), ...autoErrors])].sort();

  const requestParams: ZodOpenApiParameters = {};
  if (config.request?.params) requestParams.path = config.request.params;
  if (config.request?.query) requestParams.query = config.request.query;

  const operation: ZodOpenApiOperationObject = {
    summary: config.summary,
    ...(config.description && { description: config.description }),
    ...(config.tags && { tags: config.tags }),
    ...(Object.keys(requestParams).length && { requestParams }),
    ...(config.request?.body && {
      requestBody: {
        content: { 'application/json': { schema: config.request.body } },
      },
    }),
    responses: {
      [String(config.status ?? 200)]: {
        description: config.responseDescription ?? 'OK',
        content: { 'application/json': { schema: config.response } },
      },
      ...errorResponses(...errorCodes),
    },
    ...(requiresAuth && { security: [{ bearerAuth: [] }] }),
  };
  return operation;
}

export interface DocumentedRouter {
  router: Router;
  get(path: string, config: RouteConfig, handler: RequestHandler): void;
  post(path: string, config: RouteConfig, handler: RequestHandler): void;
  put(path: string, config: RouteConfig, handler: RequestHandler): void;
  patch(path: string, config: RouteConfig, handler: RequestHandler): void;
  delete(path: string, config: RouteConfig, handler: RequestHandler): void;
}

// Creates an Express router that also feeds the OpenAPI registry. Each verb call
// is the single declaration of a route: it mounts the handler (with auth and
// Zod validation middlewares) AND registers the OpenAPI operation.
//
// `basePath` is the path under the server URL (API_PREFIX), e.g. `/dashboard/seekers`.
export function documentedRouter(
  basePath: string,
  tag?: oas31.TagObject,
): DocumentedRouter {
  const router = Router();
  if (tag) registerTag(tag);

  function register(method: HttpMethod, path: string, config: RouteConfig, handler: RequestHandler): void {
    const middlewares: RequestHandler[] = [...authMiddlewares(config)];
    if (config.request?.params) middlewares.push(validateParams(config.request.params));
    if (config.request?.query) middlewares.push(validateQuery(config.request.query));
    if (config.request?.body) middlewares.push(validateBody(config.request.body));

    router[method](path, ...middlewares, handler);

    registerOperation({
      method,
      path: joinPath(basePath, path),
      operation: { ...buildOperation(config), ...(tag && !config.tags && { tags: [tag.name] }) },
    });
  }

  return {
    router,
    get: (path, config, handler) => register('get', path, config, handler),
    post: (path, config, handler) => register('post', path, config, handler),
    put: (path, config, handler) => register('put', path, config, handler),
    patch: (path, config, handler) => register('patch', path, config, handler),
    delete: (path, config, handler) => register('delete', path, config, handler),
  };
}

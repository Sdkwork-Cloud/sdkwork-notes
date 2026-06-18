import {
  createSdkworkAuthController,
  createSdkworkAuthService,
  type CreateSdkworkAuthControllerOptions,
  type CreateSdkworkAuthServiceOptions,
  type SdkworkAuthClient,
  type SdkworkAuthController,
  type SdkworkAuthService,
} from '@sdkwork/auth-pc-react';
import {
  clearAppSdkSessionTokens,
  getAppSdkClientWithSession,
  persistAppSdkSessionTokens,
  readAppSdkSessionTokens,
  resolveAppSdkAccessToken,
} from '@sdkwork/notes-core';

function bindSdkClientModule<TModule extends object | undefined>(module: TModule): TModule {
  if (!module) {
    return module;
  }

  const boundModule = Object.create(Object.getPrototypeOf(module));
  const ownDescriptors = Object.getOwnPropertyDescriptors(module);

  for (const key of Reflect.ownKeys(ownDescriptors)) {
    const descriptor = ownDescriptors[key as keyof typeof ownDescriptors];
    if (!descriptor) {
      continue;
    }

    Object.defineProperty(boundModule, key, {
      ...descriptor,
      value: typeof descriptor.value === 'function'
        ? descriptor.value.bind(module)
        : descriptor.value,
    });
  }

  let prototype: object | null = Object.getPrototypeOf(module);
  while (prototype && prototype !== Object.prototype) {
    for (const key of Reflect.ownKeys(prototype)) {
      if (key === 'constructor') {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(prototype, key);
      if (!descriptor || typeof descriptor.value !== 'function') {
        continue;
      }

      Object.defineProperty(boundModule, key, {
        ...descriptor,
        value: descriptor.value.bind(module),
      });
    }

    prototype = Object.getPrototypeOf(prototype);
  }

  return boundModule as TModule;
}

export function bindNotesAuthClient<TClient extends SdkworkAuthClient>(client: TClient): TClient {
  const boundClient = Object.create(Object.getPrototypeOf(client));
  Object.defineProperties(boundClient, Object.getOwnPropertyDescriptors(client));

  if (client.auth) {
    Object.defineProperty(boundClient, 'auth', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: bindSdkClientModule(client.auth),
    });
  }

  if ('user' in client && client.user && typeof client.user === 'object') {
    Object.defineProperty(boundClient, 'user', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: bindSdkClientModule(client.user as object),
    });
  }

  return boundClient as TClient;
}

function resolveBoundAuthClient(
  getClient?: CreateSdkworkAuthServiceOptions['getClient'],
): SdkworkAuthClient {
  const client = getClient
    ? getClient()
    : (getAppSdkClientWithSession() as unknown as SdkworkAuthClient);

  if (!client || typeof client !== 'object') {
    throw new Error('Notes auth client is unavailable on the current runtime.');
  }

  return bindNotesAuthClient(client);
}

export function createNotesAuthService(
  options: CreateSdkworkAuthServiceOptions = {},
): SdkworkAuthService {
  return createSdkworkAuthService({
    ...options,
    clearSession: options.clearSession ?? (() => clearAppSdkSessionTokens()),
    getClient: () => resolveBoundAuthClient(options.getClient),
    commitSession: options.commitSession ?? ((session) => {
      persistAppSdkSessionTokens({
        authToken: session.authToken,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
      return session;
    }),
    readSession: options.readSession ?? (() => readAppSdkSessionTokens()),
    resolveAccessToken: options.resolveAccessToken ?? (() => resolveAppSdkAccessToken()),
  });
}

export function createNotesAuthController(
  options: CreateSdkworkAuthControllerOptions = {},
): SdkworkAuthController {
  return createSdkworkAuthController({
    ...options,
    service: {
      ...createNotesAuthService(),
      ...(options.service ?? {}),
    },
  });
}

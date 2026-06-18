export interface ServiceAdapterController<T> {
  service: T;
  setAdapter: (adapter: T) => void;
  getAdapter: () => T;
  resetAdapter: () => void;
}

export function createServiceAdapterController<T>(localService: T): ServiceAdapterController<T> {
  let currentAdapter = localService;

  return {
    get service() {
      return new Proxy(localService as object, {
        get(_target, property) {
          return Reflect.get(currentAdapter as object, property);
        },
      }) as T;
    },
    setAdapter(adapter: T) {
      currentAdapter = adapter;
    },
    getAdapter() {
      return currentAdapter;
    },
    resetAdapter() {
      currentAdapter = localService;
    },
  };
}

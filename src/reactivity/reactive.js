import { shallowReadonlyHandlers } from 'baseHandlers';

export const reactiveMap = new WeakMap();
export const readonlyMap = new WeakMap();
export const shallowReadonlyMap = new WeakMap();

export const ReactiveFlags = {
  IS_REACTIVE: '__v_isReactive',
  IS_READONLY: '__v_isReadonly',
  RAW: '__v_raw'
};

export function shallowReadonly(target) {
  return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers);
}

function createReactiveObject(target, proxyMap, baseHandlers) {
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, baseHandlers);

  proxyMap.set(target, proxy);
  return proxy;
}

export function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers);
}

export function readonly(target) {
  return createReactiveObject(target, readonlyMap, readonlyHandlers);
}

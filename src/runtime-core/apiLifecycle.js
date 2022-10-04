import {
  currentInstance,
  setCurrentInstance,
  unsetCurrentInstance,
  LifecycleHooks
} from './component';
import { callWithAsyncErrorHandling } from './errorHandling';
import { pauseTracking, resetTracking } from '../reactivity/effect';

export function injectHook(type, hook, target, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);

    const wrappedHook =
      hook.__weh ||
      (hook.__weh = (...args) => {
        if (target.isUnmounted) {
          return;
        }

        pauseTracking();

        setCurrentInstance(target);
        const res = callWithAsyncErrorHandling(hook, target, type, args);
        unsetCurrentInstance();
        resetTracking();

        return res;
      });

    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }

    return wrappedHook;
  }
}

const createHook =
  (lifecycle) =>
  (hook, target = currentInstance) =>
    injectHook(lifecycle, (...args) => hook(...args), target);

export const onBeforeMount = createHook(LifecycleHooks.BEFORE_MOUNT);
export const onMounted = createHook(LifecycleHooks.MOUNTED);
export const onBeforeUpdate = createHook(LifecycleHooks.BEFORE_UPDATE);
export const onUpdated = createHook(LifecycleHooks.UPDATED);
export const onBeforeUnmount = createHook(LifecycleHooks.BEFORE_UNMOUNT);
export const onUnmounted = createHook(LifecycleHooks.UNMOUNTED);
export const onServerPrefetch = createHook(LifecycleHooks.SERVER_PREFETCH);

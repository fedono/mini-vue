import { extend } from '../shared';
import { createDep } from './dep';

let activeEffect = void 0;
let shouldTrack = false;
const targetMap = new WeakMap();

export class ReactiveEffect {
  active = true;
  deps = [];
  onStop;
  constructor(fn, scheduler) {
    this.fn = fn;
  }

  run() {
    if (!this.active) {
      return this.fn();
    }

    shouldTrack = true;
    activeEffect = this;
    const result = this.fn();
    shouldTrack = false;
    activeEffect = undefined;

    return result;
  }

  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }

      this.active = false;
    }
  }
}

function cleanupEffect(effect) {
  effect.deps.forEach((dep) => {
    dep.delete(effect);
  });

  effect.deps.length = 0;
}

export function effect(fn, options = {}) {
  const _effect = new ReactiveEffect(fn);

  extend(_effect, options);
  _effect.run();

  const runner = _effect.run.bind(_effect);
  runner.effect = _effect;
  return runner;
}

export function track(target, type, key) {
  if (!isTracking()) {
    return;
  }

  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }

  let dep = depsMap.get(key);

  if (!dep) {
    dep = createDep();

    depsMap.set(key, dep);
  }

  trackEffects(dep);
}

export function trackEffects(dep) {
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}

export function trigger(target, type, key) {
  let deps = [];

  const depsMap = targetMap.get(target);

  if (!depsMap) return;

  const dep = depsMap.get(key);

  deps.push(dep);

  const effects = [];
  deps.forEach((dep) => {
    effects.push(...dep);
  });

  triggerEffects(createDep(effects));
}

export function triggerEffects(dep) {
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler();
    } else {
      effect.run();
    }
  }
}

function isTracking() {
  return shouldTrack && activeEffect !== undefined;
}

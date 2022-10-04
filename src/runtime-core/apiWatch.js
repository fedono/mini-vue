import { ReactiveEffect } from '../reactivity/effect';
import { queuePreFlushCb } from './scheduler';

export function watchEffect(effect) {
  doWatch(effect);
}

function doWatch(source) {
  const job = () => {
    effect.run();
  };

  const scheduler = () => queuePreFlushCb(job);

  const getter = () => {
    source();
  };

  const effect = new ReactiveEffect(getter, scheduler);

  effect.run();
}

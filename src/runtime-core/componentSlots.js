import { ShapeFlogs } from '../shared';

export function initSlots(instance, children) {
  const { vnode } = instance;

  if (vnode.shapeFlag & ShapeFlogs.SLOTS_CHILDREN) {
    normalizeObjectSlots(children, (instance.slots = {}));
  }
}

const normalizeSlotValue = (value) => {
  return Array.isArray(value) ? value : [value];
};

const normalizeObjectSlots = (rawSlots, slots) => {
  for (const key in rawSlots) {
    const value = rawSlots[key];
    if (typeof value === 'function') {
      slots[key] = (props) => normalizeSlotValue(value(props));
    }
  }
};

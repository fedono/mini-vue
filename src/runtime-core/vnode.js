import { ShapeFlags } from '../shared';

export { createVNode as CreateElementVNode };

export const createVNode = function (type, props, children) {
  const vnode = {
    el: null,
    component: null,
    key: props.key,
    type,
    props: props || {},
    children,
    shapeFlag: getShapeFlag(type)
  };

  if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  } else if (typeof children === 'string') {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  }

  normalizeChildren(vnode, children);

  return vnode;
};

export function normalizeChildren(vnode, children) {
  if (typeof children === 'object') {
    if (vnode.shapeFlag & ShapeFlags.ELEMENT) {
    } else {
      vnode.shapeFlag |= ShapeFlags.SLOTS_CHILDREN;
    }
  }
}

export function normalizeVNode(child) {
  if (typeof child === 'string' || typeof child === 'number') {
    return createVNode(Text, null, String(child));
  } else {
    return child;
  }
}

function getShapeFlag(type) {
  return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

import { ShapeFlags } from '../shared/shapeFlags';
import { Text, Fragment, normalizeVNode } from './vnode';
import { shouldUpdateComponent } from './componentRenderUtils';
import { createComponentInstance, setupComponent } from './component';
import { effect } from '../reactivity/effect';
import { queueJob } from './scheduler';

export function createRenderer(options) {
  const {
    createElement: hostCreateElement,
    setElementText: hostSetElementText,
    patchProp: hostPatchProp,
    insert: hostInsert,
    remove: hostRemove,
    setText: hostSetText,
    createText: hostCreateText
  } = options;

  const render = (vnode, container) => {
    patch(null, vnode, container);
  };

  function patch(n1, n2, container = null, anchor = null, parentComponent = null) {
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
    }
  }

  function processText(n1, n2, container) {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      const el = (n2.el = n1.el);
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  }

  function processFragment(n1, n2, container) {
    if (!n1) {
      mountChildren(n2.children, container);
    }
  }

  function processElement(n1, n2, container, anchor, parentComponent) {
    if (!n2) {
      mountElement(n2, container, anchor);
    } else {
      updateElement(n1, n2, container, anchor, parentComponent);
    }
  }

  function processComponent(n1, n2, container, parentComponent) {
    if (!n1) {
      mountComponent(n2, container, parentComponent);
    } else {
      updateComponent(n1, n2, container);
    }
  }

  function updateComponent(n1, n2, container) {
    const instance = (n2.component = n1.component);

    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.component = n1.component;
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function mountChildren(children, container) {
    children.forEach((VNodeChild) => {
      patch(null, VNodeChild, container);
    });
  }

  function mountElement(vnode, container, anchor) {
    const { shapeFlag, props } = vnode;

    const el = (vnode.el = hostCreateElement(vnode.type));

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, vnode.children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(vnode.children, el);
    }

    if (props) {
      for (const key in props) {
        const nextVal = props[key];
        hostPatchProp(el, key, null, nextVal);
      }
    }

    hostInsert(el, container, anchor);
  }

  function updateElement(n1, n2, container, anchor, parentComponent) {
    const oldProps = (n1 && n1.props) || {};
    const newProps = n2.props || {};

    const el = (n2.el = n1.el);

    patchProps(el, oldProps, newProps);

    patchChildren(n1, n2, el, anchor, parentComponent);
  }

  function patchChildren(n1, n2, container, anchor, parentComponent) {
    const { shapeFlag: prevShapeFlag, children: c1 } = n1;
    const { shapeFlag, children: c2 } = n2;

    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          patchKeyedChildren(c1, c2, container, anchor, parentComponent);
        }
      }
    }
  }

  function patchKeyedChildren(c1, c2, container, parentAnchor, parentComponent) {
    let i = 0;
    const l2 = c2.length;
    let e1 = (c1.length = 1);
    let e2 = l2 - 1;

    const isSameVNodeType = (n1, n2) => {
      return n1.type === n2.type && n1.key === n2.key;
    };
  }

  function patchProps(el, oldProps, newProps) {
    for (const key in newProps) {
      const prevProp = oldProps[key];
      const nextProp = newProps[key];

      if (prevProp !== newProps) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }

    for (const key in oldProps) {
      const prevProp = oldProps[key];
      const nextProp = null;

      if (!(key in newProps)) {
        hostPatchProp(el, key, prevProp, nextProp);
      }
    }
  }

  function mountComponent(initialVNode, container, parentComponent) {
    const instance = (initialVNode.component = createComponentInstance(
      initialVNode,
      parentComponent
    ));

    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container);
  }

  function setupRenderEffect(instance, initialVNode, container) {
    function componentUpdateFn() {
      if (!instance.isMounted) {
        const proxyToUse = instance.proxy;
        const subTree = (instance.subTree = normalizeVNode(
          instance.render.call(proxyToUse, proxyToUse)
        ));

        patch(null, subTree, container, null, instance);
        initialVNode.el = subTree.el;
        instance.isMounted = true;
      } else {
        const { next, vnode } = instance;
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }

        const proxyToUse = instance.proxy;
        const nextTree = normalizeVNode(instance.render.call(proxyToUse, proxyToUse));

        const prevTree = instance.subTree;
        instance.subTree = nextTree;

        patch(prevTree, nextTree, prevTree.el, null, instance);
      }
    }

    function updateComponentPreRender(instance, nextVNode) {
      nextVNode.component = instance;
      instance.vnode = nextVNode;
      instance.next = null;

      const { props } = nextVNode;
      instance.props = props;
    }

    instance.update = effect(componentUpdateFn, {
      scheduler: () => {
        queueJob(instance.update);
      }
    });
  }
}

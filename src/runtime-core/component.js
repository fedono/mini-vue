import { emit } from './componentEmits';
import { initProps } from './componentProps';
import { initSlots } from 'componentSlots';
import { PublicInstanceProxyHandlers } from './PublicInstanceProxyHandlers';
import { proxyRefs } from '../reactivity/ref';

export function createComponentInstance(vnode, parent) {
  const instance = {
    type: vnode.type,
    vnode,
    next: null,
    props: {},
    parent,
    provides: parent ? parent.provides : {},
    proxy: null,
    isMounted: false,
    attrs: {},
    slots: {},
    ctx: {},
    setupState: {},
    emit: () => {}
  };

  instance.ctx = {
    _: instance
  };

  instance.emit = emit.bind(null, instance);

  return instance;
}

export function setupComponent(instance) {
  const { props, children } = instance.vnode;

  initProps(instance, props);
  initSlots(instance, children);

  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);

  const Component = instance.type;

  const { setup } = Component;
  if (setup) {
    setCurrentInstance(instance);

    const setupContext = createSetupContext(instance);
    const setupResult = setup && setup(shallowReadonly(instance.props), setupContext);

    setCurrentInstance(null);

    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  if (typeof setupResult === 'function') {
    //     qs 怎么 instance.render 会等于 setup 的 result
    instance.render = setupResult;
  } else if (typeof setupResult === 'object') {
    instance.setupState = proxyRefs(setupResult);
  }

  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;

  if (!instance.render) {
    if (compile && !Component.render) {
      if (Component.template) {
        const template = Component.template;
        Component.render = compile(template);
      }
    }

    instance.render = Component.render;
  }
}

function createSetupContext(instance) {
  return {
    attrs: instance.attrs,
    slots: instance.slots,
    emit: instance.emit,
    expose: () => {}
  };
}

let currentInstance = {};
export function getCurrentInstance() {
  return currentInstance;
}
export function setCurrentInstance(instance) {
  currentInstance = instance;
}

let compile;
export function registerRuntimeCompiler(_compile) {
  compile = _compile;
}

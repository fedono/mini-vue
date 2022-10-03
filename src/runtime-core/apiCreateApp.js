import { createVNode } from './vnode';

export function createAppApi(render) {
  return function createApp(rootComponent) {
    const app = {
      _component: rootComponent,
      mount(rootContainer) {
        /*
         * imp 之前一直不知道是如何使用 vue 的 parse 的时候，现在看来是知道了，在这里使用 createVNode 的时候会
         *  调用 parse
         *   其实也不是调用 parse，而是调用 compiler-sfc 解析整个 vue 文件，然后里面获取到模板的时候，会通过 parse 来解析模板
         *
         * 看了一下代码，好像不是
         * */
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer);
      }
    };

    return app;
  };
}

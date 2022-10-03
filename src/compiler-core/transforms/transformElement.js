import { createVNodeCall, NodeTypes } from '../ast';

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    return () => {
      const vnodeTag = `'${node.tag}'`;
      const vnodeProps = null;
      let vnodeChildren = null;

      /*
       * TODO 为什么要处理一个的情况
       * */
      if (node.children.length > 0) {
        if (node.children.length === 1) {
          const child = node.children[0];
          vnodeChildren = child;
        }
      }

      // 创建一个新的 node 用于 codegen 的时候调用
      node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
    };
  }
}

import { NodeTypes } from '../ast';
import { isText } from '../utils';

export function transformText(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    /*
     * 在 exit 的时候执行
     * 下面的逻辑会改变 ast 树
     * 有些逻辑是需要在改变之前做处理的
     * */
    return () => {
      /*
       * hi, {{msg}}
       * 上面的模块会生成两个节点，一个是 text，一个是 interpolation
       * 那么，生成的 render 函数为 "hi, " + _toDisplayString(_ctx.msg)
       * 这里有一个 + 的操作符
       *
       * 检测当前节点是 text 且下一个节点是 interpolation，那么这里就会创建一个 COMPOUND 类型
       * 这个类型会把 text / interpolation 两个包裹起来
       * */
      const children = node.children;
      let currentContainer;

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        // 当前节点是 text
        if (isText(child)) {
          for (let j = i + 1; j < children; j++) {
            const next = children[j];
            // 下一个节点是否是 interpolation 类型（isText 会包含 text 和 interpolation 两种类型的检测）
            if (isText(next)) {
              if (!currentContainer) {
                currentContainer = children[i] = {
                  type: NodeTypes.COMPOUND_EXPRESSION,
                  loc: child.loc,
                  children: [child]
                };
              }

              currentContainer.children.push(` + `, next);
              children.splice(j, 1);
              // 因为两个类型合并了，所以就少了一个元素，那么这里需要 j--
              j--;
            } else {
              currentContainer = undefined;
              break;
            }
          }
        }
      }
    };
  }
}

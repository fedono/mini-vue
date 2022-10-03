import { NodeTypes } from './ast';
import { TO_DISPLAY_STRING } from './runtimeHelpers';

export function transform(root, options) {
  const context = createTransformContext(root, options);

  traverseNode(root, context);

  createRootCodegen(root, context);

  // qs 为什么这里只是把 helpers.keys 放进来
  root.helpers.push(...context.helpers.keys());
}

function createRootCodegen(root, context) {
  const { children } = root;
  const child = children[0];

  /*
   * codegenNode 是为了 codegen 准备的，为的是和 ast 的 node 分离开
   * */
  if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
    const codegenNode = child.codegenNode;
    root.codegenNode = codegenNode;
  } else {
    root.codegenNode = child;
  }
}

// todo 没搞明白这个是干嘛的
function traverseNode(node, context) {
  const type = node.type;

  const nodeTransforms = context.nodeTransforms;
  const exitFns = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const transform = nodeTransforms[i];

    const onExit = transform(node, context);
    if (onExit) {
      exitFns.push(onExit);
    }
  }

  switch (type) {
    case NodeTypes.INTERPOLATION: // 处理 {{name}} 的情况
      context.helper(TO_DISPLAY_STRING);
      break;

    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
      traverseChildren(node, context);
      break;

    default:
      break;
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function traverseChildren(parent, context) {
  parent.children.forEach((node) => traverseNode(node, context));
}

function createTransformContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [], // 是不是这里就是所有的 node 的操作
    helpers: new Map(),
    helper(name) {
      const count = context.helpers.get(name) || 0;
      context.helpers.set(name, count + 1);
    }
  };
}

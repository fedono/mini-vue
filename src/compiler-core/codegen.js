import { helperNameMap } from './runtimeHelpers';
import { NodeTypes } from './ast';
import { isString } from './utils';

export function generate(ast, options = {}) {
  const context = createCodegenContext(ast, options);
  const { push, mode } = context;

  if (mode === 'module') {
    // preamble: （法规、契约的）序言，绪论；前言，开场白
    genModulePreamble(ast, context);
  } else {
    genFunctionPreamble(ast, context);
  }

  const functionName = 'render';

  const args = ['_ctx'];
  const signature = args.join(', ');
  push(`function ${functionName}(${signature}) {`);
  push('return ');
  genNode(ast.codegenNode, context);
  push('}');

  return {
    code: context.code
  };
}

/*
 * 生成代码的规则就是读取 node，染回基于不同的 node 来生成对应的代码块
 * 最后把代码块拼接到一起
 * */
function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
      genElement(node, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    default:
      break;
  }
}

function genCompoundExpression(node, context) {
  const { push } = context;
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (isString(child)) {
      push(child);
    } else {
      genNode(child, context);
    }
  }
}

function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(')');
}

function genExpression(node, context) {
  context.push(node.content, node);
}

function genElement(node, context) {
  const { push, helper } = context;
  const { tag, props, children } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  genNodeList(genNullableArgs([tag, props, children]), context);
  push(`)`);
}

function genNullableArgs(args) {
  /*
   * 把末尾为 null 的都删除掉
   * vue3 代码中，后面可能会包含 patchFlag, dynamicProps 等编译优化的信息
   * 而这些信息可能是不存在的，所以在这边的时候需要删除掉
   * */
  let i = args.length;
  while (i--) {
    if (args[i] !== null) break;
  }

  // 把为 falsy 的值都替换为 'null'
  return args.slice(0, i + 1).map((arg) => arg || 'null');
}

function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(`${node}`);
    } else {
      genNode(node, context);
    }

    // node 与 node 直接需要加上逗号，
    if (i < nodes.length - 1) {
      push(', ');
    }
  }
}

function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

function genFunctionPreamble(ast, context) {
  const { runtimeGlobalName, push, newline } = context;
  const VueBinding = runtimeGlobalName;

  const aliasHelper = (s) => `${helperNameMap[s]} : _${helperNameMap[s]}`;

  if (ast.helpers.length > 0) {
    /*
     * 从 vue 中引入一些需要使用到的帮助函数
     * */
    push(
      `
        const { ${ast.helpers.map(aliasHelper).join(', ')}} = ${VueBinding}
      `
    );
  }

  newline();
  push(`return `);
}

function genModulePreamble(ast, context) {
  const { push, newline, runtimeModuleName } = context;

  if (ast.helpers.length) {
    /*
     * 比如 ast.helpers 里面有个 [toDisplayString]
     * 那么生成之后就是 import { toDisplayString as _toDisplaySting } from 'vue'
     * */
    const code = `import {${ast.helpers
      .map((s) => `${helperNameMap[s]} as _${helperNameMap[s]}`)
      .join(', ')} } from  ${JSON.stringify(runtimeModuleName)}`;

    push(code);
  }

  newline();
  push(`export `);
}

function createCodegenContext(
  ast,
  { runtimeModuleName = 'vue', runtimeGlobalName = 'Vue', mode = 'function' }
) {
  const context = {
    code: '',
    mode,
    runtimeModuleName,
    runtimeGlobalName,
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
    push(code) {
      context.code += code;
    },
    newline() {
      context.code += '\n';
    }
  };

  return context;
}

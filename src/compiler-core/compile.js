import { baseParse } from './parse';
import { transform } from './transform';
import { generate } from './codegen';
import { transformText } from './transforms/transformText';
import { transformElement } from './transforms/transformElement';
import { transformExpression } from './transforms/transformExpression';

export function baseCompile(template, options = {}) {
  const ast = baseParse(template);

  transform(
    ast,
    Object.assign(options, {
      nodeTransforms: [transformElement, transformText, transformExpression]
    })
  );

  // todo 感觉这里还是没有生成实际的代码，还得看看解析文章怎么说的
  return generate(ast);
}

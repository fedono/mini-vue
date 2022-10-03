import { NodeTypes, TagType, ElementTypes } from './ast';

export function baseParse(content) {
  const context = createParseContext(content);
  return createRoot(parseChildren(context, []));
}

function createParseContext(content) {
  return {
    source: content
  };
}

function parseChildren(context, ancestors) {
  const nodes = [];

  while (!isEnd(context, ancestors)) {
    let node;
    const s = context.source;

    // 解析变量
    if (startsWith(s, '{{')) {
      node = parseInterpolation(context);
    }
    // 开始解析 html 标签
    else if (s[0] === '<') {
      if (s[1] === '/') {
        // 匹配到了结束的 tag
        if (/[a-z]/i.test(s[2])) {
          parseTag(context, TagType.End);

          continue;
        }
      }
      // 匹配到开始的 tag
      else if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors);
      }
    }

    // 匹配纯文本
    /*
     * 如果纯文本里面有标签或者{{ 那么只解析里面的纯文本，匹配到了 标签和变量会继续当前的 while 循环走下去匹配
     * */
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function parseText(context) {
  /*
   * 比如内容中含有 hello</div>
   * 那么 endIndex 需要停在 < 这里了，然后 slice(0, endIndex) 就能够获取到 hello 了
   * */
  const endTokens = ['<', '{{'];
  let endIndex = context.source.length;

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    /*
     * 比如内容中含有 hi, {{124}} ，那么 endIndex 就需要停在第一个 { 这里
     * */
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

  return {
    type: NodeTypes.TEXT,
    content
  };
}

function parseElement(context, ancestors) {
  const element = parseTag(context, TagType.Start);

  ancestors.push(element);
  const children = parseChildren(context, ancestors);
  ancestors.pop();

  // 检测 endTag 和 startTag 是不是一致
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw new Error(`缺少结束标签：${element.tag}`);
  }

  element.children = children;

  return element;
}

function parseTag(context, type) {
  const match = /^<\/?([a-z][^\r\n\t\f />]*)/i.exec(context.source);
  // 匹配到 </div> 中的 div
  const tag = match[1];

  advanceBy(context, match[0].length);

  // 上面advanceBy 了 div 的长度，那么 </div> 中 div 后面的 > 再走一下，这样就要再走一位了
  advanceBy(context, 1);

  if (type === TagType.End) return;

  let tagType = ElementTypes.ELEMENT;

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType
  };
}

function parseInterpolation(context) {
  const openDelimiter = '{{';
  const closeDelimiter = '}}';

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);

  advanceBy(context, 2);

  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);

  const preTrimContent = parseTextData(context, rawContent.length);
  const content = preTrimContent.trim();

  advanceBy(context, closeDelimiter.length);

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content
    }
  };
}

function parseTextData(context, length) {
  const rawText = context.source.slice(0, length);
  advanceBy(context, length);
  return rawText;
}

function advanceBy(context, numberOfCharacters) {
  context.source = context.source.slice(numberOfCharacters);
}

function isEnd(context, ancestors) {
  const s = context.source;
  if (context.source.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; --i) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }

  // 没有值就是解析完成了
  return !context.source;
}

function startsWithEndTagOpen(source, tag) {
  return (
    startsWith(source, '</') && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function startsWith(source, searchString) {
  return source.startsWith(searchString);
}

function createRoot(children) {
  return {
    type: NodeTypes.ROOT,
    children,
    helpers: []
  };
}

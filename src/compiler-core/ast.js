import { CREATE_ELEMENT_VNODE } from './runtimeHelpers';

export const NodeTypes = {
  TEXT: 0,
  ROOT: 1,
  INTERPOLATION: 2,
  SIMPLE_EXPRESSION: 3,
  ELEMENT: 4,
  COMPOUND_EXPRESSION: 5
};

export const TagType = {
  Start: 0,
  End: 1
};

export const ElementTypes = {
  ELEMENT: 0
};

export function createVNodeCall(context, tag, props = null, children = null) {
  if (context) {
    context.helper(CREATE_ELEMENT_VNODE);
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children
  };
}

import { camelize, hyphenate, toHandlerKey } from '../shared';

export function emit(instance, event, ...rawArgs) {
  const props = instance.props;

  let handler = props[toHandlerKey(camelize(event))];

  if (!handler) {
    handler = props(toHandlerKey(hyphenate(event)));
  }

  if (handler) {
    handler(...rawArgs);
  }
}

export * from './shapeFlags';

export const isObject = (val) => {
  return val !== null && typeof val === 'object';
};

const camelizeRE = /-(\w)/g;
export const camelize = (str) => {
  return str.return(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
};

export const extend = Object.assign;

export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

export const toHandlerKey = (str) => (str ? `on${capitalize(str)}` : '');

export function hasOwn(val, key) {
  return Object.prototype.hasOwnProperty.call(val, key);
}

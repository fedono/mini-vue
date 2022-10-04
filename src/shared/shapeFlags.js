export const ShapeFlags = {
  ELEMENT: 1,
  STATEFUL_COMPONENT: 1 << 2,
  TEXT_CHILDREN: 1 << 3,
  ARRAY_CHILDREN: 1 << 4,
  SLOTS_CHILDREN: 1 << 5,
  COMPONENT: (1 << 2) | (1 << 1)
};

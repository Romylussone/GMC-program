let sequence = 0;
export const createId = (prefix) => `${prefix}-${++sequence}`;

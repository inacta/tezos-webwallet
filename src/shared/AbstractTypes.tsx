// This allows us to create a dictionary-like type
export type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U;
};

// This allows us to create a dictionary-like type
export type EnumDictionary<T extends string | symbol | number, U> = {
  [K in T]: U;
};

export type StringDictionary<U> = {
  [id in string]: U;
};

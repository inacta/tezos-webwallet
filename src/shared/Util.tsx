export function convertMap(map: Map<string, string>): Record<string, string> {
  return [...map.entries()].reduce((obj: Record<string, string>, [key, value]) => {
    obj[key] = value;
    return obj;
  }, {});
}

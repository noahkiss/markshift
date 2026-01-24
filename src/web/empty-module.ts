// Empty module to replace linkedom in browser builds
// linkedom is Node-only; browser uses native DOMParser
export const parseHTML = (): never => {
  throw new Error('parseHTML is not available in browser. Use DOMParser.');
};
export default {};

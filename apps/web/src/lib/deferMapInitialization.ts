// React Strict Mode immediately cleans up its first effect setup. Defer costly
// WebGL/provider work so that cancelled setup never creates a map or requests tiles.
export const deferMapInitialization = (
  initialize: () => (() => void) | void,
): (() => void) => {
  let dispose: (() => void) | void;
  const startup = setTimeout(() => { dispose = initialize(); }, 0);

  return () => {
    clearTimeout(startup);
    dispose?.();
  };
};

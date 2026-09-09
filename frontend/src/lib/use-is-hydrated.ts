import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// True once the client has hydrated. Needed anywhere a decision (like an
// auth redirect) must wait for a client-only value (e.g. localStorage) to
// resolve, instead of acting on the server's placeholder render.
export function useIsHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

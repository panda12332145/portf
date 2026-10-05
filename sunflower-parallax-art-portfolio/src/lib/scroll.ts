import { createContext, useContext } from "react";

export interface ScrollController {
  scrollTo: (target: string) => void;
}

export const ScrollContext = createContext<ScrollController>({
  scrollTo: () => {},
});

export const useScrollTo = () => useContext(ScrollContext);

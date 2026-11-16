import { createContext, useContext } from 'react';

// Pages in the back stack stay mounted but hidden. This says whether the page reading it is the visible one.
export const PageActiveContext = createContext(true);
export const usePageActive = () => useContext(PageActiveContext);

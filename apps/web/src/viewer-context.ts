import { createContext, useContext } from 'react';
import type { LedraBundle } from '@ledra/types';

export type ViewerContextValue = {
  bundle: LedraBundle;
  bundlePath: string;
};

const ViewerContext = createContext<ViewerContextValue | null>(null);

export const ViewerProvider = ViewerContext.Provider;

export const useViewerContext = (): ViewerContextValue => {
  const value = useContext(ViewerContext);
  if (!value) {
    throw new Error('Viewer context is not available.');
  }

  return value;
};

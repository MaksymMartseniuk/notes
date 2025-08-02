import { createContext, useContext, useState } from "react";

const AutoSaveContext = createContext(undefined);

export function AutoSaveProvider({ children }) {
  const [checkUpdateAutoSave, setCheckUpdateAutoSave] = useState(false);

  return (
    <AutoSaveContext.Provider
      value={{ checkUpdateAutoSave, setCheckUpdateAutoSave }}
    >
      {children}
    </AutoSaveContext.Provider>
  );
}

export function useAutoSave() {
  const context = useContext(AutoSaveContext);
  if (context === undefined) {
    throw new Error("useAutoSave must be used within an AutoSaveProvider");
  }
  return context;
}

import { useRef, useState, useCallback } from "react";

export default function useNoteBuffer({ initialData = {} }) {
  const buffer = useRef(initialData);
  const [isDirty, setIsDirty] = useState(false);

  const updateBuffer = useCallback((updates) => {
    buffer.current = {
      ...buffer.current,
      ...updates,
    };
    console.log("Поточний буфер:", buffer.current);
    setIsDirty(true);
  }, []);

  const getBufferData = useCallback(() => {
    return buffer.current;
  }, []);

  const markSaved = useCallback(() => {
    setIsDirty(false);
  }, []);

  return {
    updateBuffer,
    getBufferData,
    isDirty,
    markSaved,
  };
}

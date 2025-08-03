import { createContext, useContext } from "react";

const NoteAccessContext = createContext({ isReadOnly: false });

export const useNoteAccess = () => useContext(NoteAccessContext);

export default NoteAccessContext;

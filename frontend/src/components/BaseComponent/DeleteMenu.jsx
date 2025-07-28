import { useRef, useEffect } from "react";

export default function DeleteMenu({
  position,
  deletedNotes,
  onClose,
  onRestore,
  onNavigate,
}) {
  const deleteMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        deleteMenuRef.current &&
        !deleteMenuRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      className="delete-menu"
      ref={deleteMenuRef}
      style={{
        top: position.top - 200,
        left: position.left + 200,
      }}
    >
      <p className="delete-menu-header">Deleted notes</p>

      <div className="delete-menu-scroll-container">
        <ul className="delete-menu-list">
          {deletedNotes.map((note) => (
            <span key={note.uuid} className="delete-menu-list-item-wrapper">
              <li
                className="delete-menu-list-item"
                onClick={() => {
                  onNavigate(note.uuid);
                  onClose();
                }}
              >
                {note.title.length > 20
                  ? note.title.slice(0, 20) + "…"
                  : note.title}
              </li>
              <button
                className="delete-menu-restore-button"
                onClick={() => onRestore(note.uuid)}
              >
                Restore
              </button>
            </span>
          ))}
        </ul>
      </div>
    </div>
  );
}

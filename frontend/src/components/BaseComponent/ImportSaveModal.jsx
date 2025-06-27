import { useEffect, useRef } from "react";

export default function ImportSaveModal({ onClose, position }) {
  const importSaveModalRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        importSaveModalRef.current &&
        !importSaveModalRef.current.contains(event.target)
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
      ref={importSaveModalRef}
      className="import-save-modal"
      style={{
        top: `${position.top + 10}px`,
        left: `${position.left - 110}px`,
      }}
    >
      <ul className="import-save-list">
        <li className="import-save-list-item">Import in World</li>
        <li className="import-save-list-item">Import in PDF</li>
        <li className="import-save-list-item">Save</li>
      </ul>
    </div>
  );
}

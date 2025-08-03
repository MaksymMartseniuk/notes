import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function VersionNote({
  position,
  versions,
  selectedUuid,
  onClose,
}) {
  const navigate = useNavigate();
  const versionNoteRef = useRef(null);
  useEffect(() => {
    const handleClickOutSide = (event) => {
      if (versionNoteRef.current && !versionNoteRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutSide);
    return () => {
      document.removeEventListener("mousedown", handleClickOutSide);
    };
  }, [onClose]);

  return (
    <div
      className="popover-version-window"
      ref={versionNoteRef}
      style={{
        top: position.top + 10,
        left: position.left - 220,
      }}
    >
      <h1>Версії нотатки</h1>
      <ul className="version-list">
        {versions.map((version) => (
          <li
            className="version-list-item"
            key={version.id}
            onClick={() => {
              navigate(`/notes/${selectedUuid}/versions/${version.id}`);
              onClose();
            }}
          >
            {new Date(version.created_at).toLocaleDateString()} -{" "}
            {version.title.length > 20
              ? version.title.slice(0, 20) + "…"
              : version.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

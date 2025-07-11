import React from "react";
import { useNavigate } from "react-router-dom";

export default function VersionNote({
  position,
  versions,
  selectedUuid,
  onClose,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="popover-version-window"
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
            {new Date(version.created_at).toLocaleDateString()} -
            {" "}
            {version.title.length > 20
              ? version.title.slice(0, 20) + "…"
              : version.title}
          </li>
        ))}
      </ul>
      <button onClick={onClose}>Закрити</button>
    </div>
  );
}

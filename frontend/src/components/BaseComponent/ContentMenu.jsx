import React, { useEffect, useRef,useState } from "react";

export default function ContentMenu({
  position,
  selectedUuid,
  onClose,
  onDelete,
  setOpenTagModal
}) {
  const contentMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contentMenuRef.current &&
        !contentMenuRef.current.contains(event.target)
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
      className="content-menu"
      ref={contentMenuRef}
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      <ul className="content-menu-list">
        <li
          className="content-menu-list-item"
          onClick={() => onDelete(selectedUuid)}
        >
          Delete
        </li>
        <li className="content-menu-list-item"
          onClick={()=>{setOpenTagModal(true)
            
          }}>
          Tag
        </li>
      </ul>
    </div>
  );
}

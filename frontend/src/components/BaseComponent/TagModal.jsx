import { useEffect, useState } from "react";
import "../../styles/TagModal.css";
import api from "../../api";
import { ACCESS_TOKEN } from "../../constants";
export default function TagModal({ onClose, selectedUuid }) {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const handleAddTag = async () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.some((tag) => tag.name === trimmed)) {
      try {
        const res = await api.post(
          `notes-api/notes/${selectedUuid}/tags/`,
          { name: trimmed },
          {
            headers: {
              Authorization: `Bearer ${ACCESS_TOKEN}`,
            },
          }
        );

        setTags([...tags, res.data]);
        setTagInput("");
      } catch (error) {
        console.error("Failed to add tag", error);
      }
    }
  };

  const handleDeleteTag = async (tagToDelete) => {
    try {
      await api.delete(`notes-api/notes/${selectedUuid}/tags/`, {
        data: { name: tagToDelete.name },
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      });

      setTags(tags.filter((tag) => tag.name !== tagToDelete.name));
    } catch (error) {
      console.error("Failed to delete tag", error);
    }
  };



  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await api.get(`notes-api/notes/${selectedUuid}/tags/`, {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
        });
        setTags(res.data);
      } catch (error) {
        console.error("Failed to fetch tags", error);
      }
    };

    fetchTags();
  }, [selectedUuid]);

  return (
    <>
      <div className="overlay-blur" onClick={onClose}></div>
      <div className="tag-menu">
        <div className="tag-control">
          <input
            type="text"
            placeholder="Tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            maxLength={100}
          />
          <button onClick={handleAddTag}>Add</button>
        </div>
        <div className="tag-list">
          {tags.map((tag) => (
            <div key={tag.id} className="tag-item">
              <span>{tag.name}</span>
              <button onClick={() => handleDeleteTag(tag)}>×</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

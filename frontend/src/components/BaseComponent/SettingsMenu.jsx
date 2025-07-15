import { useState } from "react";
import {X} from "lucide-react";
import "../../styles/settings.css"
import SettingsProfile from "./settings/SettingsProfile";
import SettingsAutoSave from "./settings/SettingsAutoSave";
import SettingsSupport from './settings/SettingsSupport';

export default function SettingsMenu({ onClose }) {
  const [activeSection, setActiveSection] = useState("Profile");
  const renderContent = () => {
    switch (activeSection) {
      case "Profile":
        return <SettingsProfile/>
      case "AutoSave":
        return <SettingsAutoSave/>
      case "Help & Support":
        return <SettingsSupport/>
      default:
        return null;
    }
  };
  return (
    <>
      <div className="overlay-blur" onClick={onClose}></div>
      <div className="settings-menu">
        <div className="setting-menu-side-bar">
          <div className="setting-menu-container-header">
          <h2 className="setting-menu-header">Settings</h2>
          <X className="setting-close" onClick={onClose}></X>
          </div>
          <ul className="setting-menu-list">
            {["Profile", "AutoSave", "Help & Support"].map((item) => (
              <li
                key={item}
                className={`setting-menu-list-item ${activeSection === item ? "active" : ""}`}
                onClick={() => setActiveSection(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="setting-menu-content">
          {renderContent()}
        </div>
      </div>
    </>
  );
}

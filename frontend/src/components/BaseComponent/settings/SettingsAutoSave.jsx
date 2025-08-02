import { useState, useEffect } from "react";
import api from "../../../api";
import { Switch } from "@radix-ui/react-switch";
import { useAutoSave } from "../../../contexts/AutoSaveContext";

export default function SettingsAutoSave() {
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isChecked, setIsChecked] = useState(true);
  const { checkUpdateAutoSave, setCheckUpdateAutoSave } = useAutoSave();
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/settings/autosave/");
        const { autosave_enabled, autosave_interval_minutes } = response.data;

        setAutosaveEnabled(autosave_enabled);
        setIsChecked(autosave_enabled);
        setIntervalMinutes(autosave_interval_minutes);
      } catch (error) {
        setStatusMessage("Помилка завантаження налаштувань.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = () => {
    setIsChecked((prev) => !prev);
    setAutosaveEnabled((prev) => !prev);
  };

  const handleIntervalChange = (e) => {
    setIntervalMinutes(parseInt(e.target.value, 10));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage("");

    try {
      await api.put("/api/settings/autosave/", {
        autosave_enabled: isChecked,
        autosave_interval_minutes: intervalMinutes,
      });
      setCheckUpdateAutoSave(true);
      setStatusMessage("Налаштування збережено успішно.");
    } catch (error) {
      setStatusMessage("Помилка збереження налаштувань.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings">
      <h3>AutoSave settings</h3>
      <div className="autoSave-settings">
        {loading ? (
          <p>Завантаження...</p>
        ) : (
          <>
            <div className="security-row">
              <label>
                <span>Автозбереження</span>
                <Switch
                  id="autosave-switch"
                  checked={isChecked}
                  onCheckedChange={handleToggle}
                  className="switch"
                  style={{
                    backgroundColor: isChecked ? "#4caf50" : "#ccc",
                  }}
                >
                  <span
                    className="switch-circle"
                    style={{
                      left: isChecked ? 25 : 2,
                    }}
                  />
                </Switch>
              </label>
            </div>

            <div className="security-row">
              <label htmlFor="interval-select">
                <span>Інтервал автозбереження (хв):</span>
              </label>
              <select
                id="interval-select"
                value={intervalMinutes}
                onChange={handleIntervalChange}
                disabled={!isChecked}
              >
                {[1, 3, 5, 10, 15, 20, 30].map((min) => (
                  <option key={min} value={min}>
                    {min}
                  </option>
                ))}
              </select>
            </div>

            <div className="security-row">
              <button onClick={handleSave} disabled={saving}>
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </div>

            {statusMessage && (
              <div className="status-message">
                <p>{statusMessage}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";

import api from "../../../api";

export default function SettingsSupport() {
  const [email, setEmail] = useState("");
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("api/user/me");
        setEmail(response.data.email);
      } catch (error) {
        console.error("Помилка при отриманні даних користувача:", error);
      }
    };
    fetchUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const subject = e.target.elements.subject.value.trim();
    const message = e.target.elements.message.value.trim();
    if (!subject) return;
    if (!message) return;
    try {
      const res = await api.post("api/support/", {
        email,
        subject,
        message,
      });

      if (res.status === 200) {
        e.target.reset();
        alert("Your message has been sent successfully!");
      } else {
        alert("Failed to send your message. Please try again later.");
      }
    } catch (error) {
      console.error("Support request error:", error);
      alert("An error occurred while sending your message.");
    }
  };
  return (
    <div className="settings">
      <h3>Help & Support</h3>
      <div className="settings-support">
        <p>If you have questions, issues, or feedback — we’re here to help.</p>
        <p>We usually respond within 24 hours on business days.</p>

        <form onSubmit={handleSubmit} className="support-form">
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            required
            className="input"
          />
          <textarea
            id="message"
            name="message"
            placeholder="Describe your problem or question..."
            rows={5}
            required
          ></textarea>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

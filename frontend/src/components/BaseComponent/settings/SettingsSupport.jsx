import api from "../../../api";

export default function SettingsSupport({ email }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const message = e.target.elements.message.value.trim();
    if (!message) return;
    try {
      const res = api.post("/support", {
        email: email,
        message: message,
      });
      if (res.status === 200) {
        e.target.reset();
        alert("Your message has been sent successfully!");
      } else {
        alert("Failed to send your message. Please try again later.");
      }
    } catch (error) {}
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

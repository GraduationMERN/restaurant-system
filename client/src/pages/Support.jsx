import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import { useSettings } from "../context/SettingContext";
import api from "../api/axios";

export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);
  const { settings } = useSettings();
  const [openFaq, setOpenFaq] = useState(null);
  const [openPolicy, setOpenPolicy] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("api/support", { name, email, subject, type, message });
      if (res?.data?.success) {
        setStatus({ ok: true, msg: "Submitted successfully" });
        setName(""); setEmail(""); setSubject(""); setType("feedback"); setMessage("");
      } else {
        setStatus({ ok: false, msg: res?.data?.message || "Submission failed" });
      }
    } catch (err) {
      setStatus({ ok: false, msg: "Failed to submit" });
      console.error("Support submit error", err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <PageMeta title="Support" description="Send feedback or complaints" />
      {/* About Us */}
      <div className="space-y-2 mb-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold">{settings?.about?.title || "About Us"}</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
          {settings?.about?.content || "We are a restaurant dedicated to great food and service."}
        </p>
      </div>

      {/* FAQs */}
      <div className="mb-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">FAQs</h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {(settings?.faqs || []).map((faq, idx) => (
            <div key={idx} className="py-4">
              <button
                className="w-full text-left flex items-center justify-between"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                aria-expanded={openFaq === idx}
              >
                <span className="font-medium text-gray-800 dark:text-white/90">{faq.question}</span>
                <span className="text-gray-500">{openFaq === idx ? "−" : "+"}</span>
              </button>
              {openFaq === idx && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
          {(!settings?.faqs || settings.faqs.length === 0) && (
            <p className="text-sm text-gray-500">No FAQs available.</p>
          )}
        </div>
      </div>

      {/* Policies */}
      <div className="mb-6 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Policies</h2>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          <div className="py-4">
            <button
              className="w-full text-left flex items-center justify-between"
              onClick={() => setOpenPolicy(openPolicy === "terms" ? null : "terms")}
              aria-expanded={openPolicy === "terms"}
            >
              <span className="font-medium text-gray-800 dark:text-white/90">Terms</span>
              <span className="text-gray-500">{openPolicy === "terms" ? "−" : "+"}</span>
            </button>
            {openPolicy === "terms" && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {settings?.policies?.terms || ""}
              </div>
            )}
          </div>
          <div className="py-4">
            <button
              className="w-full text-left flex items-center justify-between"
              onClick={() => setOpenPolicy(openPolicy === "privacy" ? null : "privacy")}
              aria-expanded={openPolicy === "privacy"}
            >
              <span className="font-medium text-gray-800 dark:text-white/90">Privacy</span>
              <span className="text-gray-500">{openPolicy === "privacy" ? "−" : "+"}</span>
            </button>
            {openPolicy === "privacy" && (
              <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {settings?.policies?.privacy || ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Support Form */}
      <form onSubmit={submit} className="space-y-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold">Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <select className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Message</label>
          <textarea rows={5} className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-white">Send</button>
          {status && (
            <span className={`${status.ok ? "text-green-600" : "text-red-600"}`}>{status.msg}</span>
          )}
        </div>
      </form>
    </div>
  );
}

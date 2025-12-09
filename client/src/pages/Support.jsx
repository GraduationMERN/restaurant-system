import { useState } from "react";
import PageMeta from "../components/common/PageMeta";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import api from "../api/axios";

export default function Support() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [type, setType] = useState("feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/api/support", { name, email, subject, type, message });
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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <PageMeta title="Support" description="Send feedback or complaints" />
      <PageBreadcrumb pageTitle="Support" />

      <form onSubmit={submit} className="space-y-4 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={name} onChange={(e)=>setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Subject</label>
            <input className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={subject} onChange={(e)=>setSubject(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Type</label>
            <select className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={type} onChange={(e)=>setType(e.target.value)}>
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaint</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Message</label>
          <textarea rows={5} className="mt-1 w-full border border-gray-200 dark:border-gray-800 rounded-lg p-2" value={message} onChange={(e)=>setMessage(e.target.value)} />
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

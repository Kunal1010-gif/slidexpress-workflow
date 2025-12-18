// src/pages/Mail.jsx
import { useState, useEffect } from "react";
import { emailAPI } from "../utils/api";
import CreateTicketModal from "../components/CreateTicketModal";
import axios from "axios";

const Mail = () => {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [filter, setFilter] = useState("all");
  const [syncing, setSyncing] = useState(false);

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState(null);

  useEffect(() => {
    fetchEmails();
    syncEmails();
    const syncInterval = setInterval(syncEmails, 30000);
    return () => clearInterval(syncInterval);
  }, []);

  useEffect(() => {
    applyFilter(filter);
  }, [emails, filter]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await emailAPI.getAllEmails();
      setEmails(response.data.emails);
    } catch {
      console.log("Failed to load emails");
    } finally {
      setLoading(false);
    }
  };

  

  const syncEmails = async () => {
    try {
      setSyncing(true);
      const response = await emailAPI.syncEmails();
      if (response.data.count > 0) fetchEmails();
    } finally {
      setSyncing(false);
    }
  };

  const handleEmailClick = async (id) => {
    const response = await emailAPI.getEmailById(id);
    setSelectedEmail(response.data.email);
  };

  const handleDeleteEmail = async (id) => {
    if (!window.confirm("Delete this email?")) return;
    await emailAPI.deleteEmail(id);
    setSelectedEmail(null);
    fetchEmails();
  };

  const handleDownloadAttachment = async (id, i, filename) => {
    const response = await emailAPI.downloadAttachment(id, i);
    const url = URL.createObjectURL(response.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const applyFilter = (type) => {
    let list = [...emails];
    if (type === "recent") list = list.sort((a, b) => new Date(b.date) - new Date(a.date));
    if (type === "attachments") list = list.filter((e) => e.attachments?.length > 0);
    setFilteredEmails(list);
  };

  const generateJobId = () => "JOB-" + Math.floor(100000 + Math.random() * 900000);

  const handleOpenTicketModal = () => {
    if (!selectedEmail) return;
    const now = new Date();
    setTicketData({
      jobId: generateJobId(),
      consultantName: "Default Consultant",
      clientName: selectedEmail.from.name || selectedEmail.from.address,
      clientEmail: selectedEmail.from.address,
      createdDate: now.toISOString(),
      createdBy: "System User",
      subject: selectedEmail.subject,
      message: selectedEmail.body?.text || "",
      sourceEmailId: selectedEmail._id,
      attachments: selectedEmail.attachments || [],
    });
    setShowTicketModal(true);
  };

const handleCreateTicket = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData),
    });

    const data = await res.json();
    if (res.ok) {
      alert('Ticket created and saved in DB!');
      setShowTicketModal(false);
    } else {
      alert('Failed to create ticket: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Error creating ticket');
  }
};

  return (
    <div className={`h-full w-full flex ${darkMode ? "bg-[#1E1F24] text-gray-200" : "bg-[#F8F9FC] text-gray-800"}`}>
      {/* SIDEBAR */}
      <div className={`w-[330px] border-r ${darkMode ? "bg-[#27282F] border-gray-700" : "bg-white border-gray-200"}`}>
        {/* Header */}
        <div className={`p-4 border-b flex justify-between items-center sticky top-0 z-20 ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
          <h2 className="text-sm font-semibold">⭐ Starred</h2>
          <button onClick={() => setDarkMode(!darkMode)} className={`px-3 py-1 rounded-md text-xs ${darkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* FILTERS */}
        <div className={`p-3 flex gap-2 border-b overflow-x-auto ${darkMode ? "border-gray-700 bg-[#2B2C33]" : "border-gray-200 bg-gray-50"}`}>
          {["all", "recent", "attachments"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs border ${filter === f ? "bg-blue-600 text-white border-blue-600" : darkMode ? "bg-[#1E1F24] border-gray-600 text-gray-300" : "bg-white border-gray-300 text-gray-600"}`}>{f}</button>
          ))}
        </div>

        {/* EMAIL LIST */}
        <div className="overflow-y-auto h-full">
          {loading ? <div className="p-4 text-center text-sm opacity-70">Loading…</div> :
            filteredEmails.length === 0 ? <div className="p-4 text-center text-sm opacity-70">No emails</div> :
              filteredEmails.map((email) => {
                const active = selectedEmail?._id === email._id;
                return (
                  <div key={email._id} onClick={() => handleEmailClick(email._id)} className={`px-4 py-3 border-b cursor-pointer ${active ? "bg-blue-50 dark:bg-blue-900/30 border-blue-500" : darkMode ? "border-gray-700 hover:bg-[#2F3038]" : "border-gray-200 hover:bg-gray-50"}`}>
                    <div className="flex justify-between">
                      <span className="font-medium text-sm truncate">{email.from.name || email.from.address}</span>
                      <span className="text-[11px] opacity-70">{formatDate(email.date)}</span>
                    </div>
                    <p className="text-xs mt-0.5 truncate opacity-90">{email.subject}</p>
                    <p className="text-[11px] opacity-60 truncate">{email.body?.text?.slice(0, 70) || "(No content)"}</p>
                  </div>
                );
              })
          }
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 overflow-y-auto">
        {!selectedEmail ? <div className="flex items-center justify-center h-full opacity-70"><div className="text-center"><div className="text-6xl mb-3">📭</div><p className="text-sm">Select an email to view</p></div></div> :
          <div className="p-6">
            <h1 className="text-xl font-semibold mb-3">{selectedEmail.subject}</h1>
            <div className="flex justify-between items-start gap-6 pb-4 border-b mb-4">
              <div>
                <p className="font-semibold">{selectedEmail.from.name || selectedEmail.from.address}</p>
                <p className="text-xs opacity-70">&lt;{selectedEmail.from.address}&gt;</p>
                <p className="text-xs opacity-70 mt-1">{new Date(selectedEmail.date).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleOpenTicketModal} className="px-3 py-1.5 text-xs rounded-md border bg-gray-100 hover:bg-gray-200">📝 Create Ticket</button>
                <button className="px-3 py-1.5 text-xs rounded-md border bg-gray-100 hover:bg-gray-200">➕ Add to existing Ticket</button>
                <button onClick={() => handleDeleteEmail(selectedEmail._id)} className="px-3 py-1.5 text-xs rounded-md border bg-red-100 text-red-700 hover:bg-red-200">🗑 Delete</button>
              </div>
            </div>

            {/* Attachments */}
            {selectedEmail.attachments?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium mb-2">Attachments</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmail.attachments.map((a, i) => (
                    <button key={i} onClick={() => handleDownloadAttachment(selectedEmail._id, i, a.filename)} className="px-3 py-2 border rounded-md text-xs bg-white hover:bg-gray-100">📎 {a.filename}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm leading-relaxed">
              {selectedEmail.body?.html ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: selectedEmail.body.html }} /> :
                <pre className="whitespace-pre-wrap">{selectedEmail.body?.text}</pre>}
            </div>
          </div>
        }
      </div>

      {/* TICKET MODAL */}
      {showTicketModal && <CreateTicketModal ticketData={ticketData} setTicketData={setTicketData} onClose={() => setShowTicketModal(false)} onCreate={handleCreateTicket} />}
    </div>
  );
};

export default Mail;

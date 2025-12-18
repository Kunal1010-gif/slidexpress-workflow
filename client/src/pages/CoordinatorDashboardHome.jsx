import { useEffect, useState, useRef } from "react";
import { Mail, MoreVertical } from "lucide-react";
import { ticketAPI, teamMemberAPI } from "../utils/api";

/* ===================== HIDE SCROLLBAR STYLES ===================== */
const hideScrollbarStyles = `
  select.hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  select.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

/* ===================== DATE FORMATTER ===================== */
const formatDateTime = (date) => {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

/* ===================== TIMEZONE CONVERTER ===================== */
const convertToIST = (datetimeLocal, timezone) => {
  if (!datetimeLocal || !timezone) return "-";

  // Extract UTC offset from timezone string like "EST (UTC-5)"
  const utcMatch = timezone.match(/UTC([+-]\d+:?\d*)/);
  if (!utcMatch) return "-";

  const utcOffset = utcMatch[1];
  const datetime = new Date(datetimeLocal);

  // Parse offset (e.g., "-5" or "+5:30")
  const offsetParts = utcOffset.match(/([+-])(\d+):?(\d*)/);
  if (!offsetParts) return "-";

  const sign = offsetParts[1] === '+' ? 1 : -1;
  const offsetHours = parseInt(offsetParts[2]);
  const offsetMinutes = offsetParts[3] ? parseInt(offsetParts[3]) : 0;
  const totalOffsetMinutes = sign * (offsetHours * 60 + offsetMinutes);

  // Convert to UTC first (reverse the timezone offset)
  const utcTime = new Date(datetime.getTime() - totalOffsetMinutes * 60000);

  // Convert UTC to IST (UTC+5:30)
  const istTime = new Date(utcTime.getTime() + (5.5 * 60 * 60000));

  // Format IST time
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const day = istTime.getDate();
  const month = months[istTime.getMonth()];
  const year = istTime.getFullYear();
  let hours = istTime.getHours();
  const minutes = istTime.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
};

/* ===================== CONFIGS ===================== */
const STATUSES = ["not_assigned","assigned","in_process","rf_qc","qcd","file_received","sent"];
const STATUS_LABEL = {
  not_assigned: "Not Assigned",
  assigned: "Assigned",
  in_process: "In Progress",
  rf_qc: "Ready for QC",
  qcd: "QC Done",
  file_received: "File Received",
  sent: "Sent"
};
const STATUS_COLOR = {
  not_assigned: "text-red-600",
  assigned: "text-yellow-600",
  in_process: "text-blue-600",
  rf_qc: "text-purple-600",
  qcd: "text-green-600",
  file_received: "text-orange-600",
  sent: "text-teal-600"
};

const TO_CHECK_OPTIONS = ["Malar","Ravi"];
const CLIENT_TYPES = ["New Client","New Contact","Double Check","Non Standard","Level 1","Level 2","Level 3","Level 4"];
const TIMEZONES = [
  "EST (UTC-5)", "CST (UTC-6)", "MST (UTC-7)", "PST (UTC-8)",
  "GMT (UTC+0)", "CET (UTC+1)", "IST (UTC+5:30)", "JST (UTC+9)",
  "AEST (UTC+10)", "NZST (UTC+12)"
];
const HOURS_OPTIONS = Array.from({ length: 25 }, (_, i) => i); // 0-24
const MINUTES_OPTIONS = ['00', '15', '30', '45'];
const inputClass = "w-full px-0.5 py-0.5 text-[11px] border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 h-[20px] hide-scrollbar";
const selectClass = "px-0.5 py-0.5 text-[11px] border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 hide-scrollbar h-[20px]";

/* ===================== EMAIL MODAL ===================== */
const EmailModal = ({ jobId, emails, onClose }) => {
  const handleDownloadAttachment = async (emailId, attachmentId, filename) => {
    try {
      const response = await fetch(`http://localhost:5000/api/emails/${emailId}/attachments/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading attachment:', error);
      alert('Failed to download attachment');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[900px] max-h-[85vh] rounded-lg shadow-xl p-4 overflow-y-auto text-[13px]">
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-3">
          <h2 className="font-semibold text-lg text-gray-800">
            📧 Emails for Job ID: <span className="text-blue-600 font-bold">{jobId}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 text-xl font-bold p-1 hover:bg-red-50 rounded-full transition-all"
          >
            ✕
          </button>
        </div>

        {emails.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-[13px]">No emails found for this job ID</p>
            <p className="text-xs text-gray-400 mt-1">Job ID: {jobId}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((mail, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="font-bold text-sm text-gray-700">From:</span>
                      <span className="ml-2 font-medium text-blue-600">{mail.from || 'N/A'}</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <span className="font-bold text-sm text-gray-700">To:</span>
                      <span className="ml-2 font-medium">{mail.to || 'N/A'}</span>
                    </div>
                    <div className="flex items-center mb-1">
                      <span className="font-bold text-sm text-gray-700">Subject:</span>
                      <span className="ml-2 font-semibold text-gray-900">{mail.subject || 'No Subject'}</span>
                    </div>
                    {mail.date && (
                      <div className="flex items-center">
                        <span className="font-bold text-sm text-gray-700">Date:</span>
                        <span className="ml-2 text-xs text-gray-600">{new Date(mail.date).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {mail.attachments && mail.attachments.length > 0 && (
                  <div className="mb-3 bg-white p-2 rounded border border-gray-200">
                    <p className="text-xs font-bold text-gray-700 mb-2">📎 Attachments ({mail.attachments.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {mail.attachments.map((attachment, attIdx) => (
                        <button
                          key={attIdx}
                          onClick={() => handleDownloadAttachment(mail._id, attIdx, attachment.filename)}
                          className="px-3 py-1.5 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md border border-blue-300 transition-colors flex items-center gap-1"
                        >
                          <span>📄</span>
                          <span className="max-w-[200px] truncate">{attachment.filename}</span>
                          {attachment.size && <span className="text-[10px] opacity-70">({Math.round(attachment.size / 1024)}KB)</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Body */}
                <div className="text-sm text-gray-700 bg-white p-3 rounded border mt-2 max-h-96 overflow-y-auto">
                  {mail.bodyHtml && mail.bodyHtml.trim() !== '' ? (
                    <div
                      className="email-content"
                      dangerouslySetInnerHTML={{ __html: mail.bodyHtml }}
                      style={{
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        lineHeight: '1.6'
                      }}
                    />
                  ) : mail.body && mail.body.trim() !== '' && mail.body !== 'No content' ? (
                    <div className="whitespace-pre-wrap font-sans leading-relaxed">{mail.body}</div>
                  ) : (
                    <div className="text-center py-4 text-gray-400 italic">
                      No email content available. The email may need to be re-synced.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ===================== ACTION MENU ===================== */
const ActionMenu = ({ ticket, onDelete }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-0.5 rounded hover:bg-gray-100">
        <MoreVertical size={12} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1 w-16 bg-white border border-gray-300 rounded shadow-lg text-[10px] z-50"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            onClick={() => onDelete(ticket._id)}
            className="w-full text-left px-1 py-0.5 text-red-600 hover:bg-red-50 text-[10px] transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

/* ===================== MAIN DASHBOARD ===================== */
const CoordinatorDashboardHome = () => {
  const [tickets, setTickets] = useState([]);
  const [toast, setToast] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedTicketEmails, setSelectedTicketEmails] = useState([]);
  const [loadingEmailsMap, setLoadingEmailsMap] = useState({}); // per-ticket loading
  const [teamMap, setTeamMap] = useState({});
  const [allEmps, setAllEmps] = useState([]);

  /* ======== FETCH TICKETS ======== */
  const fetchTickets = async () => {
    try {
      const res = await ticketAPI.getAllTickets();
      setTickets(res.data?.tickets || []);
    } catch (error) {
      console.error(error);
      showToast("Error loading tickets");
    }
  };

  /* ======== FETCH TEAM MEMBERS ======== */
  const fetchTeamMembers = async () => {
    try {
      const res = await teamMemberAPI.getGroupedTeamMembers();
      const { teamMap: fetchedTeamMap } = res.data;
      setTeamMap(fetchedTeamMap || {});
      setAllEmps(Object.values(fetchedTeamMap || {}).flat());
    } catch (error) {
      console.error("Error loading team members:", error);
      showToast("Error loading team members");
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchTeamMembers();
  }, []);

  const showToast = (msg) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3000); 
  };

  const getStatusCount = (status) => tickets.filter(t => t.status === status).length;

  const updateTicketField = async (ticketId, patch) => {
    setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, ...patch } : t));
    await ticketAPI.updateTicket(ticketId, patch);
  };

  // Parse estimate string like "2h 30m" or "2:30" to { hours, minutes }
  const parseEstimate = (estStr) => {
    if (!estStr) return { hours: 0, minutes: '00' };

    // Try parsing "2h 30m" format
    const hhmm = estStr.match(/(\d+)h\s*(\d+)m/);
    if (hhmm) return { hours: parseInt(hhmm[1]), minutes: hhmm[2].padStart(2, '0') };

    // Try parsing "2:30" format
    const colon = estStr.match(/(\d+):(\d+)/);
    if (colon) return { hours: parseInt(colon[1]), minutes: colon[2].padStart(2, '0') };

    // Try parsing just hours "2"
    const hoursOnly = estStr.match(/^(\d+)$/);
    if (hoursOnly) return { hours: parseInt(hoursOnly[1]), minutes: '00' };

    return { hours: 0, minutes: '00' };
  };

  // Format hours and minutes to "2h 30m"
  const formatEstimate = (hours, minutes) => {
    if (hours === 0 && minutes === '00') return '';
    return `${hours}h ${minutes}m`;
  };

  const handleEstimateChange = async (ticket, hours, minutes) => {
    const formattedEst = formatEstimate(hours, minutes);
    await updateTicketField(ticket._id, {
      meta: { ...ticket.meta, teamEst: formattedEst }
    });
  };

  const deleteTicket = async (ticketId) => {
    if (!window.confirm("Delete this ticket?")) return;
    await ticketAPI.deleteTicket(ticketId);
    setTickets(prev => prev.filter(t => t._id !== ticketId));
    showToast("Ticket deleted");
  };

  const handleEmpChange = async (ticket, empName) => {
    if (!empName) return;
    const teamLead = Object.entries(teamMap).find(([_, emps]) => emps.includes(empName))?.[0];
    const patch = { assignedInfo: { empName, teamLead }, status: ticket.status };
    setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, ...patch } : t));
    await ticketAPI.assignTicket(ticket._id, patch);
    showToast(`Assigned to ${empName} (TL: ${teamLead})`);
  };

  const getStatusOptions = (ticket) => {
    const index = STATUSES.indexOf(ticket.status);
    return STATUSES.map((status, i) => ({
      value: status,
      label: STATUS_LABEL[status],
      disabled: i > index + 1 || (!ticket.assignedInfo?.empName && status !== "not_assigned")
    }));
  };

  /* ======== EMAIL HANDLER ======== */
  const handleOpenEmailModal = async (ticket) => {
    if (!ticket.jobId) {
      showToast("No Job ID found");
      return;
    }

    setSelectedJobId(ticket.jobId);
    setLoadingEmailsMap(prev => ({ ...prev, [ticket._id]: true }));

    let emails = [];
    if (ticket.emails && Array.isArray(ticket.emails) && ticket.emails.length > 0) emails = ticket.emails;
    else if (ticket.emailData && Array.isArray(ticket.emailData) && ticket.emailData.length > 0) emails = ticket.emailData;
    else if (ticket.mail && Array.isArray(ticket.mail) && ticket.mail.length > 0) emails = ticket.mail;
    else if (ticket.meta?.emails && Array.isArray(ticket.meta.emails) && ticket.meta.emails.length > 0) emails = ticket.meta.emails;
    else {
      try {
        const res = await ticketAPI.getEmailsByJobId(ticket.jobId);
        emails = res.data?.emails || res.data || [];
        if (emails.length > 0) {
          setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, emails } : t));
        }
      } catch (error) {
        console.error("Email API error:", error);
        showToast("Error fetching emails");
      }
    }

    setSelectedTicketEmails(emails);
    setShowEmailModal(true);
    setLoadingEmailsMap(prev => ({ ...prev, [ticket._id]: false }));

    if (emails.length > 0) showToast(`${emails.length} email(s) loaded`);
    else showToast("No emails found for this Job ID");
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setSelectedJobId(null);
    setSelectedTicketEmails([]);
  };

  return (
    <div className="p-1 bg-gray-100 h-screen overflow-y-auto text-[13px]">
      <style>{hideScrollbarStyles}</style>
      {STATUSES.map(status => (
        <div key={status} className="mb-2 bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* HEADER */}
          <div className="px-2 py-1 border-b border-gray-200 flex justify-between">
            <h2 className={`font-semibold ${STATUS_COLOR[status]} text-[13px]`}>
              {STATUS_LABEL[status]} <span className="ml-1 text-[11px] text-gray-500">({getStatusCount(status)})</span>
            </h2>
          </div>

          {/* HEADER ROW */}
          <div className="grid grid-cols-16 gap-x-1.5 px-1 py-0.5 bg-gray-50 text-[10px] font-semibold text-gray-700 sticky top-0 border-b border-gray-200">
            <span>Job ID</span><span>Client</span><span>Client Type</span>
            <span>Consultant</span><span>TL</span><span>Team Member</span><span>Status</span>
            <span>Estimate Time</span><span>Time Zone</span><span>Deadline</span><span>IST Time</span>
            <span>Ticket Time</span><span>Assign Job Time</span><span>Start Job Time</span>
            <span>Mail</span><span>Action</span>
          </div>

          {/* TICKET ROWS */}
          {tickets.filter(t => t.status === status).map(ticket => (
            <div key={ticket._id} className="grid grid-cols-16 gap-x-1.5 items-center px-1 py-0.5 border-b border-gray-100 hover:bg-blue-50 transition-colors">
              <span className="font-semibold text-blue-600 hover:underline cursor-pointer text-[11px]">{ticket.jobId || "-"}</span>
              <span className="text-[11px]">{ticket.clientName || "-"}</span>

              <select className={inputClass} value={ticket.meta?.clientType || ""} onChange={e => updateTicketField(ticket._id, { meta: { ...ticket.meta, clientType: e.target.value } })}>
                <option value="">-</option>{CLIENT_TYPES.map(o => <option key={o}>{o}</option>)}
              </select>

              <span className="text-[11px]">{ticket.consultantName || "-"}</span>
              <input className={`${inputClass} bg-gray-50`} value={ticket.assignedInfo?.teamLead || ""} readOnly />

              <select className={inputClass} value={ticket.assignedInfo?.empName || ""} onChange={e => handleEmpChange(ticket, e.target.value)}>
                <option value="">Select</option>{allEmps.map(emp => <option key={emp}>{emp}</option>)}
              </select>

              <select className={`${inputClass} font-medium ${STATUS_COLOR[ticket.status]}`} value={ticket.status} onChange={e => updateTicketField(ticket._id, { status: e.target.value })}>
                {getStatusOptions(ticket).map(s => (<option key={s.value} value={s.value} disabled={s.disabled}>{s.label}</option>))}
              </select>

              {/* Est - Hours and Minutes dropdowns */}
              <div className="flex gap-0.5 items-center">
                <select
                  className="px-0.5 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 w-[32px] hide-scrollbar h-[20px]"
                  value={parseEstimate(ticket.meta?.teamEst).hours}
                  onChange={e => handleEstimateChange(ticket, parseInt(e.target.value), parseEstimate(ticket.meta?.teamEst).minutes)}
                  title="Hours"
                >
                  {HOURS_OPTIONS.map(h => <option key={h} value={h}>{h}h</option>)}
                </select>
                <select
                  className="px-0.5 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 w-[32px] hide-scrollbar h-[20px]"
                  value={parseEstimate(ticket.meta?.teamEst).minutes}
                  onChange={e => handleEstimateChange(ticket, parseEstimate(ticket.meta?.teamEst).hours, e.target.value)}
                  title="Minutes"
                >
                  {MINUTES_OPTIONS.map(m => <option key={m} value={m}>{m}m</option>)}
                </select>
              </div>

              {/* Time Zone */}
              <select className="w-full px-1 py-0.5 text-[11px] border border-gray-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300 hide-scrollbar h-[20px]" value={ticket.meta?.timezone || ""} onChange={e => updateTicketField(ticket._id, { meta: { ...ticket.meta, timezone: e.target.value } })}>
                <option value="">-</option>{TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>

              {/* Deadline - Date and Time */}
              <input className={inputClass} type="datetime-local" value={ticket.meta?.deadline || ""} onChange={e => updateTicketField(ticket._id, { meta: { ...ticket.meta, deadline: e.target.value } })} />

              {/* IST Time - Converted */}
              <span className="text-[11px] text-gray-700 font-medium">{convertToIST(ticket.meta?.deadline, ticket.meta?.timezone)}</span>

              {/* Create Ticket Time */}
              <span className="text-[11px] text-gray-700">
                {ticket.createdAt ? formatDateTime(new Date(ticket.createdAt)) : "-"}
              </span>

              {/* Assign Job Time */}
              <span className="text-[11px] text-gray-700">
                {ticket.assignedAt ? formatDateTime(new Date(ticket.assignedAt)) : "-"}
              </span>

              {/* Start Job Time */}
              <span className="text-[11px] text-gray-700">
                {ticket.startedAt ? formatDateTime(new Date(ticket.startedAt)) : "-"}
              </span>

              {/* EMAIL BUTTON */}
              <button
                className="h-5 w-5 flex items-center justify-center rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-all"
                onClick={() => handleOpenEmailModal(ticket)}
                title={`View emails for ${ticket.jobId} (${ticket.emails?.length || 0} cached)`}
                disabled={loadingEmailsMap[ticket._id]}
              >
                {loadingEmailsMap[ticket._id] ? (
                  <div className="w-2 h-2 border border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Mail size={12} />
                )}
              </button>

              <ActionMenu ticket={ticket} onDelete={deleteTicket} />
            </div>
          ))}
        </div>
      ))}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <EmailModal
          jobId={selectedJobId}
          emails={selectedTicketEmails}
          onClose={closeEmailModal}
        />
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white px-4 py-2 rounded-lg shadow-xl text-[13px] border-l-4 border-blue-400 animate-pulse">
          {toast}
        </div>
      )}
    </div>
  );
};

export default CoordinatorDashboardHome;

import { useEffect, useState } from 'react';
import { Mail, Play, Pause, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { teamMemberAPI, ticketAPI } from '../utils/api';

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

const STATUS_LABEL = {
  not_assigned: 'Not Assigned',
  assigned: 'Assigned',
  in_process: 'In Progress',
  rf_qc: 'Ready for QC',
  qcd: 'QC Done',
  file_received: 'File Received',
  sent: 'Sent'
};

const STATUS_COLOR = {
  not_assigned: 'text-red-600 bg-red-50',
  assigned: 'text-yellow-600 bg-yellow-50',
  in_process: 'text-blue-600 bg-blue-50',
  rf_qc: 'text-purple-600 bg-purple-50',
  qcd: 'text-green-600 bg-green-50',
  file_received: 'text-orange-600 bg-orange-50',
  sent: 'text-teal-600 bg-teal-50'
};

const HOURS_OPTIONS = Array.from({ length: 25 }, (_, i) => i); // 0-24
const MINUTES_OPTIONS = ['00', '15', '30', '45'];

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

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedTaskEmails, setSelectedTaskEmails] = useState([]);
  const [loadingEmailsMap, setLoadingEmailsMap] = useState({});

  useEffect(() => {
    fetchUserTasks();
  }, [user]);

  const fetchUserTasks = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Tasks - Fetching tasks for user:', user.name, user.email);
      const response = await teamMemberAPI.getMyTasks();
      console.log('Tasks - API Response:', response.data);
      setTasks(response.data?.tasks || []);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await ticketAPI.updateTicket(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Failed to update task status');
    }
  };

  const handleEstimateChange = async (task, hours, minutes) => {
    try {
      const formattedEst = formatEstimate(hours, minutes);
      await ticketAPI.updateTicket(task._id, {
        meta: { ...task.meta, teamEst: formattedEst }
      });
      setTasks(prev => prev.map(t =>
        t._id === task._id ? { ...t, meta: { ...t.meta, teamEst: formattedEst } } : t
      ));
    } catch (error) {
      console.error('Error updating estimate:', error);
      alert('Failed to update estimate');
    }
  };

  const handleStartTask = async (task) => {
    try {
      await ticketAPI.updateTicket(task._id, { status: 'in_process' });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: 'in_process' } : t));
    } catch (error) {
      console.error('Error starting task:', error);
      alert('Failed to start task');
    }
  };

  const handlePauseTask = async (task) => {
    try {
      // Pause: set back to 'assigned' status
      await ticketAPI.updateTicket(task._id, { status: 'assigned' });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: 'assigned' } : t));
    } catch (error) {
      console.error('Error pausing task:', error);
      alert('Failed to pause task');
    }
  };

  const handleEndTask = async (task) => {
    try {
      // End: set to 'rf_qc' (Ready for QC)
      await ticketAPI.updateTicket(task._id, { status: 'rf_qc' });
      setTasks(prev => prev.map(t => t._id === task._id ? { ...t, status: 'rf_qc' } : t));
    } catch (error) {
      console.error('Error ending task:', error);
      alert('Failed to end task');
    }
  };

  const handleOpenEmailModal = async (task) => {
    if (!task.jobId) {
      alert('No Job ID found');
      return;
    }

    setSelectedJobId(task.jobId);
    setLoadingEmailsMap(prev => ({ ...prev, [task._id]: true }));

    let emails = [];
    if (task.emails && Array.isArray(task.emails) && task.emails.length > 0) {
      emails = task.emails;
    } else if (task.emailData && Array.isArray(task.emailData) && task.emailData.length > 0) {
      emails = task.emailData;
    } else if (task.mail && Array.isArray(task.mail) && task.mail.length > 0) {
      emails = task.mail;
    } else if (task.meta?.emails && Array.isArray(task.meta.emails) && task.meta.emails.length > 0) {
      emails = task.meta.emails;
    } else {
      try {
        const res = await ticketAPI.getEmailsByJobId(task.jobId);
        emails = res.data?.emails || res.data || [];
        if (emails.length > 0) {
          setTasks(prev => prev.map(t => t._id === task._id ? { ...t, emails } : t));
        }
      } catch (error) {
        console.error('Email API error:', error);
        alert('Error fetching emails');
      }
    }

    setSelectedTaskEmails(emails);
    setShowEmailModal(true);
    setLoadingEmailsMap(prev => ({ ...prev, [task._id]: false }));
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setSelectedJobId(null);
    setSelectedTaskEmails([]);
  };

  const getFilteredTasks = () => {
    if (filter === 'all') return tasks;
    if (filter === 'pending') {
      return tasks.filter(t => t.status === 'assigned');
    }
    if (filter === 'active') {
      return tasks.filter(t => t.status === 'in_process' || t.status === 'rf_qc');
    }
    if (filter === 'completed') {
      return tasks.filter(t => t.status === 'qcd' || t.status === 'sent');
    }
    return tasks;
  };

  const filteredTasks = getFilteredTasks();

  const getStatusOptions = (currentStatus) => {
    const statuses = ['assigned', 'in_process', 'rf_qc', 'qcd', 'sent'];
    const currentIndex = statuses.indexOf(currentStatus);

    return statuses.map((status, index) => ({
      value: status,
      label: STATUS_LABEL[status],
      disabled: index > currentIndex + 1
    }));
  };

  return (
    <div className="p-4 h-full overflow-auto bg-gray-50">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Tasks</h1>
          <p className="text-gray-600">Manage and track your assigned tasks</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending ({tasks.filter(t => t.status === 'assigned').length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Active ({tasks.filter(t => t.status === 'in_process' || t.status === 'rf_qc').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Completed ({tasks.filter(t => t.status === 'qcd' || t.status === 'sent').length})
          </button>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {filter === 'all' ? 'No tasks assigned yet' : `No ${filter} tasks`}
              </h2>
              <p className="text-gray-600">
                {filter === 'all'
                  ? 'Tasks assigned to you by the coordinator will appear here'
                  : filter === 'pending'
                  ? 'You don\'t have any pending tasks waiting to be started'
                  : filter === 'active'
                  ? 'You don\'t have any tasks in progress at the moment'
                  : `You don't have any ${filter} tasks at the moment`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Client Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Consultant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Team Lead
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Estimate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task._id} className="hover:bg-blue-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-600">
                          {task.jobId || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">
                          {task.clientName || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {task.consultantName || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {task.assignedInfo?.teamLead || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full inline-block ${STATUS_COLOR[task.status]}`}>
                          {STATUS_LABEL[task.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex gap-1">
                          <select
                            value={parseEstimate(task.meta?.teamEst).hours}
                            onChange={(e) => handleEstimateChange(task, parseInt(e.target.value), parseEstimate(task.meta?.teamEst).minutes)}
                            className="text-xs px-1 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                            title="Hours"
                          >
                            {HOURS_OPTIONS.map(h => <option key={h} value={h}>{h}h</option>)}
                          </select>
                          <select
                            value={parseEstimate(task.meta?.teamEst).minutes}
                            onChange={(e) => handleEstimateChange(task, parseEstimate(task.meta?.teamEst).hours, e.target.value)}
                            className="text-xs px-1 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
                            title="Minutes"
                          >
                            {MINUTES_OPTIONS.map(m => <option key={m} value={m}>{m}m</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {task.meta?.deadline
                          ? new Date(task.meta.deadline).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })
                          : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex gap-1 justify-center">
                          {/* Start Button - Show when status is 'assigned' */}
                          {task.status === 'assigned' && (
                            <button
                              onClick={() => handleStartTask(task)}
                              className="h-7 w-7 flex items-center justify-center rounded bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-900 transition-all shadow-sm"
                              title="Start Task"
                            >
                              <Play size={14} />
                            </button>
                          )}

                          {/* Pause Button - Show when status is 'in_process' */}
                          {task.status === 'in_process' && (
                            <button
                              onClick={() => handlePauseTask(task)}
                              className="h-7 w-7 flex items-center justify-center rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700 hover:text-yellow-900 transition-all shadow-sm"
                              title="Pause Task"
                            >
                              <Pause size={14} />
                            </button>
                          )}

                          {/* End Button - Show when status is 'in_process' */}
                          {task.status === 'in_process' && (
                            <button
                              onClick={() => handleEndTask(task)}
                              className="h-7 w-7 flex items-center justify-center rounded bg-blue-100 hover:bg-blue-200 text-blue-700 hover:text-blue-900 transition-all shadow-sm"
                              title="Mark as Ready for QC"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <button
                          className="h-8 w-8 flex items-center justify-center rounded border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-all shadow-sm hover:shadow-md mx-auto"
                          onClick={() => handleOpenEmailModal(task)}
                          title={`View emails for ${task.jobId}`}
                          disabled={loadingEmailsMap[task._id]}
                        >
                          {loadingEmailsMap[task._id] ? (
                            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Mail size={16} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {!loading && filteredTasks.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredTasks.length} {filter === 'all' ? '' : filter} task{filteredTasks.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <EmailModal
          jobId={selectedJobId}
          emails={selectedTaskEmails}
          onClose={closeEmailModal}
        />
      )}
    </div>
  );
};

export default Tasks;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    workspaceId: '1',
    teamLeadId: ''
  });

  const roles = [
    { value: 'it_admin', label: 'IT Admin' },
    { value: 'hod', label: 'HOD' },
    { value: 'manager', label: 'Manager' },
    { value: 'workflow_coordinator', label: 'Workflow Coordinator' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'team_member', label: 'Team Member' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (formData.role === 'team_member' && formData.workspaceId) {
      fetchTeamLeads(formData.workspaceId);
    }
  }, [formData.role, formData.workspaceId]);

  const fetchData = async () => {
    try {
      const [usersRes, workspacesRes] = await Promise.all([
        userAPI.getAllUsers(),
        userAPI.getWorkspaces()
      ]);
      setUsers(usersRes.data.users);
      setWorkspaces(workspacesRes.data.workspaces);
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLeads = async (workspaceId) => {
    try {
      const response = await userAPI.getTeamLeads(workspaceId);
      setTeamLeads(response.data.teamLeads);
    } catch (err) {
      console.error('Failed to fetch team leads:', err);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setFormData({ name: '', email: '', role: '', workspaceId: '1', teamLeadId: '' });
    setShowModal(true);
  };

  const handleOpenEditModal = (userToEdit) => {
    setIsEditMode(true);
    setSelectedUserId(userToEdit._id);
    setFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      role: userToEdit.role,
      workspaceId: userToEdit.workspace?.workspaceId?.toString() || '1',
      teamLeadId: userToEdit.teamLead?._id || ''
    });

    // Fetch team leads if user is team member
    if (userToEdit.role === 'team_member' && userToEdit.workspace?.workspaceId) {
      fetchTeamLeads(userToEdit.workspace.workspaceId);
    }

    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isEditMode) {
        await userAPI.updateUser(selectedUserId, formData);
        setSuccess('User updated successfully!');
      } else {
        await userAPI.addUser(formData);
        setSuccess('User added successfully!');
      }

      setShowModal(false);
      setFormData({ name: '', email: '', role: '', workspaceId: '1', teamLeadId: '' });
      fetchData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} user`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await userAPI.deleteUser(userId);
      setSuccess('User deleted successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleNeedsWorkspace = (role) => {
    return role !== 'it_admin' && role !== 'super_admin';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">IT Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                Logged in as: {user?.email} ({user?.role})
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add User Button */}
        <div className="mb-6">
          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add New User
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workspace
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role.replace(/_/g, ' ').toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.workspace?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.teamLead?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit User' : 'Add New User'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isEditMode}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter email"
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {roleNeedsWorkspace(formData.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace *
                  </label>
                  <select
                    value={formData.workspaceId}
                    onChange={(e) => setFormData({ ...formData, workspaceId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {workspaces.map((workspace) => (
                      <option key={workspace._id} value={workspace.workspaceId}>
                        {workspace.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'team_member' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Lead *
                  </label>
                  <select
                    value={formData.teamLeadId}
                    onChange={(e) => setFormData({ ...formData, teamLeadId: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Team Lead</option>
                    {teamLeads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name} ({lead.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isEditMode && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                  Default password: <strong>Admin</strong>
                  <br />
                  User must reset on first login
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
                >
                  {isEditMode ? 'Update User' : 'Add User'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setIsEditMode(false);
                    setSelectedUserId(null);
                    setFormData({ name: '', email: '', role: '', workspaceId: '1', teamLeadId: '' });
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

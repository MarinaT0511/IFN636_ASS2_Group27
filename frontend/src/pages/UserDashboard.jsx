import { useEffect, useMemo, useState } from 'react';
import api from '../axiosConfig';
import { Link } from 'react-router-dom';

const getStatusClass = (status) => {
  if (status === 'Open') return 'badge badge-open';
  if (status === 'In Progress') return 'badge badge-progress';
  if (status === 'Resolved') return 'badge badge-resolved';
  if (status === 'Closed') return 'badge badge-closed';
  return 'badge';
};

const getPriorityClass = (priority) => {
  if (priority === 'High') return 'high-text';
  if (priority === 'Medium') return 'medium-text';
  if (priority === 'Low') return 'low-text';
  return '';
};

const UserDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load dashboard');
      }
    };

    fetchTickets();
  }, []);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === 'Open').length,
      inProgress: tickets.filter((ticket) => ticket.status === 'In Progress').length,
      resolved: tickets.filter((ticket) => ticket.status === 'Resolved').length,
      closed: tickets.filter((ticket) => ticket.status === 'Closed').length,
    };
  }, [tickets]);

  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="dashboard-page">
      {error && <p className="error-text">{error}</p>}

      <div className="stats-grid stats-grid-user-five">
        <div className="stat-card stat-card-clean stat-card-blue">
          <div className="stat-icon-box">
            <span className="stat-icon">🔵</span>
          </div>
          <div className="stat-content">
            <h3>Total Tickets</h3>
            <p>{stats.total}</p>
          </div>
        </div>

        <div className="stat-card stat-card-clean stat-card-yellow">
          <div className="stat-icon-box">
            <span className="stat-icon">🔴</span>
          </div>
          <div className="stat-content">
            <h3>Open Tickets</h3>
            <p>{stats.open}</p>
          </div>
        </div>

        <div className="stat-card stat-card-clean stat-card-orange">
          <div className="stat-icon-box">
            <span className="stat-icon">🟠</span>
          </div>
          <div className="stat-content">
            <h3>In Progress</h3>
            <p>{stats.inProgress}</p>
          </div>
        </div>

        <div className="stat-card stat-card-clean stat-card-green">
          <div className="stat-icon-box">
            <span className="stat-icon">🟢</span>
          </div>
          <div className="stat-content">
            <h3>Resolved</h3>
            <p>{stats.resolved}</p>
          </div>
        </div>

        <div className="stat-card stat-card-clean stat-card-teal">
          <div className="stat-icon-box">
            <span className="stat-icon">⚫</span>
          </div>
          <div className="stat-content">
            <h3>Closed Tickets</h3>
            <p>{stats.closed}</p>
          </div>
        </div>
      </div>

      <div className="card dashboard-table-card">
        <div className="dashboard-table-header">
          <h2>Recent Tickets</h2>
          <Link to="/my-tickets">View All</Link>
        </div>

        {recentTickets.length === 0 ? (
          <p className="empty-text">No tickets yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="ticket-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket, index) => (
                  <tr key={ticket._id}>
                    <td className="ticket-id">#TK-{4820 - index}</td>
                    <td className="issue-title">{ticket.subject}</td>
                    <td>
                      <span className={getStatusClass(ticket.status)}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>
                      <span className={getPriorityClass(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/my-tickets/${ticket._id}`} className="table-link-btn">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const priorityWeight = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const ClosedTicketHistory = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const endpoint = isAdmin ? '/tickets/admin/all' : '/tickets';
        const response = await api.get(endpoint);

        // setTickets(response.data || []);
        setTickets(
          Array.isArray(response.data)
            ? response.data
            : response.data.tickets || []
        );
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load ticket history');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isAdmin]);

  const safeTickets = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );
  const closedTickets = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    // return [...tickets]
    return [...safeTickets]
      .filter((ticket) => ticket.status === 'Closed')
      .filter((ticket) => {
        const matchesSearch =
          !keyword ||
          ticket.subject?.toLowerCase().includes(keyword) ||
          ticket.description?.toLowerCase().includes(keyword) ||
          ticket.user?.name?.toLowerCase().includes(keyword) ||
          ticket.user?.email?.toLowerCase().includes(keyword);

        const matchesCategory =
          categoryFilter === 'All' || ticket.category === categoryFilter;

        const matchesPriority =
          priorityFilter === 'All' || ticket.priority === priorityFilter;

        return matchesSearch && matchesCategory && matchesPriority;
      })
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt || a.createdAt);
        const bDate = new Date(b.updatedAt || b.createdAt);

        if (sortOrder === 'oldest') {
          return aDate - bDate;
        }

        if (sortOrder === 'priority') {
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        }

        return bDate - aDate;
      });
    // }, [tickets, searchTerm, categoryFilter, priorityFilter, sortOrder]);
  }, [safeTickets, searchTerm, categoryFilter, priorityFilter, sortOrder]);
  const ticketLink = (ticketId) => {
    return isAdmin ? `/tickets/${ticketId}` : `/my-tickets/${ticketId}`;
  };

  return (
    <div className="history-page">
      {error && <div className="error-text">{error}</div>}

      <div className="history-filter-card">
        <div className="history-filter-title">
          <h2>Closed Ticket History</h2>
          <p>
            Only tickets with Closed status are shown here. Use filters to quickly
            find past support cases.
          </p>
        </div>

        <div className="history-filter-grid">
          <div className="form-group">
            <label>{isAdmin ? 'Search title, user, or email' : 'Search title'}</label>
            <input
              type="text"
              value={searchTerm}
              placeholder="Search closed tickets..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">All categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Network">Network</option>
              <option value="Account">Account</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div className="form-group">
            <label>Sort</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="newest">Recently closed first</option>
              <option value="oldest">Oldest closed first</option>
              <option value="priority">High priority first</option>
            </select>
          </div>
        </div>
      </div>

      <div className="history-table-card">
        <div className="history-table-header">
          <div>
            <h2>History List</h2>
            <p>{closedTickets.length} closed ticket(s) found</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-text">Loading history...</div>
        ) : closedTickets.length === 0 ? (
          <div className="empty-text">No closed tickets found.</div>
        ) : (
          <div className="table-scroll">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  {isAdmin && <th>User</th>}
                  <th>Issue Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Closed / Updated</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {closedTickets.map((ticket) => (
                  <tr key={ticket._id}>
                    <td className="ticket-id">#TK-{ticket._id?.slice(-4).toUpperCase()}</td>

                    {isAdmin && (
                      <td>
                        <div className="history-user-cell">
                          <div className="mini-avatar">👤</div>
                          <div>
                            <strong>{ticket.user?.name || '-'}</strong>
                            <span>{ticket.user?.email || '-'}</span>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="history-title-cell">{ticket.subject}</td>

                    <td>
                      <span className="category-tag">{ticket.category}</span>
                    </td>

                    <td>
                      <span
                        className={
                          ticket.priority === 'High'
                            ? 'high-text'
                            : ticket.priority === 'Medium'
                              ? 'medium-text'
                              : 'low-text'
                        }
                      >
                        {ticket.priority}
                      </span>
                    </td>

                    <td>
                      {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}
                    </td>

                    <td>
                      <Link className="history-view-btn" to={ticketLink(ticket._id)}>
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

export default ClosedTicketHistory;
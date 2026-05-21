import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../axiosConfig';
import TicketList from '../components/TicketList';
import AdminTicketStatusForm from '../components/AdminTicketStatusForm';
import TicketFilters from '../components/TicketFilters';

const priorityWeight = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const Tickets = () => {
  const [tickets, setTickets] = useState([]);
  const [editingTicket, setEditingTicket] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');

  const formRef = useRef(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/tickets/admin/all');
        setTickets(response.data || []);
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    if (editingTicket && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingTicket]);

  const activeTickets = useMemo(
    () => tickets.filter((ticket) => ticket.status !== 'Closed'),
    [tickets]
  );

  const filteredTickets = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return [...activeTickets]
      .filter((ticket) => {
        const matchesSearch =
          !keyword ||
          ticket.subject?.toLowerCase().includes(keyword) ||
          ticket.description?.toLowerCase().includes(keyword) ||
          ticket.user?.name?.toLowerCase().includes(keyword) ||
          ticket.user?.email?.toLowerCase().includes(keyword);

        const matchesStatus =
          statusFilter === 'All' || ticket.status === statusFilter;

        const matchesCategory =
          categoryFilter === 'All' || ticket.category === categoryFilter;

        const matchesPriority =
          priorityFilter === 'All' || ticket.priority === priorityFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesCategory &&
          matchesPriority
        );
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }

        if (sortOrder === 'priority') {
          return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [activeTickets, searchTerm, statusFilter, categoryFilter, priorityFilter, sortOrder]);

  return (
    <>
      {error && <div className="error-message">{error}</div>}

      <div ref={formRef}>
        {editingTicket && (
          <AdminTicketStatusForm
            tickets={tickets}
            setTickets={setTickets}
            editingTicket={editingTicket}
            setEditingTicket={setEditingTicket}
          />
        )}
      </div>

      <TicketFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        showUserSearch
      />

      {loading ? (
        <div className="card">Loading tickets...</div>
      ) : (
        <TicketList
          tickets={filteredTickets}
          setTickets={setTickets}
          setEditingTicket={setEditingTicket}
          isAdmin
        />
      )}
    </>
  );
};

export default Tickets;
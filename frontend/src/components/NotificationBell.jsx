import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../axiosConfig';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const readCount = useMemo(
    () => notifications.filter((notification) => notification.isRead).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data || []);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleDropdown = async () => {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      await fetchNotifications();
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);

      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');

      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update notifications');
    }
  };

  const clearReadNotifications = async () => {
    try {
      await api.delete('/notifications/read');

      setNotifications((prev) =>
        prev.filter((notification) => !notification.isRead)
      );
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to clear notifications');
    }
  };

  const getTicketLink = (notification) => {
    const ticketId = notification.ticket?._id || notification.ticket;

    if (!ticketId) {
      return '#';
    }

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');

    return storedUser?.role === 'admin'
      ? `/tickets/${ticketId}`
      : `/my-tickets/${ticketId}`;
  };

  return (
    <div className="notification-wrapper">
      <button
        type="button"
        className="notification-bell-button"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <span className="notification-bell-icon">🔔</span>

        {unreadCount > 0 && (
          <span className="notification-red-dot" aria-label="Unread notifications" />
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <div>
              <h4>Notifications</h4>
              <p>{unreadCount} unread</p>
            </div>

            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button type="button" onClick={markAllAsRead}>
                  Mark all read
                </button>
              )}

              {readCount > 0 && (
                <button type="button" onClick={clearReadNotifications}>
                  Clear read
                </button>
              )}
            </div>
          </div>

          {error && <div className="notification-error">{error}</div>}

          {!error && notifications.length === 0 && (
            <div className="notification-empty">No notifications yet.</div>
          )}

          {!error &&
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-card ${notification.isRead ? '' : 'notification-card-unread'
                  }`}
              >
                <div className="notification-card-title">{notification.title}</div>

                <div className="notification-card-message">
                  {notification.message}
                </div>

                <div className="notification-card-footer">
                  <Link
                    to={getTicketLink(notification)}
                    onClick={() => markAsRead(notification._id)}
                  >
                    View ticket
                  </Link>

                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification._id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
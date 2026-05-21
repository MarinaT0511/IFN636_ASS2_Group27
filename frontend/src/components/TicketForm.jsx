import { useEffect, useState } from 'react';
import api, { BACKEND_BASE_URL } from '../axiosConfig';

const defaultCategories = [
  { name: 'Hardware' },
  { name: 'Software' },
  { name: 'Network' },
  { name: 'Account' },
  { name: 'Other' },
];

const TicketForm = ({
  tickets = [],
  setTickets,
  editingTicket,
  setEditingTicket,
  isAdmin = false,
}) => {
  const [categories, setCategories] = useState(defaultCategories);

  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'Other',
    priority: 'Medium',
    status: 'Open',
    image: null,
  });

  const [existingImage, setExistingImage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getDefaultCategory = (categoryList = categories) => {
    const otherCategory = categoryList.find((category) => category.name === 'Other');
    return otherCategory?.name || categoryList[0]?.name || 'Other';
  };

  const getErrorMessage = (err) => {
    return (
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Failed to save ticket. Please check the ticket details and try again.'
    );
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        // const activeCategories = response.data || [];
        const activeCategories = Array.isArray(response.data)
          ? response.data
          : response.data.categories || [];

        if (activeCategories.length > 0) {
          setCategories(activeCategories);

          if (!editingTicket) {
            setFormData((prev) => {
              const hasCurrentCategory = activeCategories.some(
                (category) => category.name === prev.category
              );

              return {
                ...prev,
                category: hasCurrentCategory
                  ? prev.category
                  : getDefaultCategory(activeCategories),
              };
            });
          }
        }
      } catch (error) {
        setCategories(defaultCategories);
      }
    };

    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (editingTicket) {
      setFormData({
        subject: editingTicket.subject || '',
        description: editingTicket.description || '',
        category: editingTicket.category || 'Other',
        priority: editingTicket.priority || 'Medium',
        status: editingTicket.status || 'Open',
        image: null,
      });

      setExistingImage(editingTicket.image || '');
      setPreviewUrl('');
      setFileInputKey(Date.now());
      setSuccess('');
      setError('');
    }
  }, [editingTicket]);

  useEffect(() => {
    if (!formData.image) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(formData.image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.image]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;

    setError('');
    setSuccess('');

    if (!file) {
      setFormData((prev) => ({
        ...prev,
        image: null,
      }));
      setPreviewUrl('');
      return;
    }

    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      setError('Please upload an image file only.');
      setFormData((prev) => ({
        ...prev,
        image: null,
      }));
      setFileInputKey(Date.now());
      return;
    }

    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      setError(`Image file is too large. Please upload an image under ${maxSizeInMB}MB.`);
      setFormData((prev) => ({
        ...prev,
        image: null,
      }));
      setFileInputKey(Date.now());
      return;
    }

    setFormData((prev) => ({
      ...prev,
      image: file,
    }));
  };

  const clearForm = () => {
    setFormData({
      subject: '',
      description: '',
      category: getDefaultCategory(),
      priority: 'Medium',
      status: 'Open',
      image: null,
    });

    setExistingImage('');
    setPreviewUrl('');
    setError('');
    setFileInputKey(Date.now());

    if (setEditingTicket) {
      setEditingTicket(null);
    }
  };

  const buildPayload = () => {
    const payload = new FormData();

    payload.append('subject', formData.subject);
    payload.append('description', formData.description);
    payload.append('category', formData.category);
    payload.append('priority', formData.priority);

    if (isAdmin) {
      payload.append('status', formData.status);
    }

    if (formData.image) {
      payload.append('image', formData.image);
    }

    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = buildPayload();

      if (!editingTicket) {
        const response = await api.post('/tickets', payload);

        if (setTickets) {
          setTickets([response.data, ...tickets]);
        }

        clearForm();
        setSuccess('Ticket created successfully.');
      } else {
        const endpoint = isAdmin
          ? `/tickets/admin/${editingTicket._id}`
          : `/tickets/${editingTicket._id}`;

        const response = await api.put(endpoint, payload);

        if (setTickets) {
          setTickets(
            tickets.map((ticket) =>
              ticket._id === editingTicket._id ? response.data : ticket
            )
          );
        }

        clearForm();
        setSuccess('Ticket updated successfully.');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentImageSrc = existingImage
    ? `${BACKEND_BASE_URL}${existingImage}`
    : '';

  return (
    <div className="ticket-form-card fixed-ticket-form-card">
      <h3>{editingTicket ? 'Edit Ticket' : 'Create New Ticket'}</h3>

      <p>
        {editingTicket
          ? 'Update your ticket details below.'
          : 'Please provide specific details so we can assist you better.'}
      </p>

      {error && (
        <div className="ticket-alert ticket-alert-error">
          <strong>Action failed</strong>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="ticket-alert ticket-alert-success">
          <strong>Success</strong>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="ticket-form" encType="multipart/form-data">
        <div className="form-group">
          <label>Ticket Title</label>
          <input
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Briefly describe the issue"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
            >
              {categories.map((category) => (
                <option key={category._id || category.name} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
            >
              <option value="Low">Low - General inquiry</option>
              <option value="Medium">Medium - Normal issue</option>
              <option value="High">High - Urgent problem</option>
            </select>
          </div>
        </div>

        {isAdmin && editingTicket && (
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detailed steps to reproduce or details about your request..."
            required
          />
        </div>

        <div className="form-group">
          <label>Upload Image (Optional)</label>
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />

          {previewUrl && (
            <div className="ticket-image-preview-wrap">
              <span>New image preview</span>
              <img
                src={previewUrl}
                alt="Preview"
                className="ticket-image-preview"
              />
            </div>
          )}

          {!previewUrl && currentImageSrc && (
            <div className="ticket-image-preview-wrap">
              <span>Current image</span>
              <img
                src={currentImageSrc}
                alt="Current ticket"
                className="ticket-image-preview"
              />
            </div>
          )}
        </div>

        <div className="ticket-form-actions-fixed">
          {editingTicket && (
            <button type="button" className="ticket-cancel-btn" onClick={clearForm}>
              Cancel
            </button>
          )}

          <button type="submit" className="ticket-submit-btn" disabled={submitting}>
            {submitting
              ? 'Saving...'
              : editingTicket
                ? 'Update Ticket'
                : 'Submit Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TicketForm;
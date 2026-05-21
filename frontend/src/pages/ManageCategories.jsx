import { useEffect, useState } from 'react';
import api from '../axiosConfig';

const ManageCategories = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const [editingCategory, setEditingCategory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories/admin/all');
      setCategories(response.data || []);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setEditingCategory(null);
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, formData);
        setSuccess('Category updated successfully.');
      } else {
        await api.post('/categories', formData);
        setSuccess('Category created successfully.');
      }

      resetForm();
      await fetchCategories();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmDelete = window.confirm(
      `Delete category "${category.name}"? This category will be removed from the category list. Existing tickets will still keep the old category name as text.`
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/categories/${category._id}`);

      setCategories((prev) =>
        prev.filter((item) => item._id !== category._id)
      );

      if (editingCategory?._id === category._id) {
        resetForm();
      }

      setSuccess('Category deleted successfully.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="category-page">
      <div className="category-form-card">
        <div className="category-card-header">
          <div>
            <h2>{editingCategory ? 'Edit Category' : 'Create Category'}</h2>
            <p>
              Manage ticket categories used in the ticket creation form. Deleted
              categories are removed from future ticket category options.
            </p>
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}
        {success && <div className="success-text">{success}</div>}

        <form onSubmit={handleSubmit} className="category-form">
          <div className="category-form-grid">
            <div className="form-group">
              <label>Category Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Example: Printer, VPN, Email Access"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Short description for this category"
              />
            </div>
          </div>

          <div className="category-form-actions">
            {editingCategory && (
              <button type="button" className="category-secondary-btn" onClick={resetForm}>
                Cancel
              </button>
            )}

            <button type="submit" className="category-primary-btn" disabled={saving}>
              {saving
                ? 'Saving...'
                : editingCategory
                  ? 'Update Category'
                  : 'Create Category'}
            </button>
          </div>
        </form>
      </div>

      <div className="category-table-card">
        <div className="category-table-header">
          <div>
            <h2>Category List</h2>
            <p>{categories.length} category record(s)</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-text">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="empty-text">No categories found.</div>
        ) : (
          <div className="table-scroll">
            <table className="category-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Used In Tickets</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category) => (
                  <tr key={category._id}>
                    <td>
                      <div className="category-name-cell">{category.name}</div>
                    </td>

                    <td className="category-description-cell">
                      {category.description || '-'}
                    </td>

                    <td>
                      <span className="category-usage-pill">
                        {category.usageCount || 0}
                      </span>
                    </td>

                    <td>
                      <div className="category-action-group">
                        <button
                          type="button"
                          className="category-action-btn"
                          onClick={() => handleEdit(category)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="category-action-btn danger"
                          onClick={() => handleDelete(category)}
                        >
                          Delete
                        </button>
                      </div>
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

export default ManageCategories;
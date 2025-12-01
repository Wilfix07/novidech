'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';

interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1',
    is_active: true,
  });

  useEffect(() => {
    checkAdmin();
    loadCategories();
  }, []);

  const checkAdmin = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('Profile error:', profileError);
        return;
      }
      
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    } catch (err) {
      console.error('Error checking admin role:', err);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('expense_categories')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const categoryData = {
        ...formData,
        created_by: user.id,
      };

      if (editingCategory) {
        // Update existing
        const { error: updateError } = await supabase
          .from('expense_categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (updateError) throw updateError;
        setSuccess('Catégorie mise à jour avec succès!');
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from('expense_categories')
          .insert([categoryData]);

        if (insertError) throw insertError;
        setSuccess('Catégorie créée avec succès!');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#6366f1',
        is_active: true,
      });
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      is_active: category.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('expense_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Catégorie supprimée avec succès!');
      loadCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#6366f1',
      is_active: true,
    });
  };

  if (!isAdmin) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Accès refusé</h2>
            <p className="text-red-600">Vous devez être administrateur pour accéder à cette page.</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">Catégories de Dépenses</h1>
            <p className="text-gray-600">Gérez les catégories de dépenses pour organiser les transactions</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-text mb-4">
              {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={handleInputChange}
                      name="color"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Catégorie active</span>
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Sauvegarde...' : editingCategory ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-text mb-4">Liste des catégories</h2>
            {categories.length === 0 ? (
              <p className="text-gray-600 text-center py-8">Aucune catégorie trouvée</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`border-2 rounded-lg p-4 ${
                      category.is_active ? 'border-gray-200' : 'border-gray-300 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <h3 className="font-semibold text-text">{category.name}</h3>
                      </div>
                      {!category.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    )}
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import type { MembershipFormConfig, FormField } from '@/types';

export default function AdminMembershipFormPage() {
  const [formConfig, setFormConfig] = useState<MembershipFormConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error('Auth error:', authError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Profile error:', profileError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        
        if (profile?.role !== 'admin') {
          setIsAdmin(false);
          setLoading(false);
          return;
        }
        setIsAdmin(true);
        loadFormConfig();
      } catch (err) {
        console.error('Error checking admin role:', err);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  const loadFormConfig = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('membership_form_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('Error loading form config:', fetchError);
        // Continue to create default config if no config exists
      }

      if (data) {
        setFormConfig(data);
      } else {
        // Create default config
        const defaultConfig: MembershipFormConfig = {
          id: '',
          is_active: false,
          title: 'Formulaire d\'Adhésion',
          description: 'Veuillez remplir ce formulaire pour compléter votre adhésion à la mutuelle.',
          fields: [
            {
              id: '1',
              label: 'Nom complet',
              type: 'text',
              required: true,
              placeholder: 'Votre nom complet',
            },
            {
              id: '2',
              label: 'Date de naissance',
              type: 'date',
              required: true,
            },
            {
              id: '3',
              label: 'Numéro de téléphone',
              type: 'tel',
              required: true,
              placeholder: '+509 XXXX-XXXX',
            },
            {
              id: '4',
              label: 'Adresse',
              type: 'textarea',
              required: true,
              placeholder: 'Votre adresse complète',
            },
            {
              id: '5',
              label: 'Profession',
              type: 'text',
              required: false,
              placeholder: 'Votre profession',
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: null,
        };
        setFormConfig(defaultConfig);
      }
    } catch (err) {
      console.error('Error loading form config:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formConfig) return;

    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const configToSave = {
        ...formConfig,
        created_by: user.id,
      };

      if (formConfig.id) {
        // Update existing
        const { error: updateError } = await supabase
          .from('membership_form_config')
          .update(configToSave)
          .eq('id', formConfig.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { data, error: insertError } = await supabase
          .from('membership_form_config')
          .insert([configToSave])
          .select()
          .maybeSingle();

        if (insertError) throw insertError;
        if (data) setFormConfig(data);
      }

      alert('Configuration sauvegardée avec succès!');
    } catch (err) {
      console.error('Error saving form config:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    if (!formConfig) return;

    const newField: FormField = {
      id: Date.now().toString(),
      label: 'Nouveau champ',
      type: 'text',
      required: false,
    };

    setFormConfig({
      ...formConfig,
      fields: [...formConfig.fields, newField],
    });
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!formConfig) return;

    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    });
  };

  const removeField = (fieldId: string) => {
    if (!formConfig) return;

    setFormConfig({
      ...formConfig,
      fields: formConfig.fields.filter((f) => f.id !== fieldId),
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

  if (!formConfig) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-600">{error || 'Impossible de charger la configuration'}</p>
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
            <h1 className="text-3xl font-bold text-text mb-2">Configuration du Formulaire d&apos;Adhésion</h1>
            <p className="text-gray-600">Configurez le formulaire que les nouveaux membres doivent remplir</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Form Status */}
            <div className="flex items-center justify-between">
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formConfig.is_active}
                    onChange={(e) =>
                      setFormConfig({ ...formConfig, is_active: e.target.checked })
                    }
                    className="w-5 h-5 text-primary"
                  />
                  <span className="text-lg font-semibold">Activer le formulaire</span>
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Lorsque activé, les nouveaux membres devront remplir ce formulaire avant d&apos;accéder à leur profil
                </p>
              </div>
            </div>

            {/* Form Title and Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre du formulaire
                </label>
                <input
                  type="text"
                  value={formConfig.title}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formConfig.description || ''}
                  onChange={(e) =>
                    setFormConfig({ ...formConfig, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-text">Champs du formulaire</h2>
                <button
                  onClick={addField}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  + Ajouter un champ
                </button>
              </div>

              {formConfig.fields.map((field) => (
                <div
                  key={field.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) =>
                          updateField(field.id, { label: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) =>
                          updateField(field.id, {
                            type: e.target.value as FormField['type'],
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="text">Texte</option>
                        <option value="email">Email</option>
                        <option value="tel">Téléphone</option>
                        <option value="date">Date</option>
                        <option value="textarea">Zone de texte</option>
                        <option value="number">Nombre</option>
                        <option value="checkbox">Case à cocher</option>
                        <option value="select">Liste déroulante</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Placeholder (optionnel)
                    </label>
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) =>
                        updateField(field.id, { placeholder: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateField(field.id, { required: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Champ obligatoire</span>
                    </label>

                    <button
                      onClick={() => removeField(field.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


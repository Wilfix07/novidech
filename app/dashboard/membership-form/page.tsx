'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import SignatureCanvas from '@/components/forms/SignatureCanvas';
import type { MembershipFormConfig, FormField, MembershipFormSubmission } from '@/types';

export default function MembershipFormPage() {
  const [formConfig, setFormConfig] = useState<MembershipFormConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [signature, setSignature] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<MembershipFormSubmission | null>(null);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      // Get member record - use maybeSingle() to handle case where member doesn't exist
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('id, form_completed')
        .eq('profile_id', user.id)
        .maybeSingle();

      if (memberError) {
        console.error('Member error:', memberError);
        // Provide more specific error message based on error code
        let errorMessage = 'Erreur lors du chargement du profil membre.';
        if (memberError.code === 'PGRST301' || memberError.message?.includes('permission') || memberError.message?.includes('row-level security')) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à votre profil membre. Veuillez contacter un administrateur.';
        } else if (memberError.code === 'PGRST116') {
          errorMessage = 'Aucun profil membre trouvé. Veuillez contacter un administrateur pour créer votre profil.';
        } else {
          errorMessage = `Erreur lors du chargement du profil membre: ${memberError.message || 'Erreur inconnue'}`;
        }
        setError(errorMessage);
        return;
      }

      if (!member) {
        setError('Profil membre non trouvé');
        return;
      }

      setMemberId(member.id);

      // Check if form is already completed
      if (member.form_completed) {
        // Load existing submission - use maybeSingle() as submission might not exist
        const { data: submission, error: submissionError } = await supabase
          .from('membership_form_submissions')
          .select('*')
          .eq('member_id', member.id)
          .maybeSingle();

        if (submissionError) {
          console.error('Submission error:', submissionError);
          // Don't block the form if submission can't be loaded
        } else if (submission) {
          setExistingSubmission(submission);
          setFormData(submission.responses || {});
          setSignature(submission.signature_data || '');
        }
      }

      // Load active form config - use maybeSingle() to handle case where no active form exists
      const { data: config, error: configError } = await supabase
        .from('membership_form_config')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (configError) {
        console.error('Config error:', configError);
        setError('Erreur lors du chargement de la configuration du formulaire');
        return;
      }

      if (!config) {
        setError('Aucun formulaire d\'adhésion actif trouvé');
        return;
      }

      setFormConfig(config);
    } catch (err) {
      console.error('Error loading form data:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData({
      ...formData,
      [fieldId]: value,
    });
  };

  const validateForm = (): boolean => {
    if (!formConfig) return false;

    // Check all required fields
    for (const field of formConfig.fields) {
      if (field.required && !formData[field.id]) {
        setError(`Le champ "${field.label}" est obligatoire`);
        return false;
      }
    }

    // Check signature
    if (!signature) {
      setError('La signature électronique est obligatoire');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !memberId || !formConfig) {
        throw new Error('Données manquantes');
      }

      // Get IP address and user agent (client-side only)
      const ipAddress = 'N/A'; // Would need server-side API to get real IP
      const userAgent = navigator.userAgent;

      const submissionData = {
        member_id: memberId,
        profile_id: user.id,
        form_config_id: formConfig.id,
        responses: formData,
        signature_data: signature,
        signature_timestamp: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'completed',
        submitted_at: new Date().toISOString(),
      };

      if (existingSubmission) {
        // Update existing submission
        const { error: updateError } = await supabase
          .from('membership_form_submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id);

        if (updateError) throw updateError;
      } else {
        // Create new submission
        const { error: insertError } = await supabase
          .from('membership_form_submissions')
          .insert([submissionData]);

        if (insertError) throw insertError;
      }

      // The trigger will automatically update member.form_completed
      alert('Formulaire soumis avec succès! Vous pouvez maintenant accéder à votre profil.');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Sélectionnez une option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              id={field.id}
              checked={!!value}
              onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              required={field.required}
              className="w-5 h-5 text-primary"
            />
            <span>{field.placeholder || 'J\'accepte'}</span>
          </label>
        );

      default:
        return (
          <input
            type={field.type}
            id={field.id}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du formulaire...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error && !formConfig) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-600">{error}</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (!formConfig) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-yellow-800 mb-2">Aucun formulaire actif</h2>
            <p className="text-yellow-600">
              Aucun formulaire d&apos;adhésion n&apos;est actuellement actif. Veuillez contacter un administrateur.
            </p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-text mb-2">{formConfig.title}</h1>
            {formConfig.description && (
              <p className="text-gray-600">{formConfig.description}</p>
            )}
          </div>

          {existingSubmission?.status === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                ✅ Vous avez déjà complété ce formulaire. Vous pouvez le modifier ci-dessous si nécessaire.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {formConfig.fields.map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            ))}

            <SignatureCanvas
              onSignatureChange={setSignature}
              width={600}
              height={200}
            />

            {signature && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Aperçu de votre signature:</p>
                <div className="border border-gray-300 rounded bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signature}
                    alt="Signature"
                    className="max-w-full"
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> En soumettant ce formulaire, vous confirmez que les informations fournies sont exactes et vous acceptez les termes et conditions de la mutuelle.
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Soumission...' : 'Soumettre et signer'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}


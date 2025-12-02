# 🚀 Guide de Configuration Supabase - Application Mutuelle

## 📋 Vue d'Ensemble

Ce guide contient tout ce dont vous avez besoin pour configurer votre base de données Supabase PostgreSQL pour une application de **Mutuelle (Coopérative Financière)**.

## 📁 Fichiers Inclus

### 1. **SUPABASE_COMPLETE_SCHEMA_GUIDE.md**
   - Guide complet avec documentation détaillée
   - Explications de chaque table
   - Exemples d'utilisation
   - Bonnes pratiques

### 2. **supabase/complete_schema.sql**
   - Schéma SQL complet (toutes les tables)
   - Index pour optimiser les performances
   - Fonctions et triggers
   - Activation Realtime

### 3. **supabase/rls_policies.sql**
   - Toutes les politiques RLS (Row Level Security)
   - Sécurité par rôle (member, admin, treasurer, teller)
   - Politiques pour chaque table

### 4. **examples/frontend-usage-examples.ts**
   - Exemples TypeScript/React complets
   - CRUD pour toutes les tables
   - Requêtes avec jointures
   - Realtime subscriptions
   - Agrégations et statistiques

## 🎯 Application Type

**Mutuelle (Coopérative Financière)** avec:
- ✅ Gestion des membres
- ✅ Transactions financières
- ✅ Gestion des prêts
- ✅ Contributions mensuelles
- ✅ Formulaires d'adhésion
- ✅ Catégories de dépenses
- ✅ Distribution d'intérêts
- ✅ Système d'approbation

## 🗄️ Structure de la Base de Données

### Tables Principales:

1. **profiles** - Profils utilisateurs (extension de auth.users)
2. **members** - Membres de la mutuelle
3. **transactions** - Toutes les transactions financières
4. **loans** - Enregistrements de prêts
5. **contributions** - Suivi des contributions
6. **loan_config** - Configuration des prêts
7. **expense_categories** - Catégories de dépenses
8. **membership_form_config** - Configuration formulaire d'adhésion
9. **membership_form_submissions** - Soumissions formulaire
10. **interest_distributions** - Distributions d'intérêts
11. **password_change_requests** - Demandes changement mot de passe

## 🚀 Installation Rapide

### Étape 1: Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre **Project URL** et **anon key**

### Étape 2: Appliquer le Schéma

**Option A: Via Dashboard Supabase (Recommandé)**

1. Ouvrez le **SQL Editor** dans votre dashboard Supabase
2. Copiez le contenu de `supabase/complete_schema.sql`
3. Collez et exécutez dans le SQL Editor
4. Copiez le contenu de `supabase/rls_policies.sql`
5. Collez et exécutez dans le SQL Editor

**Option B: Via Supabase CLI**

```bash
# Installer Supabase CLI
npm install -g supabase

# Lier votre projet
supabase link --project-ref votre-project-ref

# Appliquer les migrations
supabase db push
```

### Étape 3: Configurer les Variables d'Environnement

Créez un fichier `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key
```

### Étape 4: Installer les Dépendances

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## 📝 Utilisation

### Exemple Basique - Lire les Membres

```typescript
import { supabase } from '@/lib/supabase';

// Lire tous les membres
const { data, error } = await supabase
  .from('members')
  .select('*');

// Lire mon propre membre
const { data: { user } } = await supabase.auth.getUser();
const { data: member } = await supabase
  .from('members')
  .select('*')
  .eq('profile_id', user.id)
  .single();
```

### Exemple Avancé - Créer une Transaction

```typescript
import { createTransaction } from '@/examples/frontend-usage-examples';

const transaction = await createTransaction({
  member_id: 'uuid-du-membre',
  type: 'contribution',
  amount: 1000.00,
  description: 'Contribution mensuelle',
});
```

### Exemple Realtime - Écouter les Nouvelles Transactions

```typescript
import { subscribeToTransactions } from '@/examples/frontend-usage-examples';

useEffect(() => {
  const unsubscribe = subscribeToTransactions((transaction) => {
    console.log('Nouvelle transaction:', transaction);
    // Mettre à jour l'état
  });

  return () => unsubscribe();
}, []);
```

## 🔒 Sécurité (RLS)

Toutes les tables ont **Row Level Security (RLS)** activé:

- **Membres**: Peuvent voir uniquement leurs propres données
- **Admins**: Peuvent voir et gérer toutes les données
- **Tellers**: Peuvent créer des transactions
- **Transactions**: Les membres voient uniquement les leurs

### Tester les Politiques RLS

```sql
-- Tester en tant qu'admin
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "admin-user-id"}';

-- Tester en tant que membre
SET request.jwt.claims = '{"sub": "member-user-id"}';
```

## 📊 Index et Performance

Tous les index nécessaires sont créés automatiquement:

- Index sur les clés étrangères
- Index sur les colonnes fréquemment recherchées
- Index composites pour les requêtes complexes

### Vérifier les Performances

```sql
-- Analyser une requête
EXPLAIN ANALYZE
SELECT * FROM transactions
WHERE member_id = 'uuid'
ORDER BY transaction_date DESC;
```

## 🔄 Realtime

Les tables suivantes sont publiées pour Realtime:

- ✅ `transactions`
- ✅ `loans`
- ✅ `contributions`

### Utilisation Realtime

```typescript
const channel = supabase
  .channel('transactions')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'transactions',
  }, (payload) => {
    console.log('Nouvelle transaction:', payload.new);
  })
  .subscribe();
```

## 🧪 Tests

### Tester les CRUD Operations

```typescript
// Test CREATE
const member = await createMember({
  profile_id: 'uuid',
  full_name: 'Test User',
});

// Test READ
const members = await getAllMembers();

// Test UPDATE
await updateMember(member.id, {
  full_name: 'Updated Name',
});

// Test DELETE
await deleteMember(member.id);
```

## 📚 Documentation Complète

Pour plus de détails, consultez:

- **SUPABASE_COMPLETE_SCHEMA_GUIDE.md** - Guide complet avec tous les détails
- **examples/frontend-usage-examples.ts** - Exemples de code complets

## ✅ Checklist de Déploiement

- [ ] Projet Supabase créé
- [ ] Schéma SQL appliqué (`complete_schema.sql`)
- [ ] Politiques RLS appliquées (`rls_policies.sql`)
- [ ] Variables d'environnement configurées
- [ ] Dépendances installées
- [ ] Client Supabase configuré
- [ ] Tests CRUD effectués
- [ ] Realtime testé
- [ ] Sécurité RLS vérifiée

## 🆘 Support

Si vous rencontrez des problèmes:

1. Vérifiez les logs Supabase Dashboard
2. Vérifiez que RLS est activé sur toutes les tables
3. Vérifiez les politiques RLS avec différents rôles
4. Consultez la documentation Supabase: [supabase.com/docs](https://supabase.com/docs)

## 📝 Notes Importantes

- ⚠️ **Sécurité**: Ne jamais exposer le `service_role` key côté client
- ⚠️ **RLS**: Toujours tester les politiques avec différents rôles
- ⚠️ **Performance**: Surveiller les requêtes lentes avec `EXPLAIN ANALYZE`
- ⚠️ **Backup**: Configurer des backups réguliers dans Supabase Dashboard

---

**Version:** 1.0.0  
**Date:** 2024-12-01  
**Application:** Mutuelle (Coopérative Financière)


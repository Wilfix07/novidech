# Nouveau Format de Numéro de Membre

## Format

Le numéro de membre suit maintenant le format : **YY-SEQUENCE-CURRENCY**

### Structure

- **YY** : 2 derniers chiffres de l'année (ex: 25 pour 2025)
- **SEQUENCE** : Numéro séquentiel à 5 chiffres (00001, 00002, etc.)
- **CURRENCY** : Code de devise
  - **01** : USD (Dollar US)
  - **02** : HTG (Gourde Haïtienne)

### Exemples

- `25-00001-01` : Premier membre créé en 2025 avec devise USD
- `25-00001-02` : Premier membre créé en 2025 avec devise HTG
- `25-00002-01` : Deuxième membre créé en 2025 avec devise USD
- `25-00002-02` : Deuxième membre créé en 2025 avec devise HTG

## Caractéristiques

1. **Séquence par année et devise** : La séquence recommence à chaque année et est indépendante pour chaque devise
2. **Génération automatique** : Le numéro est généré automatiquement par un trigger PostgreSQL
3. **Choix de devise** : L'admin peut choisir la devise (USD ou HTG) lors de la création du membre

## Utilisation

### Via l'Interface Admin

1. Accédez à **Dashboard > Gestion des Membres** (visible uniquement pour les admins)
2. Cliquez sur **"+ Créer un Membre"**
3. Sélectionnez un utilisateur approuvé
4. Remplissez les informations (nom, téléphone, adresse)
5. **Choisissez la devise** (USD ou HTG)
6. Le numéro de membre sera généré automatiquement au format : `YY-SEQUENCE-CURRENCY`

### Via SQL

```sql
-- Créer un membre avec devise USD
INSERT INTO public.members (
  profile_id,
  full_name,
  phone,
  address,
  currency,
  status
)
VALUES (
  'profile-uuid-here',
  'Jean Dupont',
  '+50912345678',
  'Port-au-Prince',
  'USD',  -- Devise USD
  'active'
);
-- Le member_id sera généré automatiquement : 25-00001-01

-- Créer un membre avec devise HTG
INSERT INTO public.members (
  profile_id,
  full_name,
  phone,
  address,
  currency,
  status
)
VALUES (
  'profile-uuid-here',
  'Marie Martin',
  '+50987654321',
  'Cap-Haïtien',
  'HTG',  -- Devise HTG
  'active'
);
-- Le member_id sera généré automatiquement : 25-00001-02
```

## Migration

### Changements dans la Base de Données

1. **Nouvelle colonne `currency`** dans la table `members`
   - Type : `TEXT`
   - Valeurs possibles : `'USD'` ou `'HTG'`
   - Valeur par défaut : `'HTG'`
   - Contrainte CHECK pour valider les valeurs

2. **Fonction `generate_member_id()` mise à jour**
   - Génère maintenant le format : `YY-SEQUENCE-CURRENCY`
   - Prend en compte la devise pour la séquence
   - La séquence est indépendante pour chaque devise et chaque année

### Migration des Membres Existants

Les membres existants ont été automatiquement mis à jour avec :
- `currency = 'HTG'` (valeur par défaut)
- Leurs `member_id` existants sont conservés (pas de modification rétroactive)

## Interface TypeScript

L'interface `Member` a été mise à jour pour inclure la devise :

```typescript
export interface Member {
  id: string;
  profile_id: string;
  member_id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  join_date: string;
  status: 'active' | 'inactive' | 'suspended';
  form_completed: boolean;
  form_submission_id: string | null;
  currency: 'USD' | 'HTG';  // Nouvelle propriété
  created_at: string;
  updated_at: string;
}
```

## Page Admin

Une nouvelle page a été créée : `/dashboard/admin/members`

**Fonctionnalités :**
- ✅ Voir tous les membres avec leur numéro, nom, téléphone, devise et statut
- ✅ Créer de nouveaux membres avec choix de la devise
- ✅ Sélectionner un utilisateur approuvé pour créer un membre
- ✅ Le numéro de membre est généré automatiquement selon le format

**Accès :**
- Visible uniquement pour les administrateurs
- Lien dans la navigation admin : "Gestion des Membres" 👥

## Notes Importantes

1. **Séquence indépendante par devise** : Les membres USD et HTG ont des séquences séparées
   - Exemple : Le premier membre USD de l'année sera `25-00001-01`
   - Le premier membre HTG de l'année sera `25-00001-02`
   - Le deuxième membre USD sera `25-00002-01`

2. **Réinitialisation annuelle** : La séquence recommence à 00001 chaque année

3. **Format unique** : Chaque membre a un numéro unique qui ne peut pas être modifié après création

4. **Compatibilité** : Les anciens membres avec l'ancien format (ex: `0001-DEC`) conservent leur numéro


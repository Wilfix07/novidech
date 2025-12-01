# Format d'ID des Membres

## Format Automatique

Chaque nouveau membre reçoit automatiquement un ID unique au format :

```
0000-MOIS
```

Où :
- `0000` = Numéro séquentiel (4 chiffres, remis à zéro chaque mois)
- `MOIS` = Abréviation du mois en français (3 lettres)

## Exemples

- `0001-NOV` - Premier membre créé en novembre
- `0002-NOV` - Deuxième membre créé en novembre
- `0001-DEC` - Premier membre créé en décembre (le compteur recommence)
- `0042-JAN` - 42ème membre créé en janvier

## Abréviations des Mois

| Mois | Abréviation |
|------|-------------|
| Janvier | JAN |
| Février | FEV |
| Mars | MAR |
| Avril | AVR |
| Mai | MAI |
| Juin | JUN |
| Juillet | JUL |
| Août | AOU |
| Septembre | SEP |
| Octobre | OCT |
| Novembre | NOV |
| Décembre | DEC |

## Fonctionnement

### Génération Automatique

L'ID est généré automatiquement lors de la création d'un nouveau membre via un trigger PostgreSQL :

1. **Déclenchement** : Avant l'insertion d'un nouveau membre
2. **Calcul** : 
   - Détermine le mois actuel
   - Compte les membres existants créés ce mois-ci
   - Incrémente le compteur
   - Formate avec 4 chiffres (remplissage de zéros)
3. **Application** : Si `member_id` n'est pas fourni, l'ID est généré automatiquement

### Comportement

- ✅ **Génération automatique** : Si `member_id` est NULL ou vide
- ✅ **Surcharge possible** : Vous pouvez toujours fournir un `member_id` personnalisé
- ✅ **Reset mensuel** : Le compteur recommence à 0001 chaque mois
- ✅ **Unique par mois** : Chaque ID est unique pour le mois donné

## Utilisation

### Créer un membre avec ID automatique

```typescript
// L'ID sera généré automatiquement
const { data, error } = await supabase
  .from('members')
  .insert({
    profile_id: user.id,
    // member_id sera généré automatiquement (ex: 0001-NOV)
    full_name: 'Jean Dupont',
    phone: '+50912345678',
    address: 'Port-au-Prince'
  });
```

### Créer un membre avec ID personnalisé

```typescript
// Vous pouvez toujours fournir un ID personnalisé
const { data, error } = await supabase
  .from('members')
  .insert({
    profile_id: user.id,
    member_id: 'CUSTOM-001', // ID personnalisé
    full_name: 'Marie Martin',
    phone: '+50912345679'
  });
```

### Via SQL

```sql
-- ID généré automatiquement
INSERT INTO public.members (profile_id, full_name, phone)
VALUES (
  'user-uuid-here',
  'Jean Dupont',
  '+50912345678'
);
-- Résultat: member_id = '0001-NOV' (ou le prochain numéro du mois)

-- ID personnalisé
INSERT INTO public.members (profile_id, member_id, full_name, phone)
VALUES (
  'user-uuid-here',
  'SPECIAL-001',
  'Marie Martin',
  '+50912345679'
);
-- Résultat: member_id = 'SPECIAL-001'
```

## Requêtes Utiles

### Voir le prochain ID qui sera généré

```sql
SELECT 
  LPAD(
    (COALESCE(MAX(CAST(SUBSTRING(member_id FROM '^([0-9]+)') AS INTEGER)), 0) + 1)::TEXT,
    4,
    '0'
  ) || '-' || 
  CASE EXTRACT(MONTH FROM NOW())
    WHEN 1 THEN 'JAN' WHEN 2 THEN 'FEV' WHEN 3 THEN 'MAR' WHEN 4 THEN 'AVR'
    WHEN 5 THEN 'MAI' WHEN 6 THEN 'JUN' WHEN 7 THEN 'JUL' WHEN 8 THEN 'AOU'
    WHEN 9 THEN 'SEP' WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DEC'
  END as next_member_id
FROM public.members
WHERE member_id LIKE '%-' || 
  CASE EXTRACT(MONTH FROM NOW())
    WHEN 1 THEN 'JAN' WHEN 2 THEN 'FEV' WHEN 3 THEN 'MAR' WHEN 4 THEN 'AVR'
    WHEN 5 THEN 'MAI' WHEN 6 THEN 'JUN' WHEN 7 THEN 'JUL' WHEN 8 THEN 'AOU'
    WHEN 9 THEN 'SEP' WHEN 10 THEN 'OCT' WHEN 11 THEN 'NOV' WHEN 12 THEN 'DEC'
  END
  AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
```

### Lister tous les membres créés ce mois-ci

```sql
SELECT member_id, full_name, created_at
FROM public.members
WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
  AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
ORDER BY member_id;
```

### Statistiques par mois

```sql
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as month,
  COUNT(*) as total_members,
  MIN(member_id) as first_id,
  MAX(member_id) as last_id
FROM public.members
WHERE member_id ~ '^[0-9]{4}-[A-Z]{3}$' -- Format automatique uniquement
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month DESC;
```

## Notes Techniques

- Le trigger s'exécute **avant** l'insertion (`BEFORE INSERT`)
- La fonction vérifie si `member_id` est NULL ou vide avant de générer
- Le compteur est basé sur les membres existants du même mois/année
- Le format utilise `LPAD` pour garantir 4 chiffres avec zéros à gauche
- La contrainte UNIQUE sur `member_id` garantit l'unicité

## Migration

Cette fonctionnalité a été ajoutée dans la migration :
- `20240104000000_auto_generate_member_id.sql`



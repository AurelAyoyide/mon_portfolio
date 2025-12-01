# Configuration Google Analytics

## Configuration déjà effectuée ✅

Le code Google Analytics est déjà intégré dans votre portfolio via le package `@next/third-parties` de Next.js.

**Fichier modifié :** `app/layout.tsx`

## Étapes pour activer Google Analytics :

### 1. Créer un compte Google Analytics
1. Va sur https://analytics.google.com/
2. Connecte-toi avec ton compte Google
3. Clique sur "Commencer à mesurer"
4. Entre les informations :
   - **Nom du compte :** "Portfolio Aurel AYOYIDE" (ou autre)
   - **Nom de la propriété :** "aurelayoyide.netlify.app"
   - **Fuseau horaire :** UTC+1 (Bénin)
   - **Devise :** XOF (Franc CFA) ou EUR

### 2. Obtenir ton ID de mesure (GA4)
1. Dans Google Analytics, va dans **Administration** (roue crantée en bas à gauche)
2. Clique sur **Flux de données**
3. Clique sur **Ajouter un flux > Web**
4. Entre l'URL : `https://aurelayoyide.netlify.app`
5. Nom du flux : "Portfolio Website"
6. Copie ton **ID DE MESURE** (format: `G-XXXXXXXXXX`)

### 3. Remplacer l'ID dans le code
Dans le fichier `app/layout.tsx`, remplace `G-XXXXXXXXXX` par ton vrai ID de mesure :

```tsx
<GoogleAnalytics gaId="G-TON-VRAI-ID-ICI" />
```

### 4. Déployer
```bash
git add .
git commit -m "feat: Add Google Analytics"
git push origin main
```

Netlify va redéployer automatiquement avec Google Analytics activé.

## Vérifier que ça fonctionne

1. Retourne sur Google Analytics
2. Va dans **Rapports > Temps réel**
3. Ouvre ton portfolio dans un nouvel onglet
4. Tu devrais voir 1 utilisateur actif en temps réel ✅

## Métriques importantes à surveiller

- **Utilisateurs** : Nombre de visiteurs uniques
- **Sessions** : Nombre de visites totales
- **Taux de rebond** : % de visiteurs qui partent sans naviguer
- **Pages vues** : Quelles sections sont les plus consultées
- **Localisation** : D'où viennent tes visiteurs (pays, villes)
- **Appareils** : Desktop vs Mobile vs Tablette
- **Sources de trafic** : Direct, LinkedIn, GitHub, etc.

## Données utiles pour tes candidatures

Après quelques semaines, tu pourras dire aux recruteurs :
- "Mon portfolio a reçu X visiteurs ce mois-ci"
- "Les recruteurs passent en moyenne X minutes sur mon site"
- "La section Projets est la plus consultée avec X% des vues"

Cela montre ton professionnalisme et ta capacité à analyser des données ! 📊

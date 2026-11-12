# Leslie Cosmétique

Site vitrine (formations et coachings en cosmétique naturelle) : Vite + React + TypeScript + Tailwind, réservations stockées dans Supabase.

## Développement

```bash
cp .env.example .env   # renseigner l'URL et la clé anon Supabase
npm install
npm run dev
```

## Production

```bash
npm run build          # génère dist/
```

Le déploiement se fait sur Netlify (voir `netlify.toml`). Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont définies dans les variables d'environnement du projet Netlify.

La configuration du site (nom, domaine, e-mail, liens de paiement, créneaux) est dans `src/data/site.ts`.

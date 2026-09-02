import 'dotenv/config';
import { accountsTable } from './account.schema.js';
import { closeDb, getDb } from './db.js';
import { listingsTable } from './listing.schema.js';

/**
 * Seeds a handful of realistic, France-wide `published` Listings so the
 * public map has something to show (Story 1.1). One `archived` row is
 * included to make the "excluded from /listings" edge case observable in a
 * fresh environment without waiting on a later epic's lifecycle job.
 *
 * `listings.employerId` is a real FK to `accounts.id` (Story 3.2), so every
 * seed Listing is attributed to one fixed, deterministic seed Employer
 * account rather than a fabricated id — `ON CONFLICT (id) DO NOTHING` below
 * keeps that account (and every Listing) idempotent across reruns, same
 * pattern as the Listings themselves.
 *
 * Each row has a fixed, deterministic `id` (rather than the schema's
 * `defaultRandom()`) so re-running this script — including two runs racing
 * each other, e.g. two `docker compose up` restarts — is genuinely
 * idempotent via `ON CONFLICT (id) DO NOTHING` at the database level,
 * instead of a check-then-insert race on a row count.
 */
const SEED_EMPLOYER_ACCOUNT_ID = '11111111-1111-4111-8111-0000000000e0';

const seedListings = [
  {
    id: '11111111-1111-4111-8111-000000000001',
    employerId: SEED_EMPLOYER_ACCOUNT_ID,
    title: 'Boulanger / Boulangère',
    employerName: 'Boulangerie du Marché',
    location: 'Paris',
    description:
      "Poste de boulanger à temps plein, horaires du matin, formation assurée sur place.",
    latitude: 48.8566,
    longitude: 2.3522,
    distributionRadiusKm: 10,
    status: 'published' as const,
  },
  {
    id: '11111111-1111-4111-8111-000000000002',
    employerId: SEED_EMPLOYER_ACCOUNT_ID,
    title: 'Développeur·se web junior',
    employerName: 'Atelier Numérique Lyonnais',
    location: 'Lyon',
    description:
      'Stack React/Node, équipe de 5 personnes, télétravail partiel possible.',
    latitude: 45.764,
    longitude: 4.8357,
    distributionRadiusKm: 10,
    status: 'published' as const,
  },
  {
    id: '11111111-1111-4111-8111-000000000003',
    employerId: SEED_EMPLOYER_ACCOUNT_ID,
    title: 'Agent·e d’entretien des espaces verts',
    employerName: 'Mairie de Bordeaux',
    location: 'Bordeaux',
    description:
      'Entretien des parcs municipaux, contrat saisonnier renouvelable.',
    latitude: 44.8378,
    longitude: -0.5792,
    distributionRadiusKm: 10,
    status: 'published' as const,
  },
  {
    id: '11111111-1111-4111-8111-000000000004',
    employerId: SEED_EMPLOYER_ACCOUNT_ID,
    title: 'Infirmier·ère à domicile',
    employerName: 'Réseau de Soins Toulousain',
    location: 'Toulouse',
    description: 'Tournées à domicile sur le secteur de Toulouse et périphérie.',
    latitude: 43.6047,
    longitude: 1.4442,
    distributionRadiusKm: 10,
    status: 'published' as const,
  },
  {
    id: '11111111-1111-4111-8111-000000000005',
    employerId: SEED_EMPLOYER_ACCOUNT_ID,
    title: 'Serveur / Serveuse',
    employerName: 'Brasserie du Vieux Port',
    location: 'Marseille',
    description: 'Service midi et soir, pourboires, mutuelle entreprise.',
    latitude: 43.2965,
    longitude: 5.3698,
    distributionRadiusKm: 10,
    status: 'published' as const,
  },
  {
    id: '11111111-1111-4111-8111-000000000006',
    employerId: SEED_EMPLOYER_ACCOUNT_ID,
    title: 'Technicien·ne de maintenance industrielle',
    employerName: 'Usine Métallurgique de Lille',
    location: 'Lille',
    description:
      'Poste retiré du marché — conservé uniquement pour vérifier l’exclusion des annonces non publiées.',
    latitude: 50.6292,
    longitude: 3.0573,
    distributionRadiusKm: 10,
    status: 'archived' as const,
  },
];

async function main(): Promise<void> {
  const db = getDb();

  await db
    .insert(accountsTable)
    .values({
      id: SEED_EMPLOYER_ACCOUNT_ID,
      email: 'seed-employer@geoemploi.local',
      passwordHash: 'not-a-real-hash-seed-only',
      role: 'Employer',
    })
    .onConflictDoNothing();

  const inserted = await db
    .insert(listingsTable)
    .values(seedListings)
    .onConflictDoNothing()
    .returning({ id: listingsTable.id });

  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${inserted.length} new listing(s) (${seedListings.length - inserted.length} already present).`,
  );
  await closeDb();
}

main().catch(async (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', error);
  // Without this, a failed seed leaves the pg pool open and the process
  // hangs instead of exiting.
  await closeDb();
  process.exitCode = 1;
});

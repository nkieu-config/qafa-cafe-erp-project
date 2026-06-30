const LOCAL_DATABASE_HOSTS = new Set(['localhost', '127.0.0.1', '::1', 'db', 'postgres']);
const REQUIRED_REMOTE_CONFIRMATION = 'WIPE_DEMO_DATABASE';

type DatabaseTarget = {
  host: string;
  database: string;
  username: string;
  isLocal: boolean;
};

function parseDatabaseTarget(connectionString?: string): DatabaseTarget | null {
  if (!connectionString) return null;

  try {
    const url = new URL(connectionString);
    return {
      host: url.hostname,
      database: url.pathname.replace(/^\//, '') || '(none)',
      username: url.username || '(none)',
      isLocal: LOCAL_DATABASE_HOSTS.has(url.hostname),
    };
  } catch {
    return null;
  }
}

function mask(value: string): string {
  if (value.length <= 3) return '***';
  return `${value.slice(0, 2)}***${value.slice(-1)}`;
}

function describeTarget(target: DatabaseTarget | null): string {
  if (!target) return 'unknown database target';
  return `host=${target.host}, database=${target.database}, user=${mask(target.username)}`;
}

/**
 * Demo seed deletes all rows. Local dev can run without extra flags, but remote
 * databases require an explicit two-step confirmation.
 */
export function assertSeedAllowed(): void {
  const target = parseDatabaseTarget(process.env.DATABASE_URL);
  const targetDescription = describeTarget(target);

  if (!target) {
    console.error('Refusing to run demo seed: DATABASE_URL is missing or invalid.');
    process.exit(1);
  }

  if (target.isLocal && process.env.NODE_ENV !== 'production') {
    console.log(`Demo seed target: ${targetDescription}`);
    return;
  }

  const allowSeed = process.env.ALLOW_DEMO_SEED === 'true';
  const confirmed = process.env.DEMO_SEED_CONFIRM === REQUIRED_REMOTE_CONFIRMATION;

  if (!allowSeed || !confirmed) {
    console.error(
      `Refusing to wipe remote database (${targetDescription}).`,
      'Set ALLOW_DEMO_SEED=true and DEMO_SEED_CONFIRM=WIPE_DEMO_DATABASE only for an intentional demo/staging database.',
    );
    process.exit(1);
  }

  console.warn(`Demo seed explicitly allowed for remote database: ${targetDescription}`);
}

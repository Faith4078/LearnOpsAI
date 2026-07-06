/**
 * Environment-variable validation.
 *
 * Every missing-config error in the app names the exact variable(s) that
 * are absent, so operators know what to fix without reading source code.
 */

export type EnvCheck =
  | { ok: true }
  | { ok: false; missing: string[]; message: string };

/**
 * Checks that every named environment variable is set and non-blank.
 * On failure, `message` names each missing variable specifically.
 */
export function checkEnv(names: readonly string[]): EnvCheck {
  const missing = names.filter((name) => {
    const value = process.env[name];
    return value === undefined || value.trim() === "";
  });

  if (missing.length === 0) {
    return { ok: true };
  }

  const label =
    missing.length === 1
      ? "Missing environment variable"
      : "Missing environment variables";
  return {
    ok: false,
    missing,
    message: `${label}: ${missing.join(", ")} (see .env.example).`,
  };
}

/** Turns a startup failure into a message the user can act on. */
export function startupErrorMessage(err: unknown, port: number): string {
  if ((err as { code?: string } | null)?.code === 'EADDRINUSE') {
    return (
      `Port ${port} ist bereits belegt. Läuft PL-Cockpit schon in einem anderen Terminal-Fenster?\n` +
      `Beende es dort mit Strg+C oder öffne einfach http://127.0.0.1:${port} im Browser.\n` +
      `(Ein anderer Port lässt sich über die Umgebungsvariable PL_COCKPIT_PORT setzen.)`
    );
  }
  return err instanceof Error ? err.message : String(err);
}

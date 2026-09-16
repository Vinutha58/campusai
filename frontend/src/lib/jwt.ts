// Reads a JWT's payload for display purposes only (name/role/expiry) — this
// does NOT verify the signature. The backend re-verifies on every protected
// request, so a tampered token simply gets rejected there; nothing here needs
// to be trusted on its own.
export function decodeJwtPayload<T>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function isExpired(exp: number): boolean {
  return Date.now() >= exp * 1000;
}

import fs from "fs";

// Local dev reads the gitignored keypair file; cloud hosts (Render, etc.) can't
// have that file, so they pass the same secret key array as an env var instead.
export function loadTreasurySecret(): number[] {
    const fromEnv = process.env.TREASURY_KEYPAIR_JSON;
    if (fromEnv) return JSON.parse(fromEnv);
    return JSON.parse(fs.readFileSync("./treasury-keypair.json", "utf8"));
}

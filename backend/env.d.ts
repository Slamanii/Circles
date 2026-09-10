declare namespace NodeJS {
    interface ProcessEnv {
        SUPABSE_URL: string
        SUPABASE_SERVICE_ROLE_KEY: string
        CORS_ALLOWED_ORIGINS?: string
        WALLET_ENCRYPTION_KEY: string
        WALLET_ENCRYPTION_KEY_VERSION?: string
    }
}

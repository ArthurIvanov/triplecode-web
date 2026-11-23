SET log_statement = none;
\getenv auth_password POSTGRES_PASSWORD
ALTER ROLE supabase_auth_admin PASSWORD :'auth_password';

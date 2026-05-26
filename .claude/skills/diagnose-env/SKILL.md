# diagnose-env

When debugging env/secret issues:
1. Check root .env, frontend/.env, and .dev.vars for conflicts
2. Check VS Code launch.json for overrides
3. For Cloudflare: run `wrangler secret list` to verify production secrets
4. Test the secret directly with curl before assuming code bug
5. Report all conflicting values found before changing anything

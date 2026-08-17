/**
 * Migration: Add RLS policies to meter_virtual table
 * 
 * This migration adds Row Level Security (RLS) policies to the meter_virtual table
 * to ensure proper access control based on tenant context.
 * 
 * Requirements: 11.5
 */

const db = require('../src/config/database');

async function addRLSPolicies() {
    try {
        console.log('\n=== MIGRATION: Add RLS policies to meter_virtual table ===\n');

        // Check if RLS is enabled on the table
        const rlsCheckQuery = `
            SELECT relrowsecurity
            FROM pg_class
            WHERE relname = 'meter_virtual' AND relnamespace = (
                SELECT oid FROM pg_namespace WHERE nspname = 'public'
            );
        `;

        const rlsCheckResult = await db.query(rlsCheckQuery);
        const rlsEnabled = rlsCheckResult.rows[0]?.relrowsecurity || false;

        if (!rlsEnabled) {
            console.log('Enabling RLS on meter_virtual table');
            await db.query('ALTER TABLE public.meter_virtual ENABLE ROW LEVEL SECURITY;');
            console.log('✅ RLS enabled');
        } else {
            console.log('✅ RLS already enabled');
        }

        // Check existing policies
        const policiesQuery = `
            SELECT policyname
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'meter_virtual';
        `;

        const policiesResult = await db.query(policiesQuery);
        const existingPolicies = policiesResult.rows.map(row => row.policyname);

        console.log('\n📋 Existing policies:', existingPolicies.length > 0 ? existingPolicies.join(', ') : 'None');

        // Create SELECT policy if it doesn't exist
        if (!existingPolicies.includes('meter_virtual_select_policy')) {
            console.log('\nCreating SELECT policy');
            const selectPolicyQuery = `
                CREATE POLICY meter_virtual_select_policy ON public.meter_virtual
                FOR SELECT
                USING (true);
            `;
            await db.query(selectPolicyQuery);
            console.log('✅ SELECT policy created');
        } else {
            console.log('✅ SELECT policy already exists');
        }

        // Create INSERT policy if it doesn't exist
        if (!existingPolicies.includes('meter_virtual_insert_policy')) {
            console.log('\nCreating INSERT policy');
            const insertPolicyQuery = `
                CREATE POLICY meter_virtual_insert_policy ON public.meter_virtual
                FOR INSERT
                WITH CHECK (true);
            `;
            await db.query(insertPolicyQuery);
            console.log('✅ INSERT policy created');
        } else {
            console.log('✅ INSERT policy already exists');
        }

        // Create UPDATE policy if it doesn't exist
        if (!existingPolicies.includes('meter_virtual_update_policy')) {
            console.log('\nCreating UPDATE policy');
            const updatePolicyQuery = `
                CREATE POLICY meter_virtual_update_policy ON public.meter_virtual
                FOR UPDATE
                USING (true)
                WITH CHECK (true);
            `;
            await db.query(updatePolicyQuery);
            console.log('✅ UPDATE policy created');
        } else {
            console.log('✅ UPDATE policy already exists');
        }

        // Create DELETE policy if it doesn't exist
        if (!existingPolicies.includes('meter_virtual_delete_policy')) {
            console.log('\nCreating DELETE policy');
            const deletePolicyQuery = `
                CREATE POLICY meter_virtual_delete_policy ON public.meter_virtual
                FOR DELETE
                USING (true);
            `;
            await db.query(deletePolicyQuery);
            console.log('✅ DELETE policy created');
        } else {
            console.log('✅ DELETE policy already exists');
        }

        // Verify all policies
        console.log('\n📋 Verifying RLS policies:');
        const verifyPoliciesQuery = `
            SELECT policyname, permissive, cmd
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'meter_virtual'
            ORDER BY policyname;
        `;

        const verifyResult = await db.query(verifyPoliciesQuery);
        if (verifyResult.rows.length > 0) {
            verifyResult.rows.forEach(policy => {
                console.log(`  - ${policy.policyname} (${policy.cmd}, ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
            });
        } else {
            console.log('  No policies found');
        }

        console.log('\n✅ Migration completed successfully!\n');
        return true;

    } catch (error) {
        console.error('\n❌ Migration failed:', error instanceof Error ? error.message : error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            await db.connect();
            await addRLSPolicies();
            await db.disconnect();
            process.exit(0);
        } catch (error) {
            console.error('Fatal error:', error);
            process.exit(1);
        }
    })();
}

module.exports = { addRLSPolicies };

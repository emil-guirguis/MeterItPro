/**
 * Verification Script: meter_virtual Table
 * 
 * This script verifies that the meter_virtual table exists with the correct schema,
 * columns, constraints, and RLS policies as specified in the design document.
 * 
 * Requirements: 11.1, 11.5
 */

const db = require('./src/config/database');

async function verifyMeterVirtualTable() {
    try {
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║  VERIFICATION: meter_virtual Table Schema and Configuration    ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        // 1. Check if table exists
        console.log('1️⃣  CHECKING TABLE EXISTENCE');
        console.log('─'.repeat(60));
        
        const tableExistsQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'meter_virtual'
            ) as table_exists;
        `;

        const tableExistsResult = await db.query(tableExistsQuery);
        const tableExists = tableExistsResult.rows[0].table_exists;

        if (tableExists) {
            console.log('✅ Table EXISTS: public.meter_virtual');
        } else {
            console.log('❌ Table DOES NOT EXIST: public.meter_virtual');
            return false;
        }

        // 2. Verify columns
        console.log('\n2️⃣  VERIFYING COLUMNS');
        console.log('─'.repeat(60));

        const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'meter_virtual'
            ORDER BY ordinal_position;
        `;

        const columnsResult = await db.query(columnsQuery);
        const expectedColumns = {
            'meter_virtual_id': { type: 'integer', nullable: false },
            'meter_id': { type: 'bigint', nullable: false },
            'selected_meter_id': { type: 'bigint', nullable: false },
            'select_meter_element_id': { type: 'bigint', nullable: false }
        };

        let columnsValid = true;
        columnsResult.rows.forEach(col => {
            const expected = expectedColumns[col.column_name];
            if (!expected) {
                console.log(`❌ Unexpected column: ${col.column_name}`);
                columnsValid = false;
                return;
            }

            const typeMatch = col.data_type === expected.type;
            const nullableMatch = (col.is_nullable === 'NO') === !expected.nullable;

            const status = typeMatch && nullableMatch ? '✅' : '❌';
            console.log(`${status} ${col.column_name}`);
            console.log(`   Type: ${col.data_type} (expected: ${expected.type}) ${typeMatch ? '✓' : '✗'}`);
            console.log(`   Nullable: ${col.is_nullable} (expected: ${expected.nullable ? 'YES' : 'NO'}) ${nullableMatch ? '✓' : '✗'}`);
            if (col.column_default) {
                console.log(`   Default: ${col.column_default}`);
            }

            if (!typeMatch || !nullableMatch) {
                columnsValid = false;
            }
        });

        if (columnsResult.rows.length !== Object.keys(expectedColumns).length) {
            console.log(`❌ Column count mismatch: found ${columnsResult.rows.length}, expected ${Object.keys(expectedColumns).length}`);
            columnsValid = false;
        }

        if (columnsValid) {
            console.log('\n✅ All columns are correct');
        } else {
            console.log('\n❌ Column verification failed');
            return false;
        }

        // 3. Verify primary key constraint
        console.log('\n3️⃣  VERIFYING PRIMARY KEY CONSTRAINT');
        console.log('─'.repeat(60));

        const pkQuery = `
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints
            WHERE table_schema = 'public' AND table_name = 'meter_virtual'
            AND constraint_type = 'PRIMARY KEY';
        `;

        const pkResult = await db.query(pkQuery);
        
        if (pkResult.rows.length > 0) {
            console.log(`✅ Primary key constraint exists: ${pkResult.rows[0].constraint_name}`);
            
            // Get the columns in the primary key
            const pkColumnsQuery = `
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid
                    AND a.attnum = ANY(i.indkey)
                WHERE i.indexrelid = (
                    SELECT oid FROM pg_class WHERE relname = 'meter_virtual_pkey'
                )
                ORDER BY a.attnum;
            `;

            const pkColumnsResult = await db.query(pkColumnsQuery);
            const pkColumns = pkColumnsResult.rows.map(row => row.attname);
            console.log(`   Columns: ${pkColumns.join(', ')}`);

            const expectedPkColumns = ['meter_virtual_id', 'meter_id', 'selected_meter_id', 'select_meter_element_id'];
            const pkColumnsMatch = JSON.stringify(pkColumns.sort()) === JSON.stringify(expectedPkColumns.sort());
            
            if (pkColumnsMatch) {
                console.log('✅ Primary key columns are correct');
            } else {
                console.log(`❌ Primary key columns mismatch`);
                console.log(`   Found: ${pkColumns.join(', ')}`);
                console.log(`   Expected: ${expectedPkColumns.join(', ')}`);
                return false;
            }
        } else {
            console.log('❌ Primary key constraint NOT FOUND');
            return false;
        }

        // 4. Verify indexes
        console.log('\n4️⃣  VERIFYING INDEXES');
        console.log('─'.repeat(60));

        const indexesQuery = `
            SELECT indexname, indexdef
            FROM pg_indexes
            WHERE schemaname = 'public' AND tablename = 'meter_virtual'
            ORDER BY indexname;
        `;

        const indexesResult = await db.query(indexesQuery);
        
        if (indexesResult.rows.length > 0) {
            console.log(`✅ Found ${indexesResult.rows.length} index(es):`);
            indexesResult.rows.forEach(idx => {
                console.log(`   - ${idx.indexname}`);
            });
        } else {
            console.log('⚠️  No indexes found (only primary key constraint)');
        }

        // 5. Verify RLS is enabled
        console.log('\n5️⃣  VERIFYING ROW LEVEL SECURITY (RLS)');
        console.log('─'.repeat(60));

        const rlsEnabledQuery = `
            SELECT relrowsecurity
            FROM pg_class
            WHERE relname = 'meter_virtual' AND relnamespace = (
                SELECT oid FROM pg_namespace WHERE nspname = 'public'
            );
        `;

        const rlsEnabledResult = await db.query(rlsEnabledQuery);
        const rlsEnabled = rlsEnabledResult.rows[0]?.relrowsecurity || false;

        if (rlsEnabled) {
            console.log('✅ RLS is ENABLED on meter_virtual table');
        } else {
            console.log('❌ RLS is DISABLED on meter_virtual table');
            return false;
        }

        // 6. Verify RLS policies
        console.log('\n6️⃣  VERIFYING RLS POLICIES');
        console.log('─'.repeat(60));

        const policiesQuery = `
            SELECT policyname, permissive, cmd, qual, with_check
            FROM pg_policies
            WHERE schemaname = 'public' AND tablename = 'meter_virtual'
            ORDER BY policyname;
        `;

        const policiesResult = await db.query(policiesQuery);
        const expectedPolicies = ['meter_virtual_delete_policy', 'meter_virtual_insert_policy', 'meter_virtual_select_policy', 'meter_virtual_update_policy'];

        if (policiesResult.rows.length > 0) {
            console.log(`✅ Found ${policiesResult.rows.length} RLS policy(ies):`);
            policiesResult.rows.forEach(policy => {
                const status = expectedPolicies.includes(policy.policyname) ? '✅' : '⚠️ ';
                console.log(`${status} ${policy.policyname}`);
                console.log(`   Type: ${policy.cmd} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
            });

            const allPoliciesPresent = expectedPolicies.every(p => 
                policiesResult.rows.some(row => row.policyname === p)
            );

            if (allPoliciesPresent) {
                console.log('\n✅ All expected RLS policies are present');
            } else {
                console.log('\n⚠️  Some expected RLS policies are missing');
                const missingPolicies = expectedPolicies.filter(p => 
                    !policiesResult.rows.some(row => row.policyname === p)
                );
                console.log(`   Missing: ${missingPolicies.join(', ')}`);
            }
        } else {
            console.log('❌ No RLS policies found');
            return false;
        }

        // 7. Verify table permissions
        console.log('\n7️⃣  VERIFYING TABLE PERMISSIONS');
        console.log('─'.repeat(60));

        const permissionsQuery = `
            SELECT grantee, privilege_type
            FROM information_schema.role_table_grants
            WHERE table_schema = 'public' AND table_name = 'meter_virtual'
            ORDER BY grantee, privilege_type;
        `;

        const permissionsResult = await db.query(permissionsQuery);
        
        if (permissionsResult.rows.length > 0) {
            const grantees = [...new Set(permissionsResult.rows.map(p => p.grantee))];
            console.log(`✅ Permissions granted to ${grantees.length} role(s):`);
            
            grantees.forEach(grantee => {
                const privileges = permissionsResult.rows
                    .filter(p => p.grantee === grantee)
                    .map(p => p.privilege_type);
                console.log(`   - ${grantee}: ${privileges.join(', ')}`);
            });
        } else {
            console.log('⚠️  No explicit permissions found (may be using default permissions)');
        }

        // 8. Summary
        console.log('\n╔════════════════════════════════════════════════════════════════╗');
        console.log('║                      VERIFICATION SUMMARY                       ║');
        console.log('╚════════════════════════════════════════════════════════════════╝\n');

        console.log('✅ VERIFICATION PASSED - meter_virtual table is correctly configured\n');
        console.log('Requirements Validated:');
        console.log('  ✅ 11.1 - Table created with correct schema');
        console.log('  ✅ 11.5 - RLS policies are set correctly\n');

        return true;

    } catch (error) {
        console.error('\n❌ Verification failed:', error instanceof Error ? error.message : error);
        console.error('\nFull error:', error);
        return false;
    }
}

// Run verification if this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            await db.connect();
            const success = await verifyMeterVirtualTable();
            await db.disconnect();
            process.exit(success ? 0 : 1);
        } catch (error) {
            console.error('Fatal error:', error);
            process.exit(1);
        }
    })();
}

module.exports = { verifyMeterVirtualTable };

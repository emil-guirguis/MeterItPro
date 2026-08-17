/**
 * Migration: Create meter_virtual table for combined meters selector
 * 
 * This migration creates the meter_virtual table that stores the relationship
 * between virtual meters and their selected physical meters/elements.
 * 
 * Requirements: 11.1, 11.5
 */

const db = require('../src/config/database');

async function createMeterVirtualTable() {
    try {
        console.log('\n=== MIGRATION: Create meter_virtual table ===\n');

        // Check if table already exists
        const checkTableQuery = `
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'meter_virtual'
            );
        `;

        const tableExists = await db.query(checkTableQuery);
        
        if (tableExists.rows[0].exists) {
            console.log('✅ meter_virtual table already exists');
            
            // Verify the schema
            const schemaQuery = `
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'meter_virtual'
                ORDER BY ordinal_position;
            `;
            
            const schemaResult = await db.query(schemaQuery);
            console.log('\n📋 Current table schema:');
            schemaResult.rows.forEach(col => {
                console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
            
            // Check for primary key
            const pkQuery = `
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints
                WHERE table_schema = 'public' AND table_name = 'meter_virtual'
                AND constraint_type = 'PRIMARY KEY';
            `;
            
            const pkResult = await db.query(pkQuery);
            if (pkResult.rows.length > 0) {
                console.log(`\n🔑 Primary key constraint: ${pkResult.rows[0].constraint_name}`);
            }
            
            // Check for RLS policies
            const rlsQuery = `
                SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
                FROM pg_policies
                WHERE schemaname = 'public' AND tablename = 'meter_virtual';
            `;
            
            try {
                const rlsResult = await db.query(rlsQuery);
                if (rlsResult.rows.length > 0) {
                    console.log('\n🔐 RLS Policies:');
                    rlsResult.rows.forEach(policy => {
                        console.log(`  - ${policy.policyname} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
                    });
                } else {
                    console.log('\n⚠️  No RLS policies found');
                }
            } catch (e) {
                console.log('\n⚠️  Could not check RLS policies (may not be enabled)');
            }
            
            return true;
        }

        // Create the sequence for meter_virtual_id
        console.log('Creating sequence: meter_virtual_meter_virtual_id_seq');
        const sequenceQuery = `
            CREATE SEQUENCE IF NOT EXISTS public.meter_virtual_meter_virtual_id_seq
            AS integer
            START WITH 1
            INCREMENT BY 1
            NO MINVALUE
            NO MAXVALUE
            CACHE 1;
        `;
        
        await db.query(sequenceQuery);
        console.log('✅ Sequence created');

        // Create the meter_virtual table
        console.log('\nCreating table: meter_virtual');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS public.meter_virtual (
                meter_virtual_id integer NOT NULL DEFAULT nextval('meter_virtual_meter_virtual_id_seq'::regclass),
                meter_id bigint NOT NULL,
                selected_meter_id bigint NOT NULL,
                select_meter_element_id bigint NOT NULL,
                CONSTRAINT meter_virtual_pkey PRIMARY KEY (meter_virtual_id, meter_id, selected_meter_id, select_meter_element_id)
            );
        `;
        
        await db.query(createTableQuery);
        console.log('✅ Table created with primary key constraint');

        // Set table owner
        console.log('\nSetting table owner to postgres');
        await db.query('ALTER TABLE public.meter_virtual OWNER to postgres;');
        console.log('✅ Owner set');

        // Grant permissions
        console.log('\nGranting permissions');
        const grantQueries = [
            'GRANT ALL ON TABLE public.meter_virtual TO anon;',
            'GRANT ALL ON TABLE public.meter_virtual TO authenticated;',
            'GRANT ALL ON TABLE public.meter_virtual TO postgres;',
            'GRANT ALL ON TABLE public.meter_virtual TO service_role;'
        ];
        
        for (const grantQuery of grantQueries) {
            await db.query(grantQuery);
        }
        console.log('✅ Permissions granted');

        // Grant sequence permissions
        console.log('\nGranting sequence permissions');
        const sequenceGrantQueries = [
            'GRANT ALL ON SEQUENCE public.meter_virtual_meter_virtual_id_seq TO anon;',
            'GRANT ALL ON SEQUENCE public.meter_virtual_meter_virtual_id_seq TO authenticated;',
            'GRANT ALL ON SEQUENCE public.meter_virtual_meter_virtual_id_seq TO postgres;',
            'GRANT ALL ON SEQUENCE public.meter_virtual_meter_virtual_id_seq TO service_role;'
        ];
        
        for (const grantQuery of sequenceGrantQueries) {
            await db.query(grantQuery);
        }
        console.log('✅ Sequence permissions granted');

        // Verify the table was created
        console.log('\n📋 Verifying table schema:');
        const verifyQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'meter_virtual'
            ORDER BY ordinal_position;
        `;
        
        const verifyResult = await db.query(verifyQuery);
        verifyResult.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
        });

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
            await createMeterVirtualTable();
            await db.disconnect();
            process.exit(0);
        } catch (error) {
            console.error('Fatal error:', error);
            process.exit(1);
        }
    })();
}

module.exports = { createMeterVirtualTable };

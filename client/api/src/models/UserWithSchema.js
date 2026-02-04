/**
 * Users Model with Schema Definition
 * 
 * Migrated to single-source-of-truth schema system
 * Single source of truth for Users entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class User extends BaseModel {
    constructor(data = {}) {
        super(data);

        // Auto-initialize all fields from schema
        User.schema.initializeFromData(this, data);
    }

    /**
     * @override
     * @returns {string}
     */
    static get tableName() {
        return 'users';
    }

    /**
     * @override
     * @returns {string}
     */
    static get primaryKey() {
        return 'users_id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====

    /**
     * @override
     */
    static get schema() {
        return defineSchema({
            entityName: 'User',
            tableName: 'users',
            description: 'User entity for authentication and authorization',

            customListColumns: {},

            // NEW: Hierarchical tab structure with embedded field definitions
            formTabs: [
                tab({
                    name: 'General',
                    order: 1,
                    sections: [
                        section({
                            name: 'Information',
                            order: 1,
                            fields: [
                                field({
                                    name: 'name',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Name',
                                    dbField: 'name',
                                    maxLength: 100,
                                    placeholder: 'John Doe',
                                    filertable: ['main'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'email',
                                    order: 2,
                                    type: FieldTypes.EMAIL,
                                    default: '',
                                    required: true,
                                    label: 'Email',
                                    dbField: 'email',
                                    maxLength: 254,
                                    placeholder: 'email@yahoo.com',
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'phone',
                                    order: 3,
                                    type: FieldTypes.PHONE,
                                    default: '',
                                    required: true,
                                    label: 'Phone',
                                    dbField: 'phone',
                                    maxLength: 20,
                                    placeholder: '(xxx) xxx-xxxx',
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'password',
                                    order: 3,
                                    type: FieldTypes.PASSWORD,
                                    default: '',
                                    required: true,
                                    label: 'Password',
                                    dbField: 'password',
                                    maxLength: 200,
                                    placeholder: '********',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'role',
                                    order: 4,
                                    type: FieldTypes.STRING,
                                    default: 'viewer',
                                    required: false,
                                    label: 'Role',
                                    dbField: 'role',
                                    maxLength: 20,
                                    enumValues: ['admin', 'manager', 'technician', 'viewer'],
                                    placeholder: 'viewer',
                                    filertable: ['true'],
                                    showOn: ['list', 'form'],
                                }),                            ],
                        }),
                        section({
                            name: 'Status',
                            order: 2,
                            maxWidth: '200px',
                            fields: [
                                field({
                                    name: 'active',
                                    order: 1,
                                    type: FieldTypes.BOOLEAN,
                                    default: true,
                                    required: false,
                                    label: 'Active Status',
                                    dbField: 'active',
                                    showOn: ['list', 'form'],
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Security',
                    order: 2,
                    sections: [
                        section({
                            name: 'Access Control',
                            order: 1,
                            fields: [
                                field({
                                    name: 'role',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: 'viewer',
                                    required: false,
                                    label: 'Role',
                                    dbField: 'role',
                                    maxLength: 20,
                                    enumValues: ['admin', 'manager', 'technician', 'viewer'],
                                    placeholder: 'viewer',
                                    filertable: ['true'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'permissions',
                                    order: 2,
                                    type: FieldTypes.JSON,
                                    default: {},
                                    required: false,
                                    label: 'Permissions',
                                    dbField: 'permissions',
                                    showOn: ['form'],
                                }),
                            ],
                        }),
                        section({
                            name: 'Password Reset',
                            order: 2,
                            fields: [
                                field({
                                    name: 'password_reset_actions',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'Password Management',
                                    dbField: '',
                                    readOnly: true,
                                    showOn: ['form'],
                                    description: 'Actions for managing user password',
                                }),
                                field({
                                    name: 'password_reset_token',
                                    order: 2,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'Reset Token',
                                    dbField: 'password_reset_token',
                                    maxLength: 200,
                                    readOnly: true,
                                    showOn: ['form'],
                                    placeholder: 'No active reset',
                                    description: 'Active password reset token if one exists',
                                }),
                                field({
                                    name: 'password_reset_expires_at',
                                    order: 3,
                                    type: FieldTypes.DATE,
                                    default: null,
                                    required: false,
                                    label: 'Token Expires',
                                    dbField: 'password_reset_expires_at',
                                    readOnly: true,
                                    showOn: ['form'],
                                    placeholder: 'No expiration',
                                    description: 'When the reset token expires',
                                }),
                            ],
                        }),
                    ],
                }),
            ],

            // Entity fields - read-only, system-managed
            entityFields: {
                users_id: field({
                    name: 'users_id',
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'ID',
                    dbField: 'users_id',
                }),
                tenant_id: field({
                    name: 'tenant_id',
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: false,
                    label: 'Tenant ID',
                    dbField: 'tenant_id',
                }),
                passwordHash: field({
                    name: 'passwordHash',
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'Password Hash',
                    dbField: 'passwordhash',
                    maxLength: 200,
                    readOnly: true,
                }),
                createdAt: field({
                    name: 'createdAt',
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Created At',
                    dbField: 'created_at',
                }),
                updatedAt: field({
                    name: 'updatedAt',
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Updated At',
                    dbField: 'updated_at',
                }),
                lastLogin: field({
                    name: 'lastLogin',
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Last Login',
                    dbField: 'last_login_at',
                }),
                passwordChangedAt: field({
                    name: 'passwordChangedAt',
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Password Changed At',
                    dbField: 'password_changed_at',
                }),
                failedLoginAttempts: field({
                    name: 'failedLoginAttempts',
                    type: FieldTypes.NUMBER,
                    default: 0,
                    readOnly: false,
                    label: 'Failed Login Attempts',
                    dbField: 'failed_login_attempts',
                }),
                lockedUntil: field({
                    name: 'lockedUntil',
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: false,
                    label: 'Locked Until',
                    dbField: 'locked_until',
                }),
            },

            // Relationships
            relationships: {
                tenant: relationship({
                    type: RelationshipTypes.BELONGS_TO,
                    model: 'Tenant',
                    foreignKey: 'tenant_id',
                    autoLoad: false,
                }),
            },

            validation: {},
        });
    }

    // ===== CUSTOM AUTHENTICATION METHODS =====

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<User|null>} User instance or null
     */
    static async findByEmail(email) {
        console.log('\n' + '='.repeat(120));
        console.log('[USER MODEL] findByEmail called with email:', email);
        const result = await this.findOne({ email });

        if (result) {
            console.log('[USER MODEL] ✓ User found by email');
            console.log('[USER MODEL] User object keys:', Object.keys(result));
            console.log('[USER MODEL] User data:', {
                users_id: result.users_id,
                email: result.email,
                name: result.name,
                role: result.role,
                tenant_id: result.tenant_id,
                active: result.active
            });
        } else {
            console.log('[USER MODEL] ✗ User NOT found by email');
        }
        console.log('='.repeat(120) + '\n');

        return result;
    }

    /**
     * Compare password with stored hash
     * @param {string} password - Plain text password
     * @returns {Promise<boolean>} True if password matches
     */
    async comparePassword(password) {
        // Validate password parameter is non-empty string
        if (!password || typeof password !== 'string' || password.trim() === '') {
            console.warn('comparePassword called with invalid password parameter');
            return false;
        }

        // Validate passwordHash property is non-empty string
        // @ts-ignore - passwordHash is dynamically set by schema initialization
        if (!this.passwordHash || typeof this.passwordHash !== 'string' || 
            // @ts-ignore - passwordHash is dynamically set by schema initialization
            this.passwordHash.trim() === '') {
            // @ts-ignore - email and id are dynamically set by schema initialization
            console.error(`comparePassword: User ${this.email || this.id || 'unknown'} has missing or invalid passwordHash`);
            // @ts-ignore - passwordHash is dynamically set by schema initialization
            console.error(`comparePassword: this.passwordHash = ${this.passwordHash}`);
            console.error(`comparePassword: this keys = ${Object.keys(this)}`);
            return false;
        }

        const bcrypt = require('bcryptjs');
        // @ts-ignore - passwordHash is dynamically set by schema initialization
        return await bcrypt.compare(password, this.passwordHash);
    }

    /**
     * Update last login timestamp
     * @returns {Promise<User>} Updated user instance
     */
    async updateLastLogin() {
        return await this.update({
            lastLogin: new Date()
        });
    }

    /**
     * Hash password
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    static async hashPassword(password) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    }

    // ===== PERMISSIONS METHODS =====

    /**
     * Validate permissions object structure
     * Ensures permissions follow the nested object format: { module: { action: boolean } }
     * @param {any} permissionsObj - Permissions object to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validatePermissionsObject(permissionsObj) {
        const PermissionsService = require('../services/PermissionsService');
        return PermissionsService.validatePermissionsObject(permissionsObj);
    }

    /**
     * Convert stored permissions to nested object format
     * Handles both JSON string storage and direct object storage
     * @returns {Object} Nested permissions object { module: { action: boolean } }
     */
    getPermissionsAsNestedObject() {
        const PermissionsService = require('../services/PermissionsService');

        // @ts-ignore - permissions is dynamically set by schema initialization
        const storedPermissions = this.permissions;

        // If permissions is a string (JSON), parse it
        if (typeof storedPermissions === 'string') {
            try {
                const parsed = JSON.parse(storedPermissions);
                
                // If it's a flat array, convert to nested object
                if (Array.isArray(parsed)) {
                    return PermissionsService.toNestedObject(parsed);
                }
                
                // If it's a nested object, validate and return
                if (PermissionsService.validatePermissionsObject(parsed)) {
                    return parsed;
                }
            } catch (e) {
                console.warn('Failed to parse permissions JSON:', e);
            }
        }

        // If permissions is already an object, validate and return
        if (typeof storedPermissions === 'object' && storedPermissions !== null && !Array.isArray(storedPermissions)) {
            if (PermissionsService.validatePermissionsObject(storedPermissions)) {
                return storedPermissions;
            }
        }

        // If permissions is an array (old format), convert to nested object
        if (Array.isArray(storedPermissions)) {
            return PermissionsService.toNestedObject(storedPermissions);
        }

        // Fallback: return empty permissions object
        return PermissionsService.getPermissionsByRole('viewer');
    }

    /**
     * Convert stored permissions to flat array format
     * Useful for API responses
     * @returns {Array<string>} Flat array of permissions (e.g., ['user:create', 'meter:read'])
     */
    getPermissionsAsFlatArray() {
        const PermissionsService = require('../services/PermissionsService');
        const nestedObj = this.getPermissionsAsNestedObject();
        return PermissionsService.toFlatArray(nestedObj);
    }

    /**
     * Set permissions from nested object format
     * Stores as JSON string in database
     * @param {Object} permissionsObj - Nested permissions object { module: { action: boolean } }
     * @returns {boolean} True if set successfully, false if invalid
     */
    setPermissionsFromNestedObject(permissionsObj) {
        if (!this.validatePermissionsObject(permissionsObj)) {
            console.warn('Invalid permissions object provided to setPermissionsFromNestedObject');
            return false;
        }

        // Store as JSON string
        // @ts-ignore - permissions is dynamically set by schema initialization
        this.permissions = JSON.stringify(permissionsObj);
        return true;
    }

    /**
     * Set permissions from flat array format
     * Converts to nested object and stores as JSON string
     * @param {Array<string>} flatArray - Flat array of permissions (e.g., ['user:create', 'meter:read'])
     * @returns {boolean} True if set successfully, false if invalid
     */
    setPermissionsFromFlatArray(flatArray) {
        const PermissionsService = require('../services/PermissionsService');
        const nestedObj = PermissionsService.toNestedObject(flatArray);
        return this.setPermissionsFromNestedObject(nestedObj);
    }
}

module.exports = User;

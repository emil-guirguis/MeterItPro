# Favorites Schema Update - Generic Implementation

## Overview

The favorites table has been updated to use generic column names, making it framework-agnostic and reusable for any entity type (not just meters).

## Schema Changes

### Old Schema
```sql
CREATE TABLE favorite (
  favorite_id SERIAL PRIMARY KEY,
  tenant_id BIGINT,
  users_id BIGINT,
  meter_id BIGINT,
  meter_element_id BIGINT
);
```

### New Schema
```sql
CREATE TABLE favorite (
  favorite_id SERIAL PRIMARY KEY,
  id1 BIGINT NOT NULL DEFAULT 0,  -- tenant_id
  id2 BIGINT NOT NULL DEFAULT 0,  -- user_id
  id3 BIGINT NOT NULL DEFAULT 0,  -- entity_id (e.g., meter_id)
  id4 BIGINT NOT NULL DEFAULT 0   -- sub_entity_id (e.g., meter_element_id)
);
```

## Column Mapping

| New Column | Old Column | Purpose |
|-----------|-----------|---------|
| id1 | tenant_id | Identifies the organization/tenant |
| id2 | users_id | Identifies the user who favorited the item |
| id3 | meter_id | Primary entity identifier (e.g., meter_id) |
| id4 | meter_element_id | Secondary entity identifier (e.g., meter_element_id, 0 if not applicable) |

## Benefits

1. **Framework Agnostic**: Can be used for any entity type (meters, contacts, devices, etc.)
2. **Scalable**: No need to create new tables for different entity types
3. **Flexible**: Supports both single-entity and hierarchical favorites
4. **Generic**: Works with any application using the framework

## Implementation Files

### Database
- `client/backend/migrations/012_rename_favorite_columns.sql` - Migration script

### Backend
- `client/backend/src/routes/favorites.js` - Generic favorites API endpoints
- `client/backend/src/server.js` - Route registration

### Frontend
- `MeterItPro/frontend/src/services/favoritesService.ts` - Updated service with generic methods
- `MeterItPro/frontend/src/components/sidebar-meters/types.ts` - Updated Favorite interface
- `MeterItPro/frontend/src/components/sidebar-meters/SidebarMetersSection.tsx` - Updated component
- `MeterItPro/frontend/src/components/sidebar-meters/MetersList.tsx` - Updated component

## API Endpoints

### GET /api/favorites
Get all favorites for a user in a tenant

**Query Parameters:**
- `id1` (required): Tenant ID
- `id2` (required): User ID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "favorite_id": 1,
      "id1": 1,
      "id2": 1,
      "id3": 100,
      "id4": 0
    }
  ]
}
```

### POST /api/favorites
Create a new favorite

**Request Body:**
```json
{
  "id1": 1,      // tenant_id
  "id2": 1,      // user_id
  "id3": 100,    // entity_id
  "id4": 0       // sub_entity_id (optional, defaults to 0)
}
```

### DELETE /api/favorites
Delete a favorite

**Query Parameters:**
- `id1` (required): Tenant ID
- `id2` (required): User ID
- `id3` (required): Entity ID
- `id4` (optional): Sub-entity ID (defaults to 0)

## Service Methods

### favoritesService.getFavorites(tenantId, userId)
Get all favorites for a user in a tenant

### favoritesService.addFavorite(tenantId, userId, entityId, subEntityId?)
Add a favorite for an entity

### favoritesService.removeFavorite(tenantId, userId, entityId, subEntityId?)
Remove a favorite for an entity

### favoritesService.isFavorite(favorites, entityId, subEntityId?)
Check if an entity is favorited

## Migration Steps

1. Run the migration script: `012_rename_favorite_columns.sql`
2. Update the backend to use the new API endpoints
3. Update the frontend services to use the new column names
4. Test the favorites functionality

## Future Use Cases

The generic schema supports:
- **Meters**: id3 = meter_id, id4 = meter_element_id
- **Contacts**: id3 = contact_id, id4 = 0
- **Devices**: id3 = device_id, id4 = 0
- **Reports**: id3 = report_id, id4 = 0
- **Any hierarchical entity**: id3 = parent_id, id4 = child_id

## Notes

- The `id4` column defaults to 0 for single-entity favorites
- All columns are indexed for optimal query performance
- The schema maintains backward compatibility with existing data
- The implementation is fully type-safe with TypeScript interfaces

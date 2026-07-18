import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

/**
 * Hook that provides validation data for form fields
 * Handles fetching and formatting data for validation dropdowns
 */
export const useValidationDataProvider = () => {
  const auth = useAuth();

  return async (entityName: string, fieldDef: any): Promise<Array<{ id: any; label: string }>> => {
    console.log(`[ValidationDataProvider] Fetching data for entity: ${entityName}`);
    console.log(`[ValidationDataProvider] Auth state:`, {
      isAuthenticated: auth.isAuthenticated,
      userTenant: auth.user?.client,
      locationsCount: auth.locations?.length || 0,
      locationsArray: auth.locations,
    });

    // Handle location entity
    if (entityName === 'location') {
      console.log(`[ValidationDataProvider] Getting locations from auth context`);

      // Get locations directly from auth context (backend already filters by tenant)
      let locations = auth.locations || [];

      if (!locations || locations.length === 0) {
        console.warn(`[ValidationDataProvider] No locations found in auth context, attempting to fetch from API`);
        console.warn(`[ValidationDataProvider] Full auth state:`, auth);
        
        // Fallback: fetch locations from API if not in auth context
        try {
          const response = await (authService as any).apiClient.get('/location');
          console.log(`[ValidationDataProvider] Location API response:`, response.data);
          
          if (response.data.success && response.data.data?.items) {
            locations = response.data.data.items;
            console.log(`[ValidationDataProvider] Fetched ${locations.length} locations from API`);
          } else {
            console.warn(`[ValidationDataProvider] Location API response missing items`);
            return [];
          }
        } catch (error) {
          console.error(`[ValidationDataProvider] Failed to fetch locations from API:`, error);
          return [];
        }
      }

      console.log(`[ValidationDataProvider] Found ${locations.length} locations`);

      // Map locations to options using labelField from fieldDef
      const labelField = fieldDef.validationFields?.[0] || 'name';
      const options = locations.map((location: any) => {
        console.log(`[ValidationDataProvider] Location object:`, location);
        return {
          id: location.location_id || location.id,
          label: location[labelField] || `${entityName} ${location.location_id || location.id}`,
        };
      });

      console.log(`[ValidationDataProvider] Mapped ${options.length} location options`);
      options.forEach((opt: any, idx: number) => {
        console.log(`  [${idx}] ID: ${opt.id}, Label: ${opt.label}`);
      });
      return options;
    }

    // Handle device entity
    if (entityName === 'device') {
      console.log(`[ValidationDataProvider] Fetching devices from API`);

      try {
        // Use authService's axios client which has proper interceptors and token handling
        // Fetch all devices (override default pagination limit)
        const response = await (authService as any).apiClient.get('/device', { params: { limit: 1000 } });

        console.log(`[ValidationDataProvider] Device response:`, response.data);

        // Handle both response formats: { success, data: { items } } and direct array
        let devices = [];
        if (response.data.success && response.data.data?.items) {
          devices = response.data.data.items;
        } else if (Array.isArray(response.data)) {
          devices = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          devices = response.data.data;
        }

        if (devices.length === 0) {
          console.warn(`[ValidationDataProvider] No devices found in response`);
          return [];
        }

        console.log(`[ValidationDataProvider] Fetched ${devices.length} devices`);

        // Map devices to options using multiple validation fields
        const validationFields = fieldDef.validationFields || ['manufacturer', 'model_number'];
        
        const options = devices.map((device: any) => {
          console.log(`[ValidationDataProvider] Device object:`, device);
          
          // Combine multiple fields for the label
          const labelParts = validationFields
            .map((field: string) => device[field])
            .filter((val: any) => val && String(val).trim() !== '');
          
          // Use combined label or fallback to device_id
          const label = labelParts.length > 0 ? labelParts.join(' - ') : `Device ${device.device_id || device.id}`;

          return {
            id: device.device_id || device.id,
            label,
          };
        });

        console.log(`[ValidationDataProvider] Mapped ${options.length} device options`);
        return options;
      } catch (error) {
        console.error(`[ValidationDataProvider] Error fetching devices:`, error);
        return [];
      }
    }

    // Handle meter_element entity
    if (entityName === 'meter_element') {
      console.log(`[ValidationDataProvider] Fetching meter elements from API`);

      try {
        // Get the meter_id from fieldDef if available (for filtering)
        const meterId = fieldDef.meterId || fieldDef.meter_id;
        
        if (!meterId) {
          console.warn(`[ValidationDataProvider] No meter_id provided for meter_element filtering`);
          return [];
        }

        // Use authService's axios client which has proper interceptors and token handling
        const response = await (authService as any).apiClient.get(`/dashboard/meters/${meterId}/elements`);

        console.log(`[ValidationDataProvider] Meter elements response:`, response.data);

        // Handle response format: { success, data: Array }
        let elements = [];
        if (response.data.success && Array.isArray(response.data.data)) {
          elements = response.data.data;
        } else if (Array.isArray(response.data)) {
          elements = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          elements = response.data.data;
        }

        if (elements.length === 0) {
          console.warn(`[ValidationDataProvider] No meter elements found for meter ${meterId}`);
          return [];
        }

        console.log(`[ValidationDataProvider] Fetched ${elements.length} meter elements`);

        // Map meter elements to options, combining element and name for display
        const options = elements.map((element: any) => {
          console.log(`[ValidationDataProvider] Meter element object:`, element);
          
          // Combine element designation and name for the label
          const label = element.element && element.name 
            ? `${element.element} - ${element.name}`
            : element.name || element.element || `Element ${element.id}`;

          return {
            id: element.id,
            label,
          };
        });

        console.log(`[ValidationDataProvider] Mapped ${options.length} meter element options`);
        return options;
      } catch (error) {
        console.error(`[ValidationDataProvider] Error fetching meter elements:`, error);
        return [];
      }
    }

    // Handle sync_server entity (meter → sync server assignment)
    if (entityName === 'sync_server') {
      try {
        const response = await (authService as any).apiClient.get('/sync-servers');

        let servers = [];
        if (response.data.success && Array.isArray(response.data.data)) {
          servers = response.data.data;
        } else if (response.data.data?.items) {
          servers = response.data.data.items;
        } else if (Array.isArray(response.data)) {
          servers = response.data;
        }

        const labelField = fieldDef.validationFields?.[0] || 'name';
        return servers.map((server: any) => ({
          id: server.sync_server_id,
          label: server[labelField] || `Sync Server ${server.sync_server_id}`,
        }));
      } catch (error) {
        console.error(`[ValidationDataProvider] Error fetching sync servers:`, error);
        return [];
      }
    }

    // Add more entity types here as needed
    console.warn(`[ValidationDataProvider] Entity type '${entityName}' not yet supported`);
    return [];
  };
};

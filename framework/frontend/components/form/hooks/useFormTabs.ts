import { useMemo } from 'react';

export interface FormFieldDefinition {
  showOn?: string[];
  label?: string;
  [key: string]: any;
}

export interface FieldRef {
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];
}

export interface Section {
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];
  fields: FieldRef[];
  minWidth?: string | null;
  maxWidth?: string | null;
}

export interface Tab {
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];
  sections: Section[];
}

export interface TabInfo {
  label: string;
  order: number;
  sections: Record<string, string[]>;
}

export interface UseFormTabsResult {
  tabs: Record<string, TabInfo>;
  tabList: string[];
  fieldSections: Record<string, string[]>;
}

/**
 * Hook for managing form tabs and field organization
 * 
 * Organizes form fields into tabs and sections based on the hierarchical
 * formTabs structure defined in the schema.
 * 
 * Handles sorting by tab order, section order, and field order.
 * 
 * Filters tabs, sections, and fields based on the meterType and their visibleFor properties:
 * - Tabs: If a tab has no visibleFor property, it's always visible (backward compatible)
 * - Sections: If a section has no visibleFor property, it's always visible
 * - Fields: If a field has no visibleFor property, it's always visible
 * - When meterType is provided, only tabs/sections/fields matching the meterType are shown
 * - When meterType is null/undefined, all tabs/sections/fields are shown (default behavior)
 * 
 * @param formTabs - Array of Tab definitions with hierarchical structure
 * @param activeTab - Currently active tab name
 * @param meterType - Optional meter type ('physical' | 'virtual') for filtering tabs, sections, and fields
 * @returns Object containing organized tabs, tab list, and field sections for active tab
 * 
 * @example
 * ```tsx
 * const { tabs, tabList, fieldSections } = useFormTabs(schema.formTabs, activeTab, 'physical');
 * 
 * // Render tabs
 * {tabList.map(tabName => (
 *   <button key={tabName} onClick={() => setActiveTab(tabName)}>
 *     {tabs[tabName].label}
 *   </button>
 * ))}
 * 
 * // Render fields for active tab
 * {Object.entries(fieldSections).map(([sectionName, fields]) => (
 *   <div key={sectionName}>
 *     <h3>{sectionName}</h3>
 *     {fields.map(fieldName => renderField(fieldName))}
 *   </div>
 * ))}
 * ```
 */
function processFormTabs(
  formTabs: Tab[] | undefined,
  activeTab: string,
  meterType?: 'physical' | 'virtual' | null
): UseFormTabsResult {
  if (!formTabs || formTabs.length === 0) {
    return { tabs: {}, tabList: [], fieldSections: {} };
  }

  console.log('[useFormTabs] Processing tabs with meterType:', meterType);
  console.log('[useFormTabs] Input formTabs:', formTabs);

  // Filter tabs based on visibleFor property and meterType
  const filteredTabs = formTabs.filter((tab) => {
    // If tab has no visibleFor property, always include it (backward compatible)
    if (!tab.visibleFor || tab.visibleFor.length === 0) {
      return true;
    }

    // If meterType is null or undefined, include all tabs (default behavior)
    if (meterType === null || meterType === undefined) {
      return true;
    }

    // If meterType matches any value in visibleFor, include the tab
    return tab.visibleFor.includes(meterType);
  });

  console.log('[useFormTabs] Filtered tabs:', filteredTabs);

  interface FieldWithOrder {
    name: string;
    order: number;
  }

  interface TabInfoInternal {
    label: string;
    order: number;
    sections: Record<string, { fields: FieldWithOrder[]; order: number }>;
  }

  const tabsMap: Record<string, TabInfoInternal> = Object.create(null);

  // Process each tab (using filtered tabs)
  filteredTabs.forEach((tab) => {
    const tabName = tab.name;
    const tabOrder = tab.order ?? 999;

    // Initialize tab
    tabsMap[tabName] = {
      label: tabName,
      order: tabOrder,
      sections: {},
    };

    // Process sections within tab
    if (tab.sections && Array.isArray(tab.sections)) {
      tab.sections.forEach((section) => {
        console.log(`[useFormTabs] Processing section: ${section.name}, visibleFor:`, section.visibleFor, 'meterType:', meterType);
        
        // Filter sections based on visibleFor property and meterType
        if (section.visibleFor && section.visibleFor.length > 0) {
          // If section has visibleFor property and meterType is provided
          if (meterType !== null && meterType !== undefined) {
            // Only include section if meterType matches
            if (!section.visibleFor.includes(meterType)) {
              console.log(`[useFormTabs] ❌ Filtering out section: ${section.name} (visibleFor: ${section.visibleFor}, meterType: ${meterType})`);
              return; // Skip this section
            }
          }
          // If meterType is null/undefined, include all sections (default behavior)
        }

        console.log(`[useFormTabs] ✅ Including section: ${section.name}`);

        const sectionName = section.name;
        const sectionOrder = section.order ?? 999;

        // Initialize section
        tabsMap[tabName].sections[sectionName] = {
          fields: [],
          order: sectionOrder,
        };

        // Process fields within section
        if (section.fields && Array.isArray(section.fields)) {
          section.fields.forEach((fieldRef) => {
            console.log(`[useFormTabs] Processing field: ${fieldRef.name}, visibleFor:`, fieldRef.visibleFor, 'meterType:', meterType);
            
            // Filter fields based on visibleFor property and meterType
            if (fieldRef.visibleFor && fieldRef.visibleFor.length > 0) {
              // If field has visibleFor property and meterType is provided
              if (meterType !== null && meterType !== undefined) {
                // Only include field if meterType matches
                if (!fieldRef.visibleFor.includes(meterType)) {
                  console.log(`[useFormTabs] ❌ Filtering out field: ${fieldRef.name} (visibleFor: ${fieldRef.visibleFor}, meterType: ${meterType})`);
                  return; // Skip this field
                }
              }
              // If meterType is null/undefined, include all fields (default behavior)
            }

            console.log(`[useFormTabs] ✅ Including field: ${fieldRef.name}`);

            // Handle both full field definitions and field references
            const fieldName = fieldRef.name || (typeof fieldRef === 'string' ? fieldRef : null);
            if (!fieldName) {
              console.warn('[useFormTabs] Field reference missing name:', fieldRef);
              return;
            }
            
            const fieldOrder = fieldRef.order ?? 999;
            const fieldWithOrder: FieldWithOrder = {
              name: fieldName,
              order: fieldOrder,
            };
            tabsMap[tabName].sections[sectionName].fields.push(fieldWithOrder);
          });
        }
      });
    }
  });

  // Sort tabs by order and build final structure
  const sortedTabsList = Object.entries(tabsMap)
    .sort(([, a], [, b]) => a.order - b.order);

  const sortedTabs: Record<string, TabInfo> = Object.create(null);
  sortedTabsList.forEach(([tabName, tab]) => {
    // Sort sections within tab
    const sortedSections = Object.entries(tab.sections)
      .sort(([, a], [, b]) => a.order - b.order)
      .reduce((sectionAcc, [sectionName, section]) => {
        // Sort fields within section by fieldOrder
        const sortedFields = section.fields
          .sort((a, b) => a.order - b.order)
          .map(f => f.name);

        sectionAcc[sectionName] = sortedFields;
        return sectionAcc;
      }, Object.create(null) as Record<string, string[]>);

    sortedTabs[tabName] = {
      label: tab.label,
      order: tab.order ?? 999,
      sections: sortedSections,
    };
  });

  // Build field sections for current tab
  const currentTabSections: Record<string, string[]> = Object.create(null);
  if (sortedTabs[activeTab]) {
    Object.assign(currentTabSections, sortedTabs[activeTab].sections);
  } else if (activeTab && Object.keys(sortedTabs).length > 0) {
    // Fallback: if activeTab doesn't match, use first tab
    const firstTabName = Object.keys(sortedTabs)[0];
    console.warn(`[useFormTabs] Active tab "${activeTab}" not found, using first tab "${firstTabName}"`);
    Object.assign(currentTabSections, sortedTabs[firstTabName].sections);
  }

  // Get sorted tab list
  const tabList = Object.entries(sortedTabs)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([tabName]) => tabName);

  return { tabs: sortedTabs, tabList, fieldSections: currentTabSections };
}

export const useFormTabs = (
  formTabs: Tab[] | null | undefined,
  activeTab: string,
  meterType?: 'physical' | 'virtual' | null
): UseFormTabsResult => {
  return useMemo(() => {
    return processFormTabs(formTabs || undefined, activeTab, meterType);
  }, [formTabs, activeTab, meterType]);
};

export default useFormTabs;

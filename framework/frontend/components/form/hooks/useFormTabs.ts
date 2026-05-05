import { useMemo } from 'react';

export interface FormFieldDefinition {
  showOn?: string[];
  label?: string;
  [key: string]: any;
}

export interface FieldRef {
  name: string;
  order?: number | null;
  visibleFor?: string[];
}

export interface Section {
  name: string;
  order?: number | null;
  visibleFor?: string[];
  fields: FieldRef[];
  minWidth?: string | null;
  maxWidth?: string | null;
}

export interface Tab {
  name: string;
  order?: number | null;
  visibleFor?: string[];
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
 * Hook for managing form tabs and field organization.
 *
 * Organizes form fields into tabs and sections based on the hierarchical
 * formTabs structure defined in the schema, sorted by tab/section/field order.
 *
 * Filters tabs, sections, and fields by an opaque `variant` string matched
 * against each item's `visibleFor` array. When `variant` is null/undefined,
 * everything is shown. When an item has no `visibleFor`, it is always shown.
 *
 * @param formTabs - Array of Tab definitions
 * @param activeTab - Currently active tab name
 * @param variant - Optional opaque variant key for filtering (e.g. 'physical', 'virtual', 'admin')
 */
function processFormTabs(
  formTabs: Tab[] | undefined,
  activeTab: string,
  variant?: string | null
): UseFormTabsResult {
  if (!formTabs || formTabs.length === 0) {
    return { tabs: {}, tabList: [], fieldSections: {} };
  }

  const matchesVariant = (visibleFor?: string[]): boolean => {
    if (!visibleFor || visibleFor.length === 0) return true;
    if (variant === null || variant === undefined) return true;
    return visibleFor.includes(variant);
  };

  const filteredTabs = formTabs.filter((tab) => matchesVariant(tab.visibleFor));

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

  filteredTabs.forEach((tab) => {
    const tabName = tab.name;
    const tabOrder = tab.order ?? 999;

    tabsMap[tabName] = {
      label: tabName,
      order: tabOrder,
      sections: {},
    };

    if (tab.sections && Array.isArray(tab.sections)) {
      tab.sections.forEach((section) => {
        if (!matchesVariant(section.visibleFor)) return;

        const sectionName = section.name;
        const sectionOrder = section.order ?? 999;

        tabsMap[tabName].sections[sectionName] = {
          fields: [],
          order: sectionOrder,
        };

        if (section.fields && Array.isArray(section.fields)) {
          section.fields.forEach((fieldRef) => {
            if (!matchesVariant(fieldRef.visibleFor)) return;

            const fieldName = fieldRef.name || (typeof fieldRef === 'string' ? fieldRef : null);
            if (!fieldName) {
              console.warn('[useFormTabs] Field reference missing name:', fieldRef);
              return;
            }

            const fieldOrder = fieldRef.order ?? 999;
            tabsMap[tabName].sections[sectionName].fields.push({
              name: fieldName,
              order: fieldOrder,
            });
          });
        }
      });
    }
  });

  const sortedTabsList = Object.entries(tabsMap)
    .sort(([, a], [, b]) => a.order - b.order);

  const sortedTabs: Record<string, TabInfo> = Object.create(null);
  sortedTabsList.forEach(([tabName, tab]) => {
    const sortedSections = Object.entries(tab.sections)
      .sort(([, a], [, b]) => a.order - b.order)
      .reduce((sectionAcc, [sectionName, section]) => {
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

  const currentTabSections: Record<string, string[]> = Object.create(null);
  if (sortedTabs[activeTab]) {
    Object.assign(currentTabSections, sortedTabs[activeTab].sections);
  } else if (activeTab && Object.keys(sortedTabs).length > 0) {
    const firstTabName = Object.keys(sortedTabs)[0];
    console.warn(`[useFormTabs] Active tab "${activeTab}" not found, using first tab "${firstTabName}"`);
    Object.assign(currentTabSections, sortedTabs[firstTabName].sections);
  }

  const tabList = Object.entries(sortedTabs)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([tabName]) => tabName);

  return { tabs: sortedTabs, tabList, fieldSections: currentTabSections };
}

export const useFormTabs = (
  formTabs: Tab[] | null | undefined,
  activeTab: string,
  variant?: string | null
): UseFormTabsResult => {
  return useMemo(() => {
    return processFormTabs(formTabs || undefined, activeTab, variant);
  }, [formTabs, activeTab, variant]);
};

export default useFormTabs;

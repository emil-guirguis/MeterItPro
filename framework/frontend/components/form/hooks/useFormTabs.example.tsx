/**
 * useFormTabs Hook - Usage Examples
 * 
 * This file demonstrates how to use the useFormTabs hook in your form components.
 */

import React, { useState } from 'react';
import { useFormTabs } from './useFormTabs';

/**
 * Example 1: Basic Usage with Schema
 * 
 * Shows how to use the hook with a schema that has formGrouping metadata
 */
export const BasicFormTabsExample: React.FC<{ schema: any }> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState('Basic');
  const { tabs, tabList, fieldSections } = useFormTabs(schema.formTabs, activeTab);

  return (
    <div className="form-container">
      {/* Tab Navigation */}
      {tabList.length > 1 && (
        <div className="form__tabs">
          {tabList.map((tabName) => (
            <button
              key={tabName}
              className={`form__tab ${activeTab === tabName ? 'form__tab--active' : ''}`}
              onClick={() => setActiveTab(tabName)}
              type="button"
            >
              {tabs[tabName].label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="form__content">
        {Object.entries(fieldSections).map(([sectionName, fieldNames]) => (
          <div key={sectionName} className="form__section">
            <h3 className="form__section-title">{sectionName}</h3>
            {fieldNames.map((fieldName) => (
              <div key={fieldName} className="form__field">
                {/* Render your field here */}
                <label htmlFor={`field-${fieldName}`}>{fieldName}</label>
                <input id={`field-${fieldName}`} type="text" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Example 2: Integration with BaseForm
 * 
 * Shows how to use the hook within a form component that uses BaseForm
 */
export const FormWithTabsExample: React.FC<{ schema: any }> = ({
  schema,
}) => {
  const [activeTab, setActiveTab] = useState('Basic');
  const { tabs, tabList, fieldSections } = useFormTabs(schema.formTabs, activeTab);

  return (
    <form className="device-form">
      {/* Tab Navigation */}
      {tabList.length > 1 && (
        <div className="device-form__tabs">
          {tabList.map((tabName) => (
            <button
              key={tabName}
              className={`device-form__tab ${
                activeTab === tabName ? 'device-form__tab--active' : ''
              }`}
              onClick={() => setActiveTab(tabName)}
              type="button"
            >
              {tabs[tabName].label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content - Pass fieldSections to BaseForm */}
      <div className="device-form__content">
        {/* Your BaseForm component would use fieldSections */}
        {Object.entries(fieldSections).map(([sectionName, fieldNames]) => (
          <div key={sectionName} className="device-form__section">
            <h3 className="device-form__section-title">{sectionName}</h3>
            {fieldNames.map((fieldName) => (
              <div key={fieldName} className="device-form__field">
                {/* Render field */}
              </div>
            ))}
          </div>
        ))}
      </div>
    </form>
  );
};

/**
 * Example 3: Schema with formGrouping Metadata
 * 
 * Shows what the schema structure should look like for the hook to work properly
 */
export const EXAMPLE_SCHEMA = {
  formFields: {
    name: {
      label: 'Device Name',
      type: 'string',
      required: true,
      showOn: ['form'],
      formGrouping: {
        tabName: 'Basic',
        sectionName: 'General',
        tabOrder: 1,
        sectionOrder: 1,
        fieldOrder: 1,
      },
    },
    description: {
      label: 'Description',
      type: 'string',
      showOn: ['form'],
      formGrouping: {
        tabName: 'Basic',
        sectionName: 'General',
        tabOrder: 1,
        sectionOrder: 1,
        fieldOrder: 2,
      },
    },
    location: {
      label: 'Location',
      type: 'string',
      showOn: ['form'],
      formGrouping: {
        tabName: 'Basic',
        sectionName: 'Location',
        tabOrder: 1,
        sectionOrder: 2,
        fieldOrder: 1,
      },
    },
    ipAddress: {
      label: 'IP Address',
      type: 'string',
      showOn: ['form'],
      formGrouping: {
        tabName: 'Network',
        sectionName: 'Connection',
        tabOrder: 2,
        sectionOrder: 1,
        fieldOrder: 1,
      },
    },
    port: {
      label: 'Port',
      type: 'number',
      showOn: ['form'],
      formGrouping: {
        tabName: 'Network',
        sectionName: 'Connection',
        tabOrder: 2,
        sectionOrder: 1,
        fieldOrder: 2,
      },
    },
    protocol: {
      label: 'Protocol',
      type: 'string',
      showOn: ['form'],
      formGrouping: {
        tabName: 'Network',
        sectionName: 'Settings',
        tabOrder: 2,
        sectionOrder: 2,
        fieldOrder: 1,
      },
    },
    // Field without formGrouping - will go to "Basic" tab, "General" section
    notes: {
      label: 'Notes',
      type: 'string',
      showOn: ['form'],
    },
    // Field not shown on form - will be excluded
    internalId: {
      label: 'Internal ID',
      type: 'string',
      showOn: ['list'],
    },
  },
};

/**
 * Example 4: Expected Hook Output
 * 
 * Shows what the hook returns for the example schema above
 */
export const EXAMPLE_HOOK_OUTPUT = {
  tabs: {
    Basic: {
      label: 'Basic',
      order: 1,
      sections: {
        General: ['name', 'description', 'notes'],
        Location: ['location'],
      },
    },
    Network: {
      label: 'Network',
      order: 2,
      sections: {
        Connection: ['ipAddress', 'port'],
        Settings: ['protocol'],
      },
    },
  },
  tabList: ['Basic', 'Network'],
  fieldSections: {
    // When activeTab = 'Basic'
    General: ['name', 'description', 'notes'],
    Location: ['location'],
    // When activeTab = 'Network'
    // Connection: ['ipAddress', 'port'],
    // Settings: ['protocol'],
  },
};

/**
 * Example 5: Advanced - Custom Tab Styling
 * 
 * Shows how to apply custom styling based on tab metadata
 */
export const AdvancedTabsExample: React.FC<{ schema: any }> = ({ schema }) => {
  const [activeTab, setActiveTab] = useState('Basic');
  const { tabs, tabList, fieldSections } = useFormTabs(schema.formTabs, activeTab);

  return (
    <div className="form-container">
      <div className="form__tabs">
        {tabList.map((tabName) => {
          const tab = tabs[tabName];
          const sectionCount = Object.keys(tab.sections).length;

          return (
            <button
              key={tabName}
              className={`form__tab ${activeTab === tabName ? 'form__tab--active' : ''}`}
              onClick={() => setActiveTab(tabName)}
              type="button"
              title={`${sectionCount} section${sectionCount !== 1 ? 's' : ''}`}
            >
              {tab.label}
              <span className="form__tab-badge">{sectionCount}</span>
            </button>
          );
        })}
      </div>

      <div className="form__content">
        {Object.entries(fieldSections).map(([sectionName, fieldNames]) => (
          <div key={sectionName} className="form__section">
            <h3 className="form__section-title">{sectionName}</h3>
            <div className="form__fields-grid">
              {fieldNames.map((fieldName) => (
                <div key={fieldName} className="form__field">
                  {/* Render field */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Version Test Page
 * 
 * Simple page to test and display version information
 * Can be accessed at /version-test during development
 */

import React from 'react';
import { getVersion, getVersionInfo, getVersionDisplay } from '../utils/version';

export const VersionTest: React.FC = () => {
  const version = getVersion();
  const versionInfo = getVersionInfo();
  const versionDisplay = getVersionDisplay();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Version Information Test</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Basic Version</h2>
        <p><strong>Version:</strong> {version}</p>
        <p><strong>Display:</strong> {versionDisplay}</p>
      </div>

      {versionInfo && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Detailed Version Info</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Version</td>
                <td style={{ padding: '0.5rem' }}>{versionInfo.version}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Year</td>
                <td style={{ padding: '0.5rem' }}>{versionInfo.year}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Week</td>
                <td style={{ padding: '0.5rem' }}>{versionInfo.week}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Build</td>
                <td style={{ padding: '0.5rem' }}>{versionInfo.build}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Timestamp</td>
                <td style={{ padding: '0.5rem' }}>{versionInfo.timestamp}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>Date</td>
                <td style={{ padding: '0.5rem' }}>{versionInfo.date}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>How It Works</h3>
        <ul>
          <li><strong>Development Mode:</strong> Shows "dev" or "Development"</li>
          <li><strong>Production Build:</strong> Shows Tesla-style version (e.g., "2025.47.2")</li>
          <li><strong>Format:</strong> Year.Week.Build</li>
          <li><strong>Auto-increment:</strong> Build number increases with each build in the same week</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
        <h3>Testing</h3>
        <p>To test the version system:</p>
        <ol>
          <li>Run: <code>node scripts/generate-version.mjs</code></li>
          <li>Build: <code>npm run build</code></li>
          <li>Check the user menu dropdown in the header for the version</li>
        </ol>
      </div>
    </div>
  );
};

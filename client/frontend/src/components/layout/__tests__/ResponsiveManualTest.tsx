/**
 * Manual Test Component for Responsive Behavior
 * 
 * This component demonstrates and validates the responsive sidebar header functionality
 * across different breakpoints. It can be used for manual testing and verification.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from '../AppLayout';
import { useResponsive } from '../../../hooks/useResponsive';
import { useAuth } from '../../../hooks/useAuth';
import { useUI } from '../../../store/slices/uiSlice';

// Test results interface
interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message: string;
}

const ResponsiveManualTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>('');
  const responsive = useResponsive();
  const { user } = useAuth();
  const ui = useUI();

  // Test functions
  const runTests = () => {
    const results: TestResult[] = [];

    // Test 1: Desktop Layout (≥ 1024px)
    if (window.innerWidth >= 1024) {
      results.push({
        name: 'Desktop Layout - Sidebar Visible',
        status: responsive.isDesktop ? 'pass' : 'fail',
        message: responsive.isDesktop 
          ? 'Desktop breakpoint detected correctly' 
          : `Expected desktop, got ${responsive.breakpoint}`
      });

      results.push({
        name: 'Desktop Layout - Sidebar Elements Hidden in Header',
        status: !responsive.showSidebarInHeader ? 'pass' : 'fail',
        message: !responsive.showSidebarInHeader 
          ? 'Sidebar elements correctly hidden from header on desktop' 
          : 'Sidebar elements should not show in header on desktop'
      });
    }

    // Test 2: Tablet Layout (768px - 1023px)
    if (window.innerWidth >= 768 && window.innerWidth < 1024) {
      results.push({
        name: 'Tablet Layout - Breakpoint Detection',
        status: responsive.isTablet ? 'pass' : 'fail',
        message: responsive.isTablet 
          ? 'Tablet breakpoint detected correctly' 
          : `Expected tablet, got ${responsive.breakpoint}`
      });

      results.push({
        name: 'Tablet Layout - Sidebar Elements in Header',
        status: responsive.showSidebarInHeader ? 'pass' : 'fail',
        message: responsive.showSidebarInHeader 
          ? 'Sidebar elements correctly shown in header on tablet' 
          : 'Sidebar elements should show in header on tablet'
      });
    }

    // Test 3: Mobile Layout (< 768px)
    if (window.innerWidth < 768) {
      results.push({
        name: 'Mobile Layout - Breakpoint Detection',
        status: responsive.isMobile ? 'pass' : 'fail',
        message: responsive.isMobile 
          ? 'Mobile breakpoint detected correctly' 
          : `Expected mobile, got ${responsive.breakpoint}`
      });

      results.push({
        name: 'Mobile Layout - Sidebar Elements in Header',
        status: responsive.showSidebarInHeader ? 'pass' : 'fail',
        message: responsive.showSidebarInHeader 
          ? 'Sidebar elements correctly shown in header on mobile' 
          : 'Sidebar elements should show in header on mobile'
      });
    }

    // Test 4: Responsive State Consistency
    results.push({
      name: 'Responsive State Consistency',
      status: (responsive.currentWidth === window.innerWidth) ? 'pass' : 'fail',
      message: (responsive.currentWidth === window.innerWidth) 
        ? 'Current width matches window width' 
        : `Width mismatch: ${responsive.currentWidth} vs ${window.innerWidth}`
    });

    // Test 5: UI State Integration
    results.push({
      name: 'UI State Integration',
      status: (typeof ui.sidebarCollapsed === 'boolean') ? 'pass' : 'fail',
      message: (typeof ui.sidebarCollapsed === 'boolean') 
        ? 'UI state properly integrated' 
        : 'UI state integration failed'
    });

    setTestResults(results);
  };

  // Run tests on mount and window resize
  useEffect(() => {
    runTests();
    
    const handleResize = () => {
      setTimeout(runTests, 100); // Small delay to allow responsive hook to update
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [responsive.breakpoint, responsive.showSidebarInHeader]);

  // Manual test controls
  const simulateResize = (width: number) => {
    setCurrentTest(`Simulating ${width}px width`);
    
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
    
    setTimeout(() => {
      setCurrentTest('');
      runTests();
    }, 300);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Responsive Sidebar Header - Manual Test</h1>
      
      {/* Current State Display */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '8px'
      }}>
        <h3>Current State</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>Window Width:</strong> {window.innerWidth}px
          </div>
          <div>
            <strong>Breakpoint:</strong> {responsive.breakpoint}
          </div>
          <div>
            <strong>Show in Header:</strong> {responsive.showSidebarInHeader ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Sidebar Collapsed:</strong> {ui.sidebarCollapsed ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Mobile Nav Open:</strong> {ui.mobileNavOpen ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => simulateResize(1200)}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Test Desktop (1200px)
          </button>
          <button 
            onClick={() => simulateResize(800)}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Test Tablet (800px)
          </button>
          <button 
            onClick={() => simulateResize(400)}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Test Mobile (400px)
          </button>
          <button 
            onClick={runTests}
            style={{ padding: '8px 16px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none' }}
          >
            Run Tests
          </button>
        </div>
        {currentTest && (
          <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#666' }}>
            {currentTest}
          </div>
        )}
      </div>

      {/* Test Results */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results</h3>
        {testResults.length === 0 ? (
          <p>No tests run yet. Click "Run Tests" to start.</p>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {testResults.map((result, index) => (
              <div 
                key={index}
                style={{
                  padding: '10px',
                  borderRadius: '4px',
                  background: result.status === 'pass' ? '#d4edda' : result.status === 'fail' ? '#f8d7da' : '#fff3cd',
                  border: `1px solid ${result.status === 'pass' ? '#c3e6cb' : result.status === 'fail' ? '#f5c6cb' : '#ffeaa7'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong>{result.name}</strong>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>{result.message}</div>
                </div>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: result.status === 'pass' ? '#28a745' : result.status === 'fail' ? '#dc3545' : '#ffc107',
                  color: 'white',
                  fontSize: '0.8em',
                  fontWeight: 'bold'
                }}>
                  {result.status.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        background: '#e9ecef', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>Manual Testing Instructions</h3>
        <ol>
          <li>Use the test controls above to simulate different screen sizes</li>
          <li>Resize your browser window manually and observe the changes</li>
          <li>Check that the sidebar elements appear in the header on tablet/mobile</li>
          <li>Verify that the menu toggle works correctly on all screen sizes</li>
          <li>Test keyboard navigation (Tab, Enter, Space, Escape)</li>
          <li>Check accessibility with screen readers if available</li>
        </ol>
      </div>

      {/* Live Demo */}
      <div style={{ border: '2px solid #dee2e6', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ 
          background: '#f8f9fa', 
          padding: '10px', 
          borderBottom: '1px solid #dee2e6',
          fontWeight: 'bold'
        }}>
          Live Demo - Responsive Layout
        </div>
        <div style={{ height: '400px', overflow: 'auto' }}>
          <BrowserRouter>
            <AppLayout>
              <div style={{ padding: '20px' }}>
                <h2>Sample Content</h2>
                <p>This is a sample page to demonstrate the responsive layout behavior.</p>
                <p>Resize the window or use the test controls above to see the layout adapt.</p>
                
                <div style={{ marginTop: '20px' }}>
                  <h3>Accessibility Features</h3>
                  <ul>
                    <li>ARIA labels and roles</li>
                    <li>Keyboard navigation support</li>
                    <li>Screen reader compatibility</li>
                    <li>High contrast mode support</li>
                    <li>Focus management</li>
                  </ul>
                </div>
              </div>
            </AppLayout>
          </BrowserRouter>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveManualTest;
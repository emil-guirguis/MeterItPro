// This is a simple script to help debug what's in browser storage
// You can run this in the browser console to see what's stored

console.log('=== DEBUGGING FRONTEND STORAGE ===');

console.log('\n--- localStorage ---');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  const value = localStorage.getItem(key);
  console.log(`${key}:`, value);
}

console.log('\n--- sessionStorage ---');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  const value = sessionStorage.getItem(key);
  console.log(`${key}:`, value);
}

console.log('\n--- Token Analysis ---');
const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
if (token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      console.log('Token payload:', payload);
    }
  } catch (e) {
    console.error('Error decoding token:', e);
  }
} else {
  console.log('No token found');
}

console.log('\n=== END DEBUG ===');
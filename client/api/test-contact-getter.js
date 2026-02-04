const Contact = require('./src/models/ContactWithSchema.js');

const c = new Contact({ id: 42 });
console.log('typeof c:', typeof c);
console.log('c instanceof Contact:', c instanceof Contact);
console.log('c.id:', c.id);
console.log('c.contact_id:', c.contact_id);
console.log('c["contact_id"]:', c['contact_id']);
console.log('"contact_id" in c:', 'contact_id' in c);
console.log('Object.getOwnPropertyDescriptor(Contact.prototype, "contact_id"):', Object.getOwnPropertyDescriptor(Contact.prototype, 'contact_id'));
console.log('Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c), "contact_id"):', Object.getOwnPropertyDescriptor(Object.getPrototypeOf(c), 'contact_id'));

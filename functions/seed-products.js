const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const products = [
  { name: 'Baseball Hat', description: 'Classic NorCal Moto Adventure cap with embroidered logo', price: 2000, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fhat.png?alt=media', category: 'apparel', inStock: true, featured: true },
  { name: 'T-Shirt', description: 'Comfortable cotton tee with tour graphic', price: 2000, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fshirt.png?alt=media', category: 'apparel', variants: [{id:'S',name:'Small'},{id:'M',name:'Medium'},{id:'L',name:'Large'},{id:'XL',name:'X-Large'}], inStock: true },
  { name: 'Riding Jersey', description: 'Moisture-wicking adventure jersey with tour branding', price: 8000, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fjersey.png?alt=media', category: 'apparel', variants: [{id:'S',name:'Small'},{id:'M',name:'Medium'},{id:'L',name:'Large'},{id:'XL',name:'X-Large'}], inStock: true },
  { name: 'Camping Gear Rental - Weekend', description: 'Tent, sleeping bag, and pad for a weekend adventure', price: 2500, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2FCamping%20Gear.png?alt=media', category: 'gear', inStock: true },
  { name: 'Camping Gear Rental - Week', description: 'Tent, sleeping bag, and pad for a full week', price: 5000, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2FCamping%20Gear.png?alt=media', category: 'gear', inStock: true },
  { name: 'Custom Trip Planning', description: 'Routes, campgrounds, hotels, GPX files + two 30-min consultations', price: 10000, imageUrl: 'https://firebasestorage.googleapis.com/v0/b/bajarun-2026.firebasestorage.app/o/products%2Fcustom.jpeg?alt=media', category: 'service', inStock: true, featured: true }
];

(async () => {
  for (const p of products) {
    await db.collection('products').add({ ...p, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    console.log('Added:', p.name);
  }
  console.log('Done! Seeded', products.length, 'products');
  process.exit(0);
})();

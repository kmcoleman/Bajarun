const admin = require('firebase-admin');
const path = require('path');
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const day9Description = `The final leg of your journey from Twentynine Palms to Furnace Creek takes you through the heart of the Mojave, featuring a mix of kitschy Americana and raw, prehistoric desert beauty. Heading north, your first major milestone is the town of Baker, the "Gateway to Death Valley." Here, you'll make a mandatory stop at the World's Tallest Thermometer, a 134-foot landmark that commemorates the record-breaking 134°F temperature set in the park back in 1913. It's the perfect spot to grab a cold drink and snap a photo before leaving the last remnants of civilization behind.

From Baker, you'll head north on Highway 127, a lonely and beautiful stretch of pavement that skirts the edge of the Dumont Dunes and the Amargosa River. This route brings you into the tiny, spring-fed oasis of Shoshone, where the lush greenery provides a stark contrast to the surrounding rock. Instead of dropping into the low basin via Badwater, you'll continue north to Death Valley Junction—home to the historic and haunting Amargosa Opera House—before turning west onto Highway 190. This path takes you through the high-altitude gates of the park, offering a steady, scenic climb through golden badlands and the jagged shadows of the Black Mountains.`;

async function update() {
  const routeRef = db.collection('events').doc('bajarun2026').collection('routes').doc('day9');
  await routeRef.update({
    description: day9Description,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('✓ Day 9 description updated (' + day9Description.length + ' chars)');
  process.exit(0);
}

update().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

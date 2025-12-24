/**
 * Info page - General reference information.
 */

import { Layout } from '../components/Layout';

export function InfoPage() {
  return (
    <Layout title="Info" currentPath="/info">
      <div className="p-4 space-y-4">
        {/* Emergency Contacts */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium">
            Emergency Contacts
          </div>
          <div className="p-4 space-y-3">
            <a
              href="tel:911"
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
            >
              <span className="text-gray-900 font-medium">Emergency (Mexico)</span>
              <span className="text-red-600 font-bold">911</span>
            </a>
            <div className="text-gray-600 text-sm">
              More emergency contacts will be added here.
            </div>
          </div>
        </section>

        {/* Spanish Phrases */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-green-600 text-white px-4 py-2 text-sm font-medium">
            Useful Spanish Phrases
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Help!</span>
              <span className="text-gray-900 font-medium">¡Ayuda!</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Where is the gas station?</span>
              <span className="text-gray-900 font-medium">¿Dónde está la gasolinera?</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">How much does it cost?</span>
              <span className="text-gray-900 font-medium">¿Cuánto cuesta?</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Thank you</span>
              <span className="text-gray-900 font-medium">Gracias</span>
            </div>
          </div>
        </section>

        {/* General Tips */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-blue-600 text-white px-4 py-2 text-sm font-medium">
            Baja Tips
          </div>
          <div className="p-4 space-y-2 text-sm text-gray-600">
            <p>• Always carry cash (pesos preferred)</p>
            <p>• Fill up gas at every opportunity</p>
            <p>• Ride during daylight hours only</p>
            <p>• Watch for livestock on roads</p>
            <p>• Stay hydrated!</p>
          </div>
        </section>
      </div>
    </Layout>
  );
}

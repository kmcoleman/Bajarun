/**
 * Info page - General trip reference information.
 */

import { View, Text, ScrollView, TouchableOpacity, Linking } from 'react-native';

export default function InfoPage() {
  const emergencyContacts = [
    { name: 'US Embassy (Mexico City)', phone: '+52-55-5080-2000' },
    { name: 'US Consulate (Tijuana)', phone: '+52-664-977-2000' },
    { name: 'Mexico Emergency', phone: '911' },
    { name: 'Mexican Red Cross', phone: '065' },
  ];

  const spanishPhrases = [
    { english: 'Help!', spanish: '¡Ayuda!' },
    { english: 'I need a mechanic', spanish: 'Necesito un mecánico' },
    { english: 'Where is the gas station?', spanish: '¿Dónde está la gasolinera?' },
    { english: 'I have a flat tire', spanish: 'Tengo una llanta ponchada' },
    { english: 'My motorcycle broke down', spanish: 'Mi moto se descompuso' },
    { english: 'I need a doctor', spanish: 'Necesito un médico' },
    { english: 'How much does it cost?', spanish: '¿Cuánto cuesta?' },
    { english: 'Thank you', spanish: 'Gracias' },
  ];

  const makeCalls = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        {/* Emergency Contacts */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <View className="bg-red-600 px-4 py-2">
            <Text className="text-white text-sm font-medium">🚨 Emergency Contacts</Text>
          </View>
          <View className="p-4">
            {emergencyContacts.map((contact, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => makeCalls(contact.phone)}
                className="flex-row justify-between items-center py-3 border-b border-gray-100 last:border-0"
              >
                <Text className="text-gray-900 flex-1">{contact.name}</Text>
                <Text className="text-blue-600 font-medium">{contact.phone}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Spanish Phrases */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <View className="bg-green-600 px-4 py-2">
            <Text className="text-white text-sm font-medium">🇲🇽 Spanish Phrases</Text>
          </View>
          <View className="p-4">
            {spanishPhrases.map((phrase, idx) => (
              <View
                key={idx}
                className="py-3 border-b border-gray-100 last:border-0"
              >
                <Text className="text-gray-900 font-medium">{phrase.english}</Text>
                <Text className="text-gray-600 text-sm mt-1">{phrase.spanish}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Baja Tips */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <View className="bg-baja-orange px-4 py-2">
            <Text className="text-white text-sm font-medium">🌵 Baja Tips</Text>
          </View>
          <View className="p-4">
            <View className="mb-3">
              <Text className="text-gray-900 font-medium">Gas Stations</Text>
              <Text className="text-gray-600 text-sm mt-1">
                Fill up at every opportunity. Stations can be 100+ miles apart in remote areas.
              </Text>
            </View>
            <View className="mb-3">
              <Text className="text-gray-900 font-medium">Water</Text>
              <Text className="text-gray-600 text-sm mt-1">
                Carry at least 2 liters. The desert is unforgiving.
              </Text>
            </View>
            <View className="mb-3">
              <Text className="text-gray-900 font-medium">Speed</Text>
              <Text className="text-gray-600 text-sm mt-1">
                Watch for topes (speed bumps), livestock, and road debris.
              </Text>
            </View>
            <View>
              <Text className="text-gray-900 font-medium">Money</Text>
              <Text className="text-gray-600 text-sm mt-1">
                Carry pesos for smaller towns. Many places don't accept cards.
              </Text>
            </View>
          </View>
        </View>

        {/* Border Crossing */}
        <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <View className="bg-baja-dark px-4 py-2">
            <Text className="text-white text-sm font-medium">🛂 Border Crossing Checklist</Text>
          </View>
          <View className="p-4">
            {[
              'Valid passport',
              'Mexican vehicle permit (if required)',
              'FMM tourist card',
              'Mexican liability insurance',
              'Vehicle registration',
              "Driver's license",
              'Proof of citizenship',
            ].map((item, idx) => (
              <View key={idx} className="flex-row items-center py-2">
                <Text className="text-green-600 mr-3">✓</Text>
                <Text className="text-gray-700">{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

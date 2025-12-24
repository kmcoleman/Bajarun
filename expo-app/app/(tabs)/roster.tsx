/**
 * Roster page - Shows all tour participants with contact info.
 */

import { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Linking, Image, RefreshControl } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';

export default function RosterPage() {
  const { user } = useAuth();
  const { roster, syncing, refresh } = useOfflineData(user?.uid || null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoster = roster.filter((participant) => {
    const query = searchQuery.toLowerCase();
    const fullName = `${participant.odFirstName} ${participant.odLastName}`.toLowerCase();
    const nickname = participant.odNickname?.toLowerCase() || '';
    return fullName.includes(query) || nickname.includes(query);
  });

  const makeCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const sendText = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Search bar */}
      <View className="bg-white p-3 border-b border-gray-200">
        <TextInput
          className="bg-gray-100 px-4 py-2 rounded-lg text-gray-900"
          placeholder="Search riders..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={refresh} />
        }
      >
        <View className="p-4">
          {filteredRoster.length === 0 ? (
            <View className="bg-white rounded-xl p-6 items-center">
              <Text className="text-gray-500">
                {searchQuery ? 'No riders found' : 'No roster data yet. Pull to refresh.'}
              </Text>
            </View>
          ) : (
            filteredRoster.map((participant) => (
              <View
                key={participant.odId}
                className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden"
              >
                <View className="flex-row p-4">
                  {/* Photo */}
                  <View className="w-16 h-16 rounded-full bg-gray-200 mr-4 overflow-hidden">
                    {participant.odPhotoUrl ? (
                      <Image
                        source={{ uri: participant.odPhotoUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text className="text-2xl text-gray-400">
                          {participant.odFirstName[0]}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-lg">
                      {participant.odFirstName} {participant.odLastName}
                    </Text>
                    {participant.odNickname && (
                      <Text className="text-gray-500 text-sm">
                        "{participant.odNickname}"
                      </Text>
                    )}
                    {participant.odBike && (
                      <Text className="text-gray-600 text-sm mt-1">
                        🏍️ {participant.odBike}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Contact buttons */}
                {participant.odPhone && (
                  <View className="flex-row border-t border-gray-100">
                    <TouchableOpacity
                      onPress={() => makeCall(participant.odPhone!)}
                      className="flex-1 py-3 items-center border-r border-gray-100"
                    >
                      <Text className="text-blue-600 font-medium">📞 Call</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => sendText(participant.odPhone!)}
                      className="flex-1 py-3 items-center"
                    >
                      <Text className="text-blue-600 font-medium">💬 Text</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

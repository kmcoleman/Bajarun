/**
 * Daily page - The main view showing all info for a selected day.
 */

import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, RefreshControl, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useOfflineData } from '../../hooks/useOfflineData';
import { itineraryData } from '../../data/itinerary';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Accordion component
function Accordion({
  title,
  headerColor = 'bg-gray-600',
  children,
  defaultExpanded = false,
}: {
  title: string;
  headerColor?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
      <TouchableOpacity
        onPress={toggle}
        className={`${headerColor} px-4 py-3 flex-row justify-between items-center`}
        activeOpacity={0.8}
      >
        <Text className="text-white text-sm font-medium">{title}</Text>
        <Text className="text-white text-lg">{expanded ? '−' : '+'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View className="p-4">
          {children}
        </View>
      )}
    </View>
  );
}

export default function DailyPage() {
  const { user } = useAuth();
  const { userSelections, eventConfig, loading, syncing, refresh } = useOfflineData(
    user?.uid || null
  );
  const [selectedDay, setSelectedDay] = useState(1);

  const dayData = itineraryData.find((d) => d.day === selectedDay);
  const nightKey = `night-${selectedDay}`;
  const userNightSelection = userSelections?.nights?.[nightKey];
  const eventNightConfig = eventConfig?.[nightKey];

  const openMaps = (url: string) => {
    Linking.openURL(url);
  };

  if (!dayData) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-gray-500">Day not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Day selector */}
      <View className="bg-white border-b border-gray-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-2 py-2"
        >
          {itineraryData.map((day) => (
            <TouchableOpacity
              key={day.day}
              onPress={() => setSelectedDay(day.day)}
              className={`px-4 py-2 mr-1 rounded-full ${
                selectedDay === day.day
                  ? 'bg-baja-dark'
                  : 'bg-gray-100'
              }`}
            >
              <Text className={`text-sm font-medium ${
                selectedDay === day.day ? 'text-white' : 'text-gray-600'
              }`}>
                Day {day.day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={refresh} />
        }
      >
        {/* Day header */}
        <View className="bg-baja-dark p-4">
          <Text className="text-xl font-bold text-white">{dayData.title}</Text>
          <Text className="text-blue-200 text-sm mt-1">{dayData.date}</Text>
        </View>

        <View className="p-4">
          {/* Route Section */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <View className="bg-baja-dark px-4 py-2 flex-row justify-between items-center">
              <Text className="text-white text-sm font-medium">Route</Text>
              {dayData.miles > 0 && (
                <Text className="text-blue-200 text-sm">{dayData.miles} miles</Text>
              )}
            </View>
            <View className="p-4">
              <View className="flex-row mb-3">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Start</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {dayData.startPoint}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">End</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {dayData.endPoint}
                  </Text>
                </View>
              </View>
              {dayData.ridingTime !== 'N/A' && dayData.ridingTime !== 'Rest day' && (
                <Text className="text-sm text-gray-600 mb-3">
                  Riding time: {dayData.ridingTime}
                </Text>
              )}
              {dayData.miles > 0 && (
                <TouchableOpacity
                  onPress={() => openMaps(
                    `https://www.google.com/maps/dir/${dayData.coordinates.start[0]},${dayData.coordinates.start[1]}/${dayData.coordinates.end[0]},${dayData.coordinates.end[1]}`
                  )}
                  className="bg-blue-500 py-2 px-3 rounded-lg"
                >
                  <Text className="text-white text-sm text-center">Open in Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Hotel Info Section */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <View className="bg-baja-sand px-4 py-2">
              <Text className="text-white text-sm font-medium">Hotel Info</Text>
            </View>
            <View className="p-4">
              <Text className="text-gray-900 font-medium mb-2">
                {eventNightConfig?.hotelName || dayData.accommodation}
              </Text>
              {eventNightConfig?.hotelAddress && (
                <TouchableOpacity
                  onPress={() => openMaps(
                    eventNightConfig?.hotelMapsLink ||
                    `https://maps.google.com/?q=${encodeURIComponent(eventNightConfig.hotelAddress!)}`
                  )}
                  className="flex-row items-start mb-2"
                >
                  <Text className="text-gray-400 mr-2">📍</Text>
                  <Text className="text-sm text-blue-600 flex-1">
                    {eventNightConfig.hotelAddress}
                  </Text>
                </TouchableOpacity>
              )}
              {eventNightConfig?.hotelPhone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${eventNightConfig.hotelPhone}`)}
                  className="flex-row items-center mb-2"
                >
                  <Text className="text-gray-400 mr-2">📞</Text>
                  <Text className="text-sm text-blue-600">
                    {eventNightConfig.hotelPhone}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* My Selections Section */}
          <View className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <View className="bg-baja-orange px-4 py-2">
              <Text className="text-white text-sm font-medium">My Selections</Text>
            </View>
            <View className="p-4">
              {loading ? (
                <Text className="text-gray-500 text-sm">Loading...</Text>
              ) : userNightSelection ? (
                <>
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-600 text-sm">Accommodation:</Text>
                    <Text className="text-gray-900 text-sm font-medium capitalize">
                      {userNightSelection.accommodation || 'Not selected'}
                    </Text>
                  </View>
                  {userNightSelection.assignedRoom && (
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600 text-sm">Room:</Text>
                      <Text className="text-gray-900 text-sm font-medium">
                        {userNightSelection.assignedRoom}
                        {userNightSelection.assignedRoommate && ` (with ${userNightSelection.assignedRoommate})`}
                      </Text>
                    </View>
                  )}
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-gray-600 text-sm">Dinner:</Text>
                    <Text className="text-gray-900 text-sm font-medium">
                      {userNightSelection.dinner ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600 text-sm">Breakfast:</Text>
                    <Text className="text-gray-900 text-sm font-medium">
                      {userNightSelection.breakfast ? 'Yes' : 'No'}
                    </Text>
                  </View>
                </>
              ) : (
                <Text className="text-gray-500 text-sm">
                  No selections yet. Make your selections on the main website.
                </Text>
              )}
            </View>
          </View>

          {/* Overview/Notes Section (Accordion) */}
          <Accordion title="Overview / Notes" headerColor="bg-gray-600" defaultExpanded={false}>
            <Text className="text-gray-600 text-sm mb-3">{dayData.description}</Text>
            {dayData.pointsOfInterest.length > 0 && (
              <View>
                <Text className="text-xs text-gray-500 mb-2 font-medium">
                  Points of Interest
                </Text>
                {dayData.pointsOfInterest.map((poi, idx) => (
                  <View key={idx} className="flex-row items-start mb-2">
                    <Text className="text-baja-orange mr-2">•</Text>
                    <Text className="text-sm text-gray-700 flex-1">{poi}</Text>
                  </View>
                ))}
              </View>
            )}
          </Accordion>

          {/* Route Links and Files Section (Accordion) */}
          <Accordion title="Route Links & Files" headerColor="bg-blue-600" defaultExpanded={false}>
            {/* Placeholder for route links from backend */}
            {eventNightConfig?.routeLinks && eventNightConfig.routeLinks.length > 0 ? (
              <View>
                {eventNightConfig.routeLinks.map((link: { name: string; url: string; type?: string }, idx: number) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => Linking.openURL(link.url)}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <Text className="text-xl mr-3">
                      {link.type === 'gpx' ? '📍' : link.type === 'pdf' ? '📄' : '🔗'}
                    </Text>
                    <View className="flex-1">
                      <Text className="text-gray-900 text-sm font-medium">{link.name}</Text>
                      <Text className="text-gray-400 text-xs">{link.type?.toUpperCase() || 'Link'}</Text>
                    </View>
                    <Text className="text-blue-500">→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="items-center py-4">
                <Text className="text-gray-400 text-3xl mb-2">📁</Text>
                <Text className="text-gray-500 text-sm text-center">
                  No route files available yet.
                </Text>
                <Text className="text-gray-400 text-xs text-center mt-1">
                  GPX files, maps, and other resources will appear here.
                </Text>
              </View>
            )}
          </Accordion>
        </View>
      </ScrollView>
    </View>
  );
}

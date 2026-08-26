import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Home, List, BookOpen, Phone } from 'lucide-react-native';
import tw from 'twrnc';

// Config & Context
import { initScriptUrl } from './src/config/sheets';
import { AuthProvider } from './src/context/AuthContext';

// Pages
import Dashboard from './src/pages/Dashboard';
import Entries from './src/pages/Entries';
import ViharDirectory from './src/pages/ViharDirectory';
import ImportantContacts from './src/pages/ImportantContacts';
import AddEntry from './src/pages/AddEntry';
import EntryConfirm from './src/pages/EntryConfirm';
import ViharDirectoryDetail from './src/pages/ViharDirectoryDetail';
import Reports from './src/pages/Reports';
import Rankings from './src/pages/Rankings';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'DashboardTab') {
            return <Home size={size} color={color} />;
          } else if (route.name === 'EntriesTab') {
            return <List size={size} color={color} />;
          } else if (route.name === 'DirectoryTab') {
            return <BookOpen size={size} color={color} />;
          } else if (route.name === 'ContactsTab') {
            return <Phone size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: '#C96800',
        tabBarInactiveTintColor: '#8B6525',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopColor: '#E8C97A',
          borderTopWidth: 1,
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="DashboardTab" component={Dashboard} options={{ title: 'Home' }} />
      <Tab.Screen name="EntriesTab" component={Entries} options={{ title: 'Vihar Entries' }} />
      <Tab.Screen name="DirectoryTab" component={ViharDirectory} options={{ title: 'Directory' }} />
      <Tab.Screen name="ContactsTab" component={ImportantContacts} options={{ title: 'Imp. Contacts' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      await initScriptUrl();
      setReady(true);
    }
    load();
  }, []);

  if (!ready) {
    return (
      <View style={tw`flex-1 items-center justify-center bg-[#FFFDF5]`}>
        <ActivityIndicator size="large" color="#C96800" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="AddEntry" component={AddEntry} />
            <Stack.Screen name="EntryConfirm" component={EntryConfirm} />
            <Stack.Screen name="ViharDirectoryDetail" component={ViharDirectoryDetail} />
            <Stack.Screen name="Reports" component={Reports} />
            <Stack.Screen name="Rankings" component={Rankings} />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

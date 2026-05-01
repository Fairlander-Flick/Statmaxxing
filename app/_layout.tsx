import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  nameFilled: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
};

function TabIcon({ name, nameFilled, color, focused }: TabIconProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 28,
        borderRadius: 14,
        backgroundColor: focused ? color + '22' : 'transparent',
      }}
    >
      <Ionicons
        name={focused ? nameFilled : name}
        size={20}
        color={color}
      />
    </View>
  );
}

function AppTabs() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#13131b',
          borderTopColor: 'rgba(255,255,255,0.06)',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginTop: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="home-outline"
              nameFilled="home"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="pulse-outline"
              nameFilled="pulse"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="fitness-outline"
              nameFilled="fitness"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mind"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="timer-outline"
              nameFilled="timer"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="chatbubbles-outline"
              nameFilled="chatbubbles"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="person-circle-outline"
              nameFilled="person-circle"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppTabs />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

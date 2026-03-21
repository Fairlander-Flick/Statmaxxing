import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '../constants/theme';

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

function TabIcon({ name, color }: TabIconProps) {
  return <Ionicons name={name} size={24} color={color} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 88 : 65,
              paddingBottom: Platform.OS === 'ios' ? 28 : 10,
              paddingTop: 8,
            },
            tabBarActiveTintColor: COLORS.cyan,
            tabBarInactiveTintColor: COLORS.textSub,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: 2,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Dashboard',
              tabBarIcon: ({ color }) => <TabIcon name="grid-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="health"
            options={{
              title: 'Health',
              tabBarIcon: ({ color }) => <TabIcon name="heart-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="train"
            options={{
              title: 'Train',
              tabBarIcon: ({ color }) => <TabIcon name="barbell-outline" color={color} />,
            }}
          />
          <Tabs.Screen
            name="mind"
            options={{
              title: 'Mind',
              tabBarIcon: ({ color }) => <TabIcon name="brain" color={color} />,
            }}
          />
          <Tabs.Screen
            name="social"
            options={{
              title: 'Social',
              tabBarIcon: ({ color }) => <TabIcon name="people-outline" color={color} />,
            }}
          />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

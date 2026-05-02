import { Tabs, usePathname, router } from 'expo-router';
import { Platform, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';

const TABS = [
  { name: 'index', href: '/', label: 'Today', icon: 'home-outline' as const, iconFilled: 'home' as const },
  { name: 'health', href: '/health', label: 'Health', icon: 'pulse-outline' as const, iconFilled: 'pulse' as const },
  { name: 'train', href: '/train', label: 'Train', icon: 'fitness-outline' as const, iconFilled: 'fitness' as const },
  { name: 'mind', href: '/mind', label: 'Focus', icon: 'timer-outline' as const, iconFilled: 'timer' as const },
  { name: 'social', href: '/social', label: 'People', icon: 'chatbubbles-outline' as const, iconFilled: 'chatbubbles' as const },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'person-circle-outline' as const, iconFilled: 'person-circle' as const },
];

function Sidebar() {
  const { colors, isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={{
      width: 220,
      height: '100%' as any,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      paddingTop: Math.max(insets.top, 28) + 8,
      paddingBottom: Math.max(insets.bottom, 24),
      paddingHorizontal: 16,
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <View>
        {/* Brand */}
        <View style={{ paddingHorizontal: 12, marginBottom: 40 }}>
          <Text style={{
            fontSize: 10, fontWeight: '600',
            color: colors.textMuted, letterSpacing: 2,
            textTransform: 'uppercase', marginBottom: 6,
          }}>
            Personal
          </Text>
          <Text style={{
            fontSize: 26, fontWeight: '200',
            color: colors.text, letterSpacing: -0.8,
          }}>
            Statmax
          </Text>
        </View>

        {/* Nav */}
        <View style={{ gap: 1 }}>
          {TABS.map((tab) => {
            const isActive = tab.href === '/'
              ? pathname === '/' || pathname === ''
              : pathname.startsWith(tab.href);
            return (
              <TouchableOpacity
                key={tab.href}
                onPress={() => router.push(tab.href as any)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  paddingVertical: 11, paddingHorizontal: 12, borderRadius: 8,
                  backgroundColor: isActive ? colors.accentDim : 'transparent',
                  borderLeftWidth: 2,
                  borderLeftColor: isActive ? colors.accent : 'transparent',
                }}
              >
                <Ionicons
                  name={isActive ? tab.iconFilled : tab.icon}
                  size={16}
                  color={isActive ? colors.accent : colors.textSub}
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: isActive ? '500' : '400',
                  color: isActive ? colors.accent : colors.textSub,
                  letterSpacing: -0.1,
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <TouchableOpacity
        onPress={toggleTheme}
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
        }}
      >
        <Ionicons
          name={isDark ? 'sunny-outline' : 'moon-outline'}
          size={15}
          color={colors.textMuted}
        />
        <Text style={{ fontSize: 13, color: colors.textMuted }}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function TabIcon({ name, nameFilled, color, focused }: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  nameFilled: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  focused: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 40, height: 28 }}>
      <Ionicons name={focused ? nameFilled : name} size={20} color={color} />
    </View>
  );
}

function AppContent() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: isDesktop
          ? { display: 'none' }
          : {
              backgroundColor: '#1e1a17',
              borderTopColor: 'rgba(255,255,255,0.06)',
              borderTopWidth: 1,
              height: Platform.OS === 'ios' ? 84 : 64,
              paddingBottom: Platform.OS === 'ios' ? 20 : 6,
              paddingTop: 8,
              elevation: 0,
              shadowOpacity: 0,
            },
        tabBarActiveTintColor: '#c2827a',
        tabBarInactiveTintColor: 'rgba(232,224,214,0.35)',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500', letterSpacing: 0.04 } as any,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home-outline" nameFilled="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="pulse-outline" nameFilled="pulse" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="fitness-outline" nameFilled="fitness" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mind"
        options={{
          title: 'Focus',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="timer-outline" nameFilled="timer" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'People',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="chatbubbles-outline" nameFilled="chatbubbles" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-circle-outline" nameFilled="person-circle" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );

  if (isDesktop) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
        <Sidebar />
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {tabs}
        </View>
      </View>
    );
  }

  return tabs;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

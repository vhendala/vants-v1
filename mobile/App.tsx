import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StatusBar as ExpoStatusBar} from 'expo-status-bar';

import {ThemeProvider, useTheme} from './src/theme/ThemeContext';
import {WalletProvider, useWallet} from './src/contexts/WalletContext';
import {WelcomeScreen} from './src/screens/WelcomeScreen';
import {OnboardingScreen} from './src/screens/OnboardingScreen';
import {LoginScreen} from './src/screens/LoginScreen';
import {SplashOnboardingScreen} from './src/screens/SplashOnboardingScreen';
import {WalletConnectScreen} from './src/screens/WalletConnectScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {CardScreen} from './src/screens/CardScreen';
import {CardVisualScreen} from './src/screens/CardVisualScreen';
import {PayModeScreen} from './src/screens/PayModeScreen';
import {PaymentScreen} from './src/screens/PaymentScreen';
import {TransferScreen} from './src/screens/TransferScreen';
import {ReceiveScreen} from './src/screens/ReceiveScreen';
import {CreditDashboardScreen} from './src/screens/CreditDashboardScreen';
import {DeFiScreen} from './src/screens/DeFiScreen';
import {ActivityScreen} from './src/screens/ActivityScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {NavigationBar} from './src/components/NavigationBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={props => <NavigationBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Card" component={CardScreen} />
      <Tab.Screen name="PayMode" component={PayModeScreen} />
      <Tab.Screen name="DeFi" component={DeFiScreen} />
      <Tab.Screen name="Activity" component={ActivityScreen} />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const {isDark} = useTheme();
  const {isConnected, isLoading} = useWallet();

  // Show loading while checking wallet connection
  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <ExpoStatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}>
        {!isConnected ? (
          <>
            <Stack.Screen name="SplashOnboarding" component={SplashOnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="WalletConnect" component={WalletConnectScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="SplashOnboarding" component={SplashOnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="WalletConnect" component={WalletConnectScreen} />
          </>
        )}
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="CardVisual" component={CardVisualScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="Transfer" component={TransferScreen} />
        <Stack.Screen name="Receive" component={ReceiveScreen} />
        <Stack.Screen name="CreditDashboard" component={CreditDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <WalletProvider>
            <AppNavigator />
          </WalletProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { usePrivy } from '@privy-io/expo';

interface AuthScreenProps {
  onAuthComplete: () => void;
}

export default function AuthScreen({ onAuthComplete }: AuthScreenProps) {
  const { login, ready, authenticated, user } = usePrivy();

  React.useEffect(() => {
    if (ready && authenticated && user) {
      console.log('✅ User authenticated successfully:', user.id);
      console.log('📧 User email:', user.email?.address || 'No email');
      console.log('📱 User phone:', user.phone?.number || 'No phone');
      console.log('🔗 Linked accounts:', user.linkedAccounts?.length || 0);
      onAuthComplete();
    }
  }, [ready, authenticated, user, onAuthComplete]);

  const handleLogin = async () => {
    try {
      console.log('🔐 Starting Privy login...');
      await login();
    } catch (error) {
      console.error('❌ Login error:', error);
    }
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Fitcentive</Text>
          <Text style={styles.subtitle}>
            Create your account to start earning from your health data
          </Text>
        </View>

        <View style={styles.benefits}>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>🔐</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Secure Wallet</Text>
              <Text style={styles.benefitText}>
                Your embedded wallet is created automatically and secured by Privy
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>💰</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Earn HBAR</Text>
              <Text style={styles.benefitText}>
                Payments go directly to your wallet address
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>🏥</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Own Your Data</Text>
              <Text style={styles.benefitText}>
                Full control over your health information
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <Text style={styles.loginButtonText}>Sign Up / Login</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to create a secure wallet and participate in the health data marketplace
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  benefits: {
    marginBottom: 48,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 4,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  benefitText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
});
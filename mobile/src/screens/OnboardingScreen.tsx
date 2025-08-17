import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { dynamicWalletService } from '../services/dynamicWallet';
import { sealEncryption } from '../services/sealEncryption';
import { eligibilityService } from '../services/eligibilityService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingScreenProps {
  navigation: any;
}

export default function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [step, setStep] = useState<'phone' | 'verify' | 'complete'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    checkExistingWallet();
  }, []);

  const checkExistingWallet = async () => {
    try {
      const existingWallet = await AsyncStorage.getItem('@dynamic_wallet_address');
      if (existingWallet) {
        // User already onboarded, skip to home
        navigation.replace('Main');
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Initialize wallet with SMS authentication
      const result = await dynamicWalletService.initializeWithSMS(phoneNumber);
      setWalletAddress(result.walletAddress);
      
      // Send SMS verification code
      Alert.alert(
        'Verification Code Sent',
        `A 6-digit code has been sent to ${phoneNumber}`
      );
      
      setStep('verify');
    } catch (error) {
      console.error('Phone submission error:', error);
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async () => {
    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      // Verify SMS code
      const verified = await dynamicWalletService.verifySMSCode(verificationCode);
      
      if (!verified) {
        Alert.alert('Invalid Code', 'The verification code is incorrect');
        setLoading(false);
        return;
      }

      // Initialize SEAL encryption with the wallet
      await sealEncryption.initialize();
      
      // Initialize user profile for eligibility
      await eligibilityService.initializeUserProfile({
        verificationStatus: 'verified',
        availableMetrics: [],
        dataPointsCount: 0,
        devices: ['iPhone'], // Default device
      });

      // Mark onboarding as complete
      await AsyncStorage.setItem('@onboarding_complete', 'true');
      
      setStep('complete');
      
      // Navigate to main app after delay
      setTimeout(() => {
        navigation.replace('Main');
      }, 2000);
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert('Error', 'Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPhoneStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Welcome to Health Data Marketplace</Text>
      <Text style={styles.subtitle}>
        Create your secure wallet with SMS verification
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 (555) 123-4567"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          autoFocus
        />
      </View>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handlePhoneSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Send Verification Code</Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.disclaimer}>
        Your phone number authenticates your private key and ensures only you can access your health data
      </Text>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>Enter Verification Code</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {phoneNumber}
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Verification Code</Text>
        <TextInput
          style={[styles.input, styles.codeInput]}
          placeholder="000000"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
        />
      </View>
      
      <TouchableOpacity
        style={styles.button}
        onPress={handleVerificationSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Verify & Create Wallet</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => setStep('phone')}
      >
        <Text style={styles.linkText}>Use different number</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCompleteStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.successIcon}>✅</Text>
      <Text style={styles.title}>Wallet Created Successfully!</Text>
      <Text style={styles.subtitle}>Your secure health data wallet is ready</Text>
      
      <View style={styles.walletInfo}>
        <Text style={styles.walletLabel}>Wallet Address:</Text>
        <Text style={styles.walletAddress}>{walletAddress}</Text>
      </View>
      
      <Text style={styles.infoText}>
        🔐 Your private key is encrypted and secured by your phone number
      </Text>
      <Text style={styles.infoText}>
        🏥 You can now securely store and monetize your health data
      </Text>
      <Text style={styles.infoText}>
        💰 Participate in bounties and earn USDC rewards
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {step === 'phone' && renderPhoneStep()}
        {step === 'verify' && renderVerifyStep()}
        {step === 'complete' && renderCompleteStep()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#F8F8F8',
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    padding: 10,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  successIcon: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 20,
  },
  walletInfo: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  walletLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    marginVertical: 8,
    paddingHorizontal: 20,
  },
});
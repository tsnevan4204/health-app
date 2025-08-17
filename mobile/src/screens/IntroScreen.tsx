import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';

interface IntroScreenProps {
  onGenerateMockData: () => void;
}

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Fitcentive',
    subtitle: 'Your Health. Your Data.',
    sections: [
      {
        title: '100% Decentralized',
        description: 'No censorship. Full ownership.',
      },
      {
        title: 'Aggregated Hub',
        description: 'All your health data in one place.',
      },
      {
        title: "You're in Control",
        description: 'Sell, share, or revoke anytime.',
      },
    ],
  },
  {
    id: '2',
    title: 'Your Data. Safely Stored.',
    content: [
      'We store your health data on Walrus, a public blockchain.',
      'There are no servers and no central control.',
      'No one can block, censor, or alter your data.',
      'Your data is encrypted on your device before it\'s ever sent.',
    ],
  },
  {
    id: '3',
    title: 'You Own It. You Control It.',
    content: [
      'Your health data is your asset.',
      'You can sell it, share it, or turn it into an NFT.',
      'You decide who can access it, and you can revoke that access anytime.',
    ],
    showButton: true,
  },
];

export default function IntroScreen({
  onGenerateMockData,
}: IntroScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleGetStarted = async () => {
    setIsLoading(true);
    // Simulate loading time for populating health data
    setTimeout(() => {
      // Generate mock data and complete intro
      onGenerateMockData();
    }, 2000);
  };

  const onScroll = (event: any) => {
    const pageIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(pageIndex);
  };

  const renderPage = ({ item, index }: { item: any; index: number }) => {
    if (item.sections) {
      // Page 1: Home page with sections
      return (
        <View style={[styles.page, { width }]}>
          <View style={styles.contentWrapper}>
            <View style={styles.titleContainer}>
              <Text style={styles.mainTitle}>{item.title}</Text>
              <Text style={styles.mainSubtitle}>{item.subtitle}</Text>
            </View>

            <View style={styles.sectionsContainer}>
              {item.sections.map((section: any, idx: number) => (
                <View key={idx} style={styles.section}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionDescription}>{section.description}</Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerText}>
              This version uses mock data for demo purposes.{'\n'}
              Apple Health integration is coming soon.
            </Text>
          </View>
        </View>
      );
    } else if (item.content) {
      // Pages 2 & 3: Content pages
      return (
        <View style={[styles.page, { width }]}>
          <View style={styles.contentWrapper}>
            <Text style={styles.pageTitle}>{item.title}</Text>
            
            <View style={styles.contentList}>
              {item.content.map((text: string, idx: number) => (
                <Text key={idx} style={styles.contentItem}>{text}</Text>
              ))}
            </View>
            
            {item.showButton && (
              <TouchableOpacity 
                style={styles.getStartedButton}
                onPress={handleGetStarted}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.getStartedButtonText}>Get Started</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          
          {!item.showButton && (
            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                This version uses mock data for demo purposes.{'\n'}
                Apple Health integration is coming soon.
              </Text>
            </View>
          )}
        </View>
      );
    }
  };

  const renderPageIndicator = () => (
    <View style={styles.pageIndicatorContainer}>
      {onboardingData.map((_, index) => (
        <View
          key={index}
          style={[
            styles.pageIndicator,
            {
              backgroundColor: index === currentPage ? '#007AFF' : '#E0E0E0',
            },
          ]}
        />
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Populating Health Data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />
      {renderPageIndicator()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  page: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 40,
  },
  titleContainer: {
    marginBottom: 80,
  },
  mainTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 24,
    color: '#666',
    fontWeight: '400',
  },
  sectionsContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 60,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 18,
    color: '#666',
    lineHeight: 24,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000',
    marginBottom: 60,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  contentList: {
    flex: 1,
  },
  contentItem: {
    fontSize: 20,
    color: '#333',
    lineHeight: 28,
    marginBottom: 32,
  },
  disclaimerContainer: {
    position: 'absolute',
    bottom: 40,
    left: 32,
    right: 32,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  getStartedButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 24,
    minWidth: 200,
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    gap: 8,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingSpinner: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
});
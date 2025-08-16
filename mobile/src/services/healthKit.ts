import { Platform } from 'react-native';

let AppleHealthKit: any = null;

try {
  if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health').default;
    console.log('✅ Successfully loaded react-native-health module');
  }
} catch (error) {
  console.log('❌ Failed to load react-native-health module:', error);
  // HealthKit not available, will use mock data
}

export interface HealthMetric {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  source: string;
  device?: string;
}

export interface HealthDataRange {
  startDate: Date;
  endDate: Date;
}

const getPermissions = () => {
  // Use proper HealthKit permission constants as shown in the implementation
  return {
    permissions: {
      read: [
        'HKQuantityTypeIdentifierHeight',
        'HKQuantityTypeIdentifierStepCount', 
        'HKWorkoutTypeIdentifier',
        'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        'HKQuantityTypeIdentifierHeartRate',
        'HKQuantityTypeIdentifierRestingHeartRate',
        'HKQuantityTypeIdentifierWalkingHeartRateAverage',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
        'HKQuantityTypeIdentifierAppleExerciseTime',
        'HKQuantityTypeIdentifierDistanceWalkingRunning',
        'HKQuantityTypeIdentifierBodyMass',
      ],
      write: [
        'HKQuantityTypeIdentifierStepCount',
        'HKWorkoutTypeIdentifier',
        'HKQuantityTypeIdentifierActiveEnergyBurned',
      ],
    },
  };
};

class HealthKitService {
  private isAvailable: boolean = false;
  private useMockData: boolean = false;

  async initialize(): Promise<boolean> {
    console.log('🔄 HealthKit initializing...');
    
    if (Platform.OS !== 'ios') {
      console.log('📱 Not iOS platform, using mock data');
      this.useMockData = true;
      this.isAvailable = true;
      return true;
    }

    if (!AppleHealthKit) {
      console.log('❌ AppleHealthKit module not available, using mock data');
      this.useMockData = true;
      this.isAvailable = false;
      return false;
    }

    try {
      console.log('🔍 Checking HealthKit availability...');
      
      // First check if HealthKit is available
      const isAvailable = await new Promise<boolean>((resolve) => {
        AppleHealthKit.isAvailable((error: any, available: boolean) => {
          if (error) {
            console.log('❌ HealthKit availability check error:', error);
            resolve(false);
          } else {
            console.log('✅ HealthKit availability:', available);
            resolve(available);
          }
        });
      });

      if (!isAvailable) {
        console.log('⚠️ HealthKit not available on this device (likely simulator), using mock data');
        this.useMockData = true;
        this.isAvailable = false;
        return false;
      }

      // Initialize HealthKit with permissions (like in your screenshot)
      console.log('🔐 Initializing HealthKit with permissions...');
      const permissions = getPermissions();
      
      const initSuccess = await new Promise<boolean>((resolve) => {
        AppleHealthKit.initHealthKit(permissions, (error: string | null) => {
          if (error) {
            console.log('❌ HealthKit initialization error:', error);
            resolve(false);
          } else {
            console.log('✅ HealthKit initialized successfully with permissions');
            resolve(true);
          }
        });
      });

      if (initSuccess) {
        console.log('🍎 HealthKit fully initialized! Ready for real health data');
        this.isAvailable = true;
        this.useMockData = false;
        return true;
      } else {
        console.log('⚠️ HealthKit initialization failed, using mock data');
        this.useMockData = true;
        this.isAvailable = false;
        return false;
      }
    } catch (error) {
      console.log('❌ HealthKit initialization error:', error);
      this.useMockData = true;
      this.isAvailable = false;
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    console.log('🔐 Requesting HealthKit permissions...');
    
    if (Platform.OS !== 'ios') {
      console.log('📱 Not iOS, permissions not applicable');
      return false;
    }

    if (!AppleHealthKit) {
      console.log('❌ AppleHealthKit module not available');
      return false;
    }

    if (!this.isAvailable) {
      console.log('⚠️ HealthKit not available on this device');
      return false;
    }

    // Permissions are already handled in initialize(), this is for re-requesting
    const permissions = getPermissions();

    return new Promise((resolve) => {
      try {
        AppleHealthKit.initHealthKit(permissions, (error: string | null) => {
          if (error) {
            console.log('❌ Permission request failed:', error);
            this.useMockData = true;
            resolve(false);
            return;
          }
          
          console.log('✅ HealthKit permissions granted successfully');
          this.useMockData = false;
          resolve(true);
        });
      } catch (error) {
        console.log('❌ Permission request error:', error);
        this.useMockData = true;
        resolve(false);
      }
    });
  }

  isUsingMockData(): boolean {
    return this.useMockData;
  }

  getDataSource(): string {
    if (Platform.OS !== 'ios') {
      return 'Mock Data (Non-iOS Device)';
    }
    if (!AppleHealthKit) {
      return 'Mock Data (HealthKit Module Missing)';
    }
    if (!this.isAvailable) {
      return 'Mock Data (HealthKit Unavailable - Likely Simulator)';
    }
    return this.useMockData ? 'Mock Data (Demo Mode)' : 'Apple Health';
  }

  generateMockData(metric: string, range: HealthDataRange, count: number): HealthMetric[] {
    const data: HealthMetric[] = [];
    const start = range.startDate.getTime();
    const end = range.endDate.getTime();
    const interval = (end - start) / count;

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(start + i * interval);
      let value: number;
      let unit: string;

      switch (metric) {
        case 'hrv':
          value = Math.floor(Math.random() * 30) + 40; // 40-70ms
          unit = 'ms';
          break;
        case 'rhr':
          value = Math.floor(Math.random() * 20) + 50; // 50-70 bpm
          unit = 'bpm';
          break;
        case 'active_calories':
          value = Math.floor(Math.random() * 500) + 200; // 200-700 kcal
          unit = 'kcal';
          break;
        case 'exercise_minutes':
          value = Math.floor(Math.random() * 60) + 10; // 10-70 min
          unit = 'min';
          break;
        case 'weight':
          value = Math.floor(Math.random() * 40) + 140; // 140-180 lbs
          unit = 'lbs';
          break;
        default:
          value = Math.random() * 100;
          unit = 'units';
      }

      data.push({
        timestamp: timestamp.toISOString(),
        metric,
        value,
        unit,
        source: 'mock_data',
        device: 'simulator',
      });
    }

    return data;
  }

  async getHRV(range: HealthDataRange): Promise<HealthMetric[]> {
    if (!this.isAvailable) {
      console.log('⚠️ HealthKit not available, using mock data for HRV');
      return this.generateMockData('hrv', range, 30);
    }

    if (this.useMockData) {
      console.log('📊 Using mock data for HRV');
      return this.generateMockData('hrv', range, 30);
    }

    console.log('🔍 Fetching HRV data from HealthKit...');
    
    return new Promise((resolve) => {
      const options = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
        limit: 1000,
      };

      AppleHealthKit.getHeartRateVariabilitySamples(
        options,
        (err: any, results: any[]) => {
          if (err) {
            console.log('❌ HRV fetch error, using mock data:', err);
            resolve(this.generateMockData('hrv', range, 30));
            return;
          }

          console.log(`✅ Fetched ${results?.length || 0} HRV samples from HealthKit`);
          
          const metrics: HealthMetric[] = (results || []).map((sample) => ({
            timestamp: sample.startDate,
            metric: 'hrv',
            value: sample.value,
            unit: 'ms',
            source: 'apple_health',
            device: sample.sourceName || 'Apple Watch',
          }));

          // If no real data, use mock data
          if (metrics.length === 0) {
            console.log('⚠️ No HRV data found in HealthKit, using mock data');
            resolve(this.generateMockData('hrv', range, 30));
          } else {
            resolve(metrics);
          }
        }
      );
    });
  }

  async getRestingHeartRate(range: HealthDataRange): Promise<HealthMetric[]> {
    if (!this.isAvailable) {
      throw new Error('HealthKit not initialized');
    }

    if (this.useMockData) {
      return this.generateMockData('rhr', range, 30);
    }

    return new Promise((resolve) => {
      const options = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getRestingHeartRateSamples(
        options,
        (err: any, results: any[]) => {
          if (err) {
            resolve(this.generateMockData('rhr', range, 30));
            return;
          }

          const metrics: HealthMetric[] = (results || []).map((sample) => ({
            timestamp: sample.startDate,
            metric: 'rhr',
            value: sample.value,
            unit: 'bpm',
            source: 'apple_health',
            device: sample.sourceName,
          }));

          resolve(metrics);
        }
      );
    });
  }

  async getActiveCalories(range: HealthDataRange): Promise<HealthMetric[]> {
    if (!this.isAvailable) {
      throw new Error('HealthKit not initialized');
    }

    if (this.useMockData) {
      return this.generateMockData('active_calories', range, 30);
    }

    return new Promise((resolve) => {
      const options = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getActiveEnergyBurned(
        options,
        (err: any, results: any[]) => {
          if (err) {
            resolve(this.generateMockData('active_calories', range, 30));
            return;
          }

          const metrics: HealthMetric[] = (results || []).map((sample) => ({
            timestamp: sample.startDate,
            metric: 'active_calories',
            value: sample.value,
            unit: 'kcal',
            source: 'apple_health',
            device: sample.sourceName,
          }));

          resolve(metrics);
        }
      );
    });
  }

  async getExerciseMinutes(range: HealthDataRange): Promise<HealthMetric[]> {
    if (!this.isAvailable) {
      throw new Error('HealthKit not initialized');
    }

    if (this.useMockData) {
      return this.generateMockData('exercise_minutes', range, 30);
    }

    return new Promise((resolve) => {
      const options = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getSamples(
        { ...options, type: 'AppleExerciseTime' },
        (err: any, results: any[]) => {
          if (err) {
            resolve(this.generateMockData('exercise_minutes', range, 30));
            return;
          }

          const metrics: HealthMetric[] = (results || []).map((sample) => ({
            timestamp: sample.startDate,
            metric: 'exercise_minutes',
            value: sample.value,
            unit: 'min',
            source: 'apple_health',
            device: sample.sourceName,
          }));

          resolve(metrics);
        }
      );
    });
  }

  async getWeight(range: HealthDataRange): Promise<HealthMetric[]> {
    if (!this.isAvailable) {
      throw new Error('HealthKit not initialized');
    }

    if (this.useMockData) {
      return this.generateMockData('weight', range, 30);
    }

    // In a real implementation, this would call HealthKit for weight data
    return this.generateMockData('weight', range, 30);
  }

  async getAllHealthData(range: HealthDataRange): Promise<{
    hrv: HealthMetric[];
    rhr: HealthMetric[];
    calories: HealthMetric[];
    exercise: HealthMetric[];
    weight: HealthMetric[];
  }> {
    const [hrv, rhr, calories, exercise, weight] = await Promise.all([
      this.getHRV(range),
      this.getRestingHeartRate(range),
      this.getActiveCalories(range),
      this.getExerciseMinutes(range),
      this.getWeight(range),
    ]);

    return { hrv, rhr, calories, exercise, weight };
  }

  formatForStorage(metrics: HealthMetric[]): string {
    return metrics
      .map((m) => JSON.stringify({
        ts: m.timestamp,
        metric: m.metric,
        value: m.value,
        unit: m.unit,
        source: m.source,
        device: m.device,
      }))
      .join('\n');
  }
}

export default new HealthKitService();
import { Platform } from 'react-native';

// Try to import HealthKit, but handle gracefully if not available
let AppleHealthKit: any = null;

try {
  if (Platform.OS === 'ios') {
    console.log('🔍 [IMPORT] Attempting to import react-native-health...');
    
    // Try ES6 import first
    try {
      const HealthKit = require('react-native-health');
      console.log('📦 [IMPORT] react-native-health module loaded via require:', !!HealthKit);
      console.log('📦 [IMPORT] Available exports:', Object.keys(HealthKit || {}));
      
      // Try to extract AppleHealthKit from different possible export patterns
      const possibleImports = [
        HealthKit,
        HealthKit.default,
        HealthKit.AppleHealthKit,
        HealthKit.HealthKit
      ];
      
      for (let i = 0; i < possibleImports.length; i++) {
        const candidate = possibleImports[i];
        console.log(`🔍 [IMPORT] Checking candidate ${i}:`, !!candidate, typeof candidate);
        
        if (candidate && typeof candidate.initHealthKit === 'function') {
          AppleHealthKit = candidate;
          console.log(`✅ [IMPORT] Found working AppleHealthKit at candidate ${i}`);
          break;
        }
      }
      
      // If nothing worked, try direct ES6 import
      if (!AppleHealthKit) {
        console.log('🔄 [IMPORT] Trying direct ES6 import...');
        const ImportedHealthKit = require('react-native-health');
        
        // Check if it's the module itself that has the methods
        if (ImportedHealthKit && typeof ImportedHealthKit.initHealthKit === 'function') {
          AppleHealthKit = ImportedHealthKit;
          console.log('✅ [IMPORT] Using direct module import');
        } else if (ImportedHealthKit && ImportedHealthKit.default && typeof ImportedHealthKit.default.initHealthKit === 'function') {
          AppleHealthKit = ImportedHealthKit.default;
          console.log('✅ [IMPORT] Using default export');
        }
      }
      
    } catch (importError) {
      console.error('❌ [IMPORT] ES6 import failed:', importError);
      
      // Fallback to dynamic import
      console.log('🔄 [IMPORT] Trying fallback import...');
      AppleHealthKit = null;
    }
    
    console.log('🏥 [IMPORT] Final AppleHealthKit status:', !!AppleHealthKit);
    if (AppleHealthKit) {
      console.log('📱 [IMPORT] initHealthKit available:', typeof AppleHealthKit.initHealthKit);
      console.log('🔑 [IMPORT] Constants available:', typeof AppleHealthKit.Constants);
      console.log('🔍 [IMPORT] isAvailable method:', typeof AppleHealthKit.isAvailable);
      console.log('🎯 [IMPORT] AppleHealthKit methods:', Object.keys(AppleHealthKit).filter(key => typeof AppleHealthKit[key] === 'function'));
    }
  }
} catch (error) {
  console.error('❌ [IMPORT] HealthKit import completely failed:', error);
  console.error('❌ [IMPORT] Error stack:', (error as Error)?.stack);
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
  // Use string constants as per react-native-health documentation
  return {
    permissions: {
      read: [
        'HeartRateVariability',
        'RestingHeartRate', 
        'ActiveEnergyBurned',
        'AppleExerciseTime',
        'HeartRate',
        'StepCount',
        'DistanceWalkingRunning',
      ],
      write: [],
    },
  };
};

class HealthKitService {
  private isAvailable: boolean = false;
  private useMockData: boolean = false;

  async initialize(): Promise<boolean> {
    console.log('🎯 [SERVICE] initialize() called');
    console.log('🏥 [SERVICE] Initializing HealthKit...');
    console.log('📱 [SERVICE] Platform.OS:', Platform.OS);
    console.log('🍎 [SERVICE] AppleHealthKit available:', !!AppleHealthKit);
    
    // Check if we're on iOS and HealthKit is available
    if (Platform.OS !== 'ios') {
      console.log('❌ [SERVICE] Not on iOS, using mock data');
      this.useMockData = true;
      this.isAvailable = true;
      return true;
    }

    if (!AppleHealthKit) {
      console.log('❌ [SERVICE] HealthKit library not available, using mock data');
      this.useMockData = true;
      this.isAvailable = false;
      return false;
    }

    // Check if HealthKit is available on this device
    try {
      console.log('🔍 [SERVICE] Checking if HealthKit is available on device...');
      const isAvailable = await new Promise((resolve) => {
        AppleHealthKit.isAvailable((error: any, available: boolean) => {
          console.log('📞 [SERVICE] AppleHealthKit.isAvailable callback called');
          console.log('📞 [SERVICE] Error:', error);
          console.log('📞 [SERVICE] Available:', available);
          
          if (error) {
            console.log('❌ [SERVICE] HealthKit not available on device:', error);
            resolve(false);
          } else {
            resolve(available);
          }
        });
      });

      console.log('🔍 [SERVICE] HealthKit availability check result:', isAvailable);

      if (!isAvailable) {
        console.log('❌ [SERVICE] HealthKit not available on this device');
        this.useMockData = true;
        this.isAvailable = false;
        return false;
      }

      // HealthKit is available, start with mock data until user connects
      this.isAvailable = true;
      this.useMockData = true;
      console.log('✅ [SERVICE] HealthKit available on device, starting with mock data');
      console.log('📊 [SERVICE] Final state - isAvailable:', this.isAvailable, 'useMockData:', this.useMockData);
      return true;
    } catch (error) {
      console.log('❌ [SERVICE] Error checking HealthKit availability:', error);
      console.error('❌ [SERVICE] Error stack:', (error as Error)?.stack);
      this.useMockData = true;
      this.isAvailable = false;
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    console.log('🎯 [SERVICE] requestPermissions() called');
    console.log('🔐 [SERVICE] User requesting HealthKit permissions...');
    console.log('📱 [SERVICE] Platform.OS:', Platform.OS);
    console.log('🍎 [SERVICE] AppleHealthKit available:', !!AppleHealthKit);
    console.log('🏥 [SERVICE] this.isAvailable:', this.isAvailable);
    console.log('📊 [SERVICE] this.useMockData:', this.useMockData);
    
    // Check if we're on iOS and HealthKit is available
    if (Platform.OS !== 'ios') {
      console.log('❌ [SERVICE] Not on iOS, cannot request permissions');
      return false;
    }

    if (!AppleHealthKit) {
      console.log('❌ [SERVICE] HealthKit library not available');
      return false;
    }

    if (!this.isAvailable) {
      console.log('❌ [SERVICE] HealthKit not available on this device');
      return false;
    }

    const permissions = getPermissions();
    console.log('🔑 [SERVICE] Generated permissions object:', JSON.stringify(permissions, null, 2));

    // Request HealthKit permissions
    return new Promise((resolve) => {
      try {
        console.log('🔐 [SERVICE] Calling AppleHealthKit.initHealthKit...');
        console.log('🔐 [SERVICE] Permissions being passed:', permissions);
        
        AppleHealthKit.initHealthKit(permissions, (error: string, results: any) => {
          console.log('📞 [SERVICE] HealthKit initHealthKit callback called!');
          console.log('📞 [SERVICE] Error:', error);
          console.log('📞 [SERVICE] Results:', results);
          console.log('📞 [SERVICE] Error type:', typeof error);
          
          if (error) {
            console.warn('❌ [SERVICE] HealthKit permission denied or error:', error);
            console.log('📱 [SERVICE] User can grant permissions in Settings > Health > Data Access & Devices');
            this.useMockData = true;
            console.log('🔄 [SERVICE] Resolving with false due to error');
            resolve(false);
            return;
          }
          
          // Success! Real HealthKit is available
          this.useMockData = false;
          console.log('✅ [SERVICE] HealthKit permissions granted - will use real data');
          console.log('🔄 [SERVICE] Resolving with true - success!');
          resolve(true);
        });
        
        console.log('🔐 [SERVICE] AppleHealthKit.initHealthKit called, waiting for callback...');
      } catch (error) {
        console.error('❌ [SERVICE] HealthKit permission request failed with exception:', error);
        console.error('❌ [SERVICE] Error stack:', (error as Error)?.stack);
        this.useMockData = true;
        console.log('🔄 [SERVICE] Resolving with false due to exception');
        resolve(false);
      }
    });
  }

  isUsingMockData(): boolean {
    return this.useMockData;
  }

  getDataSource(): string {
    return this.useMockData ? 'Mock Data (for demo)' : 'Apple Health';
  }

  private generateMockData(metric: string, range: HealthDataRange, count: number): HealthMetric[] {
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
      throw new Error('HealthKit not initialized');
    }

    if (this.useMockData) {
      return this.generateMockData('hrv', range, 30);
    }

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
            console.warn('HRV fetch failed, using mock data:', err);
            resolve(this.generateMockData('hrv', range, 30));
            return;
          }

          const metrics: HealthMetric[] = (results || []).map((sample) => ({
            timestamp: sample.startDate,
            metric: 'hrv',
            value: sample.value,
            unit: 'ms',
            source: 'apple_health',
            device: sample.sourceName,
          }));

          resolve(metrics);
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
            console.warn('RHR fetch failed, using mock data:', err);
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
            console.warn('Calories fetch failed, using mock data:', err);
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
            console.warn('Exercise fetch failed, using mock data:', err);
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

  async getAllHealthData(range: HealthDataRange): Promise<{
    hrv: HealthMetric[];
    rhr: HealthMetric[];
    calories: HealthMetric[];
    exercise: HealthMetric[];
  }> {
    const [hrv, rhr, calories, exercise] = await Promise.all([
      this.getHRV(range),
      this.getRestingHeartRate(range),
      this.getActiveCalories(range),
      this.getExerciseMinutes(range),
    ]);

    return { hrv, rhr, calories, exercise };
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
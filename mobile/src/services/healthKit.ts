import { Platform } from 'react-native';

// Try to import HealthKit, but handle gracefully if not available
let AppleHealthKit: any = null;

try {
  if (Platform.OS === 'ios') {
    AppleHealthKit = require('react-native-health');
    // Handle different export formats
    if (AppleHealthKit.default) {
      AppleHealthKit = AppleHealthKit.default;
    }
  }
} catch (error) {
  console.log('HealthKit not available, using mock data');
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
  if (!AppleHealthKit || !AppleHealthKit.Constants) {
    return null;
  }
  
  try {
    return {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.HeartRateVariability,
          AppleHealthKit.Constants.Permissions.RestingHeartRate,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.AppleExerciseTime,
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.Steps,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
        ],
        write: [],
      },
    };
  } catch (error) {
    console.log('HealthKit Constants not available');
    return null;
  }
};

class HealthKitService {
  private isAvailable: boolean = false;
  private useMockData: boolean = false;

  async initialize(): Promise<boolean> {
    // Check if HealthKit is available
    const permissions = getPermissions();
    if (!AppleHealthKit || !permissions || !AppleHealthKit.initHealthKit) {
      console.log('HealthKit not available, enabling mock data mode');
      this.useMockData = true;
      this.isAvailable = true;
      return true;
    }

    return new Promise((resolve, reject) => {
      try {
        AppleHealthKit.initHealthKit(permissions, (error: string) => {
          if (error) {
            console.error('HealthKit permission error, falling back to mock data:', error);
            this.useMockData = true;
            this.isAvailable = true;
            resolve(true);
            return;
          }
          this.isAvailable = true;
          this.useMockData = false;
          console.log('HealthKit initialized successfully');
          resolve(true);
        });
      } catch (error) {
        console.error('HealthKit initialization error:', error);
        this.useMockData = true;
        this.isAvailable = true;
        resolve(true);
      }
    });
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

    return new Promise((resolve, reject) => {
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

    return new Promise((resolve, reject) => {
      const options = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getRestingHeartRate(
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

    return new Promise((resolve, reject) => {
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

    return new Promise((resolve, reject) => {
      const options = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getAppleExerciseTime(
        options,
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
import AppleHealthKit, {
  HealthKitPermissions,
  HealthInputOptions,
  HealthValue,
  HealthActivitySummary,
} from 'react-native-health';

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

const permissions: HealthKitPermissions = {
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

class HealthKitService {
  private isAvailable: boolean = false;

  async initialize(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.error('Cannot grant permissions!', error);
          reject(error);
          return;
        }
        this.isAvailable = true;
        resolve(true);
      });
    });
  }

  async getHRV(range: HealthDataRange): Promise<HealthMetric[]> {
    if (!this.isAvailable) {
      throw new Error('HealthKit not initialized');
    }

    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
        limit: 1000,
      };

      AppleHealthKit.getHeartRateVariabilitySamples(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err) {
            reject(err);
            return;
          }

          const metrics: HealthMetric[] = results.map((sample) => ({
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

    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getRestingHeartRate(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err) {
            reject(err);
            return;
          }

          const metrics: HealthMetric[] = results.map((sample) => ({
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

    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getActiveEnergyBurned(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err) {
            reject(err);
            return;
          }

          const metrics: HealthMetric[] = results.map((sample) => ({
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

    return new Promise((resolve, reject) => {
      const options: HealthInputOptions = {
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        ascending: true,
      };

      AppleHealthKit.getAppleExerciseTime(
        options,
        (err: Object, results: HealthValue[]) => {
          if (err) {
            reject(err);
            return;
          }

          const metrics: HealthMetric[] = results.map((sample) => ({
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
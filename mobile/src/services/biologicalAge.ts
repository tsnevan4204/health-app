import { HealthMetric } from './healthKit';

export interface BiologicalAgeData {
  biologicalAge: number;
  chronologicalAge: number;
  ageDifference: number;
  factors: {
    hrv: { score: number; impact: string };
    rhr: { score: number; impact: string };
    exercise: { score: number; impact: string };
    weight: { score: number; impact: string };
  };
  interpretation: string;
  recommendations: string[];
}

class BiologicalAgeService {
  calculateBiologicalAge(
    healthData: {
      hrv: HealthMetric[];
      rhr: HealthMetric[];
      exercise: HealthMetric[];
      weight: HealthMetric[];
    },
    chronologicalAge: number = Math.floor(Math.random() * 8) + 18 // Random age between 18-25
  ): BiologicalAgeData {
    
    // Calculate average values for each metric
    const avgHRV = this.calculateAverage(healthData.hrv);
    const avgRHR = this.calculateAverage(healthData.rhr);
    const avgExercise = this.calculateAverage(healthData.exercise);
    const avgWeight = this.calculateAverage(healthData.weight);

    // Score each factor (0-100, where 100 is optimal)
    const hrvScore = this.scoreHRV(avgHRV, chronologicalAge);
    const rhrScore = this.scoreRHR(avgRHR, chronologicalAge);
    const exerciseScore = this.scoreExercise(avgExercise);
    const weightScore = this.scoreWeight(avgWeight);

    // Calculate weighted biological age
    const overallScore = (hrvScore * 0.3 + rhrScore * 0.25 + exerciseScore * 0.25 + weightScore * 0.2);
    
    // Convert score to biological age
    const biologicalAge = this.scoreToBiologicalAge(overallScore, chronologicalAge);
    const ageDifference = biologicalAge - chronologicalAge;

    return {
      biologicalAge: Math.round(biologicalAge * 10) / 10,
      chronologicalAge,
      ageDifference: Math.round(ageDifference * 10) / 10,
      factors: {
        hrv: { score: hrvScore, impact: this.getImpactDescription(hrvScore) },
        rhr: { score: rhrScore, impact: this.getImpactDescription(rhrScore) },
        exercise: { score: exerciseScore, impact: this.getImpactDescription(exerciseScore) },
        weight: { score: weightScore, impact: this.getImpactDescription(weightScore) },
      },
      interpretation: this.getInterpretation(ageDifference),
      recommendations: this.getRecommendations(hrvScore, rhrScore, exerciseScore, weightScore),
    };
  }

  private calculateAverage(metrics: HealthMetric[]): number {
    if (!metrics || metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
  }

  private scoreHRV(avgHRV: number, age: number): number {
    // HRV typically decreases with age
    const expectedHRV = Math.max(20, 60 - (age - 20) * 0.8);
    const ratio = avgHRV / expectedHRV;
    return Math.min(100, Math.max(0, ratio * 85));
  }

  private scoreRHR(avgRHR: number, age: number): number {
    // Lower resting heart rate is generally better
    const optimalRHR = 55; // Athletic range
    const acceptableRHR = 70; // Normal range
    
    if (avgRHR <= optimalRHR) return 100;
    if (avgRHR <= acceptableRHR) return 80 - ((avgRHR - optimalRHR) / (acceptableRHR - optimalRHR)) * 30;
    return Math.max(20, 50 - (avgRHR - acceptableRHR));
  }

  private scoreExercise(avgExercise: number): number {
    // WHO recommends 150 minutes per week = ~21 minutes per day
    const optimal = 30; // 30 minutes per day
    const minimum = 20; // Minimum recommendation
    
    if (avgExercise >= optimal) return 100;
    if (avgExercise >= minimum) return 70 + ((avgExercise - minimum) / (optimal - minimum)) * 30;
    return (avgExercise / minimum) * 70;
  }

  private scoreWeight(avgWeight: number): number {
    // Healthy weight range for young adults (18-25): 130-160 lbs
    const optimal = 145; // Middle of healthy range for young adults
    const range = 15; // ±15 lbs from optimal
    
    const deviation = Math.abs(avgWeight - optimal);
    if (deviation <= 5) return 100;
    if (deviation <= range) return 80 - ((deviation - 5) / (range - 5)) * 30;
    return Math.max(30, 50 - (deviation - range));
  }

  private scoreToBiologicalAge(score: number, chronologicalAge: number): number {
    // Score of 85+ = younger than chronological age
    // Score of 50-85 = around chronological age
    // Score below 50 = older than chronological age
    
    if (score >= 85) {
      return chronologicalAge - ((score - 85) / 15) * 8; // Up to 8 years younger
    } else if (score >= 50) {
      return chronologicalAge + ((85 - score) / 35) * 5; // Up to 5 years older
    } else {
      return chronologicalAge + 5 + ((50 - score) / 50) * 10; // Up to 15 years older
    }
  }

  private getImpactDescription(score: number): string {
    if (score >= 80) return 'Excellent';
    if (score >= 65) return 'Good';
    if (score >= 50) return 'Average';
    if (score >= 35) return 'Below Average';
    return 'Poor';
  }

  private getInterpretation(ageDifference: number): string {
    if (ageDifference <= -3) return 'Your biological age suggests excellent health! Your body is functioning like someone significantly younger.';
    if (ageDifference <= -1) return 'Great job! Your biological age indicates you\'re healthier than average for your age.';
    if (ageDifference <= 1) return 'Your biological age aligns well with your chronological age.';
    if (ageDifference <= 3) return 'Your biological age suggests room for improvement in your health metrics.';
    return 'Your biological age indicates significant opportunity to improve your health and longevity.';
  }

  private getRecommendations(hrv: number, rhr: number, exercise: number, weight: number): string[] {
    const recommendations: string[] = [];
    
    if (hrv < 60) recommendations.push('Improve HRV through stress management, better sleep, and meditation');
    if (rhr < 60) recommendations.push('Lower resting heart rate with regular cardio exercise');
    if (exercise < 70) recommendations.push('Increase daily exercise to 30+ minutes for optimal health');
    if (weight < 70) recommendations.push('Optimize weight through balanced nutrition and portion control');
    
    if (recommendations.length === 0) {
      recommendations.push('Maintain your excellent health habits!', 'Consider advanced optimization strategies');
    }
    
    return recommendations;
  }

  getExplanation(): string {
    return `Biological age is calculated using key health metrics:

• Heart Rate Variability (30%): Measures autonomic nervous system health
• Resting Heart Rate (25%): Indicates cardiovascular fitness
• Exercise Minutes (25%): Reflects physical activity levels
• Weight Trends (20%): Shows metabolic health

Your biological age may be younger or older than your chronological age based on these health indicators.`;
  }
}

export default new BiologicalAgeService();
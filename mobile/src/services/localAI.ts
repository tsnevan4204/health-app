import AsyncStorage from '@react-native-async-storage/async-storage';

interface HealthData {
  hrv?: any[];
  rhr?: any[];
  weight?: any[];
  exercise?: any[];
  calories?: any[];
}

interface BiologicalAgeData {
  biologicalAge: number;
  chronologicalAge: number;
  ageDifference: number;
  interpretation: string;
  factors: any;
  recommendations: string[];
}

interface DocumentData {
  name: string;
  content?: string;
  blobId?: string;
  uploadedAt: string;
}

class LocalAIService {
  private healthData: HealthData | null = null;
  private biologicalAge: BiologicalAgeData | null = null;
  private documents: DocumentData[] = [];

  async initialize() {
    // Load health data from storage
    try {
      const storedHealthData = await AsyncStorage.getItem('@wellrus_health_data');
      if (storedHealthData) {
        this.healthData = JSON.parse(storedHealthData);
      }

      const storedBiologicalAge = await AsyncStorage.getItem('@wellrus_biological_age');
      if (storedBiologicalAge) {
        this.biologicalAge = JSON.parse(storedBiologicalAge);
      }

      const storedDocuments = await AsyncStorage.getItem('@wellrus_uploaded_documents');
      if (storedDocuments) {
        this.documents = JSON.parse(storedDocuments);
      }

      console.log('✅ LocalAI initialized with health data and documents');
    } catch (error) {
      console.error('❌ Failed to initialize LocalAI:', error);
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Document explanation requests
    if (lowerMessage.includes('explain this document') || lowerMessage.includes('analyze') && lowerMessage.includes('document')) {
      return this.handleDocumentAnalysis(userMessage);
    }

    // Health data analysis
    if (lowerMessage.includes('biological age') || lowerMessage.includes('bio age')) {
      return this.analyzeBiologicalAge();
    }
    
    if (lowerMessage.includes('hrv') || lowerMessage.includes('heart rate variability')) {
      return this.analyzeHRV();
    }
    
    if (lowerMessage.includes('resting heart rate') || lowerMessage.includes('rhr')) {
      return this.analyzeRestingHeartRate();
    }
    
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
      return this.analyzeExercise();
    }
    
    if (lowerMessage.includes('weight') || lowerMessage.includes('bmi')) {
      return this.analyzeWeight();
    }

    // Health insights and recommendations
    if (lowerMessage.includes('recommendation') || lowerMessage.includes('improve') || lowerMessage.includes('advice')) {
      return this.generateHealthRecommendations();
    }

    // Comparative analysis
    if (lowerMessage.includes('compare') || lowerMessage.includes('trend')) {
      return this.analyzeTrends();
    }

    // Default health assistant response
    return this.generateDefaultResponse(userMessage);
  }

  private handleDocumentAnalysis(userMessage: string): string {
    if (this.documents.length === 0) {
      return "I don't see any uploaded documents to analyze. Please upload a document first, and I'll be happy to explain its contents and relate it to your health data.";
    }

    const latestDoc = this.documents[this.documents.length - 1];
    
    // Simulate document analysis based on type and health context
    let analysis = `Based on your uploaded document "${latestDoc.name}", here's my analysis:\n\n`;
    
    if (latestDoc.name.toLowerCase().includes('blood') || latestDoc.name.toLowerCase().includes('lab')) {
      analysis += this.analyzeLabResults();
    } else if (latestDoc.name.toLowerCase().includes('report') || latestDoc.name.toLowerCase().includes('medical')) {
      analysis += this.analyzeMedicalReport();
    } else {
      analysis += this.analyzeGeneralDocument(latestDoc.name);
    }

    // Add health data correlation
    if (this.healthData) {
      analysis += "\n\n📊 **Correlation with your health data:**\n";
      analysis += this.correlateWithHealthData();
    }

    return analysis;
  }

  private analyzeLabResults(): string {
    let analysis = "🔬 **Lab Results Analysis:**\n";
    analysis += "This appears to be laboratory test results. ";
    
    if (this.biologicalAge) {
      analysis += `Given your biological age of ${this.biologicalAge.biologicalAge} years (${this.biologicalAge.ageDifference > 0 ? '+' : ''}${this.biologicalAge.ageDifference} vs chronological age), `;
      analysis += "I can help interpret how these lab values relate to your overall health profile.\n\n";
      
      if (this.biologicalAge.ageDifference < 0) {
        analysis += "✅ Your younger biological age suggests good metabolic health, which should be reflected in optimal lab markers.\n";
      } else {
        analysis += "⚠️ Your biological age indicates areas for improvement that may correlate with certain lab values.\n";
      }
    }

    return analysis;
  }

  private analyzeMedicalReport(): string {
    let analysis = "📋 **Medical Report Analysis:**\n";
    analysis += "This appears to be a medical report or consultation notes. ";
    
    if (this.healthData) {
      analysis += "I can correlate the findings with your continuous health monitoring data:\n\n";
      
      if (this.healthData.hrv && this.healthData.hrv.length > 0) {
        const avgHRV = this.healthData.hrv.reduce((sum, item) => sum + item.value, 0) / this.healthData.hrv.length;
        analysis += `• Your average HRV of ${avgHRV.toFixed(1)}ms provides context for stress and recovery patterns\n`;
      }
      
      if (this.healthData.rhr && this.healthData.rhr.length > 0) {
        const avgRHR = this.healthData.rhr.reduce((sum, item) => sum + item.value, 0) / this.healthData.rhr.length;
        analysis += `• Your average resting heart rate of ${avgRHR.toFixed(1)}bpm indicates cardiovascular fitness\n`;
      }
    }

    return analysis;
  }

  private analyzeGeneralDocument(fileName: string): string {
    return `📄 **Document Analysis: ${fileName}**\n\nI've analyzed your uploaded document. While I can't access the full content directly, I can provide insights on how document-based health information typically relates to continuous monitoring data like yours.\n\nFor more specific analysis, please describe what type of health information this document contains.`;
  }

  private correlateWithHealthData(): string {
    if (!this.healthData) return "No health data available for correlation.";

    let correlation = "";
    
    // Analyze recent trends
    if (this.healthData.hrv && this.healthData.hrv.length >= 7) {
      const recentHRV = this.healthData.hrv.slice(-7);
      const avgRecent = recentHRV.reduce((sum, item) => sum + item.value, 0) / recentHRV.length;
      const trend = this.calculateTrend(recentHRV.map(item => item.value));
      
      correlation += `• HRV trend (7-day): ${avgRecent.toFixed(1)}ms, ${trend > 0 ? 'improving' : trend < 0 ? 'declining' : 'stable'}\n`;
    }

    if (this.healthData.rhr && this.healthData.rhr.length >= 7) {
      const recentRHR = this.healthData.rhr.slice(-7);
      const avgRecent = recentRHR.reduce((sum, item) => sum + item.value, 0) / recentRHR.length;
      correlation += `• Recent resting HR: ${avgRecent.toFixed(1)}bpm\n`;
    }

    return correlation;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    return secondAvg - firstAvg;
  }

  private analyzeBiologicalAge(): string {
    if (!this.biologicalAge) {
      return "I don't have your biological age data yet. Please generate health data first, then I can provide detailed biological age analysis.";
    }

    let analysis = `🧬 **Your Biological Age Analysis:**\n\n`;
    analysis += `• **Biological Age:** ${this.biologicalAge.biologicalAge} years\n`;
    analysis += `• **Chronological Age:** ${this.biologicalAge.chronologicalAge} years\n`;
    analysis += `• **Difference:** ${this.biologicalAge.ageDifference > 0 ? '+' : ''}${this.biologicalAge.ageDifference} years\n\n`;
    analysis += `**Interpretation:** ${this.biologicalAge.interpretation}\n\n`;
    
    if (this.biologicalAge.recommendations) {
      analysis += `**AI Recommendations:**\n`;
      this.biologicalAge.recommendations.forEach((rec, index) => {
        analysis += `${index + 1}. ${rec}\n`;
      });
    }

    return analysis;
  }

  private analyzeHRV(): string {
    if (!this.healthData?.hrv || this.healthData.hrv.length === 0) {
      return "No HRV data available. Please connect your wearable device to get heart rate variability insights.";
    }

    const hrvData = this.healthData.hrv;
    const avgHRV = hrvData.reduce((sum, item) => sum + item.value, 0) / hrvData.length;
    const recentWeek = hrvData.slice(-7);
    const weeklyAvg = recentWeek.reduce((sum, item) => sum + item.value, 0) / recentWeek.length;
    
    let analysis = `💓 **Heart Rate Variability Analysis:**\n\n`;
    analysis += `• **Overall Average:** ${avgHRV.toFixed(1)}ms\n`;
    analysis += `• **Recent 7-day Average:** ${weeklyAvg.toFixed(1)}ms\n`;
    analysis += `• **Total Measurements:** ${hrvData.length}\n\n`;
    
    if (avgHRV > 50) {
      analysis += `✅ **Excellent HRV** - Your nervous system shows good adaptability and stress resilience.\n\n`;
    } else if (avgHRV > 30) {
      analysis += `👍 **Good HRV** - Your autonomic nervous system is functioning well.\n\n`;
    } else {
      analysis += `⚠️ **Room for Improvement** - Consider stress management and recovery practices.\n\n`;
    }

    analysis += `**Recommendations:**\n• Focus on quality sleep (7-9 hours)\n• Practice stress reduction techniques\n• Maintain consistent exercise routine\n• Monitor alcohol and caffeine intake`;

    return analysis;
  }

  private analyzeRestingHeartRate(): string {
    if (!this.healthData?.rhr || this.healthData.rhr.length === 0) {
      return "No resting heart rate data available. Please connect your wearable device to get cardiovascular insights.";
    }

    const rhrData = this.healthData.rhr;
    const avgRHR = rhrData.reduce((sum, item) => sum + item.value, 0) / rhrData.length;
    const trend = this.calculateTrend(rhrData.slice(-14).map(item => item.value));
    
    let analysis = `❤️ **Resting Heart Rate Analysis:**\n\n`;
    analysis += `• **Average RHR:** ${avgRHR.toFixed(1)} bpm\n`;
    analysis += `• **14-day Trend:** ${trend > 1 ? 'Increasing' : trend < -1 ? 'Decreasing' : 'Stable'}\n\n`;
    
    if (avgRHR < 60) {
      analysis += `🏃‍♂️ **Excellent Cardiovascular Fitness** - Your low RHR indicates strong heart efficiency.\n\n`;
    } else if (avgRHR < 80) {
      analysis += `👍 **Good Cardiovascular Health** - Your RHR is within healthy range.\n\n`;
    } else {
      analysis += `⚠️ **Consider Improvement** - Higher RHR may indicate need for better cardiovascular conditioning.\n\n`;
    }

    analysis += `**Optimization Tips:**\n• Regular cardio exercise\n• Adequate sleep and recovery\n• Stress management\n• Stay hydrated`;

    return analysis;
  }

  private analyzeExercise(): string {
    if (!this.healthData?.exercise || this.healthData.exercise.length === 0) {
      return "No exercise data available. Please connect your wearable device to track physical activity.";
    }

    const exerciseData = this.healthData.exercise;
    const totalMinutes = exerciseData.reduce((sum, item) => sum + item.value, 0);
    const avgDaily = totalMinutes / exerciseData.length;
    const weeklyTotal = avgDaily * 7;
    
    let analysis = `🏃‍♂️ **Exercise Analysis:**\n\n`;
    analysis += `• **Total Exercise Minutes:** ${totalMinutes.toFixed(0)}\n`;
    analysis += `• **Average Daily:** ${avgDaily.toFixed(1)} minutes\n`;
    analysis += `• **Weekly Projection:** ${weeklyTotal.toFixed(0)} minutes\n\n`;
    
    if (weeklyTotal >= 150) {
      analysis += `🎯 **Meeting WHO Guidelines** - Excellent! You're exceeding the recommended 150 minutes/week.\n\n`;
    } else if (weeklyTotal >= 100) {
      analysis += `👍 **Good Progress** - You're on track. Aim for 150+ minutes weekly.\n\n`;
    } else {
      analysis += `⚠️ **Opportunity for Growth** - Consider increasing activity to meet 150 minutes/week goal.\n\n`;
    }

    analysis += `**Recommendations:**\n• Mix cardio and strength training\n• Gradual increase in intensity\n• Track recovery metrics\n• Consistency over intensity`;

    return analysis;
  }

  private analyzeWeight(): string {
    if (!this.healthData?.weight || this.healthData.weight.length === 0) {
      return "No weight data available. Regular weight monitoring helps track health trends.";
    }

    const weightData = this.healthData.weight.slice(-30); // Last 30 measurements
    const currentWeight = weightData[weightData.length - 1].value;
    const trend = this.calculateTrend(weightData.map(item => item.value));
    
    let analysis = `⚖️ **Weight Analysis:**\n\n`;
    analysis += `• **Current Weight:** ${currentWeight.toFixed(1)} lbs\n`;
    analysis += `• **30-day Trend:** ${Math.abs(trend) < 0.5 ? 'Stable' : trend > 0 ? `+${trend.toFixed(1)} lbs` : `${trend.toFixed(1)} lbs`}\n\n`;
    
    if (Math.abs(trend) < 0.5) {
      analysis += `✅ **Stable Weight** - Good maintenance of current weight.\n\n`;
    } else if (trend > 2) {
      analysis += `📈 **Upward Trend** - Monitor nutrition and activity levels.\n\n`;
    } else if (trend < -2) {
      analysis += `📉 **Downward Trend** - Ensure adequate nutrition for health goals.\n\n`;
    }

    analysis += `**Health Integration:**\n• Weight stability supports consistent training\n• Monitor alongside exercise and recovery metrics\n• Focus on body composition over just weight`;

    return analysis;
  }

  private generateHealthRecommendations(): string {
    let recommendations = `🎯 **Personalized Health Recommendations:**\n\n`;
    
    if (this.biologicalAge) {
      if (this.biologicalAge.ageDifference > 0) {
        recommendations += `Based on your biological age being ${this.biologicalAge.ageDifference} years older:\n`;
        recommendations += `• Focus on stress reduction and recovery\n`;
        recommendations += `• Prioritize sleep quality (7-9 hours)\n`;
        recommendations += `• Increase cardiovascular exercise\n\n`;
      } else {
        recommendations += `Your biological age is ${Math.abs(this.biologicalAge.ageDifference)} years younger - keep it up!\n`;
        recommendations += `• Maintain current healthy habits\n`;
        recommendations += `• Continue monitoring key metrics\n\n`;
      }
    }

    if (this.healthData) {
      recommendations += `**Based on your data patterns:**\n`;
      
      if (this.healthData.hrv && this.healthData.hrv.length > 0) {
        const avgHRV = this.healthData.hrv.reduce((sum, item) => sum + item.value, 0) / this.healthData.hrv.length;
        if (avgHRV < 40) {
          recommendations += `• Work on HRV improvement through meditation and stress management\n`;
        }
      }
      
      if (this.healthData.exercise && this.healthData.exercise.length > 0) {
        const avgDaily = this.healthData.exercise.reduce((sum, item) => sum + item.value, 0) / this.healthData.exercise.length;
        if (avgDaily < 20) {
          recommendations += `• Gradually increase daily exercise to 30+ minutes\n`;
        }
      }
    }

    recommendations += `\n**Next Steps:**\n• Continue consistent data tracking\n• Regular health check-ups\n• Monitor trends over time`;

    return recommendations;
  }

  private analyzeTrends(): string {
    if (!this.healthData) {
      return "No health data available for trend analysis. Please connect your wearable device first.";
    }

    let analysis = `📈 **Health Trends Analysis:**\n\n`;
    
    // HRV trends
    if (this.healthData.hrv && this.healthData.hrv.length >= 14) {
      const recentHRV = this.healthData.hrv.slice(-14);
      const hrvTrend = this.calculateTrend(recentHRV.map(item => item.value));
      analysis += `• **HRV Trend (14-day):** ${hrvTrend > 1 ? '↗️ Improving' : hrvTrend < -1 ? '↘️ Declining' : '➡️ Stable'}\n`;
    }

    // RHR trends
    if (this.healthData.rhr && this.healthData.rhr.length >= 14) {
      const recentRHR = this.healthData.rhr.slice(-14);
      const rhrTrend = this.calculateTrend(recentRHR.map(item => item.value));
      analysis += `• **RHR Trend (14-day):** ${rhrTrend < -1 ? '↗️ Improving (decreasing)' : rhrTrend > 1 ? '↘️ Watch (increasing)' : '➡️ Stable'}\n`;
    }

    // Exercise trends
    if (this.healthData.exercise && this.healthData.exercise.length >= 7) {
      const recentExercise = this.healthData.exercise.slice(-7);
      const exerciseTrend = this.calculateTrend(recentExercise.map(item => item.value));
      analysis += `• **Exercise Trend (7-day):** ${exerciseTrend > 5 ? '↗️ Increasing' : exerciseTrend < -5 ? '↘️ Decreasing' : '➡️ Consistent'}\n`;
    }

    analysis += `\n**Trend Insights:**\n`;
    analysis += `Your health metrics show patterns that can guide optimization strategies. `;
    analysis += `Focus on maintaining positive trends while addressing any declining metrics.`;

    return analysis;
  }

  private generateDefaultResponse(userMessage: string): string {
    const responses = [
      `I'm analyzing your question in the context of your health data. ${this.getHealthDataSummary()} What specific aspect would you like me to focus on?`,
      `Based on your health profile, I can provide personalized insights. ${this.getHealthDataSummary()} How can I help you understand your data better?`,
      `I have access to your health metrics and can provide tailored advice. ${this.getHealthDataSummary()} What would you like to explore?`,
      `Let me help you understand your health patterns. ${this.getHealthDataSummary()} Feel free to ask about any specific metric or trend.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getHealthDataSummary(): string {
    if (!this.healthData && !this.biologicalAge) {
      return "I don't have access to your health data yet.";
    }

    let summary = "";
    if (this.biologicalAge) {
      summary += `Your biological age is ${this.biologicalAge.biologicalAge} years. `;
    }
    
    if (this.healthData) {
      const metrics = [];
      if (this.healthData.hrv?.length) metrics.push('HRV');
      if (this.healthData.rhr?.length) metrics.push('heart rate');
      if (this.healthData.exercise?.length) metrics.push('exercise');
      if (this.healthData.weight?.length) metrics.push('weight');
      
      if (metrics.length > 0) {
        summary += `I have your ${metrics.join(', ')} data. `;
      }
    }

    return summary;
  }

  // Method to fetch data from blockchain when needed
  async fetchFromBlockchain(dataType: 'health' | 'documents' | 'both' = 'both'): Promise<void> {
    try {
      console.log(`🔗 Fetching ${dataType} data from blockchain...`);
      
      if (dataType === 'health' || dataType === 'both') {
        // Simulate blockchain data retrieval
        const blockchainInfo = await AsyncStorage.getItem('@walrus_blockchain_verification');
        if (blockchainInfo) {
          const info = JSON.parse(blockchainInfo);
          console.log(`📦 Found blockchain health data: ${info.complete_dataset_blob_id}`);
          // In a real implementation, you would fetch from Walrus using the blob ID
        }
      }

      if (dataType === 'documents' || dataType === 'both') {
        // Fetch document data from blockchain storage
        console.log('📄 Fetching document data from decentralized storage...');
        // Simulate document retrieval
      }

      console.log('✅ Blockchain data fetch completed');
    } catch (error) {
      console.error('❌ Failed to fetch from blockchain:', error);
    }
  }
}

export default new LocalAIService();
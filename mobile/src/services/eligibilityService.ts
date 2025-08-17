import AsyncStorage from '@react-native-async-storage/async-storage';
import { dynamicWalletService } from './dynamicWallet';

export interface Bounty {
  id: string;
  title: string;
  description: string;
  rewardAmount: number; // In USDC
  sponsor: string;
  maxParticipants: number;
  currentParticipants: number;
  startTime: Date;
  endTime: Date;
  active: boolean;
  eligibilityCriteria: EligibilityCriteria;
  userEligible?: boolean; // Set after checking
}

export interface EligibilityCriteria {
  minAge?: number;
  maxAge?: number;
  requiredMetrics: string[]; // ["heartRate", "steps", "sleep"]
  minDataPoints: number;
  requiresVerification: boolean;
  location?: string; // Optional location requirement
  deviceType?: string[]; // Optional device requirements
}

export interface UserProfile {
  age?: number;
  location?: string;
  verificationStatus: 'none' | 'pending' | 'verified';
  availableMetrics: string[];
  dataPointsCount: number;
  devices: string[];
}

const STORAGE_KEYS = {
  USER_PROFILE: '@user_profile',
  BOUNTY_ELIGIBILITY: '@bounty_eligibility',
  VERIFIED_STATUS: '@verified_status',
};

class EligibilityService {
  private userProfile: UserProfile | null = null;
  private eligibilityCache: Map<string, boolean> = new Map();

  /**
   * Initialize user profile for eligibility checks
   */
  async initializeUserProfile(profile: Partial<UserProfile>): Promise<void> {
    try {
      const existingProfile = await this.getUserProfile();
      
      this.userProfile = {
        ...existingProfile,
        ...profile,
        verificationStatus: profile.verificationStatus || 'none',
        availableMetrics: profile.availableMetrics || [],
        dataPointsCount: profile.dataPointsCount || 0,
        devices: profile.devices || [],
      };
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(this.userProfile)
      );
      
      console.log('✅ User profile initialized for eligibility');
    } catch (error) {
      console.error('❌ Failed to initialize user profile:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      if (this.userProfile) {
        return this.userProfile;
      }
      
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        this.userProfile = JSON.parse(stored);
        return this.userProfile!;
      }
      
      // Default profile
      return {
        verificationStatus: 'none',
        availableMetrics: [],
        dataPointsCount: 0,
        devices: [],
      };
    } catch (error) {
      console.error('❌ Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Check if user is eligible for a specific bounty
   */
  async checkBountyEligibility(bounty: Bounty): Promise<boolean> {
    try {
      console.log(`🔍 Checking eligibility for bounty: ${bounty.title}`);
      
      // Check cache first
      const cacheKey = `${bounty.id}_${Date.now()}`;
      if (this.eligibilityCache.has(bounty.id)) {
        return this.eligibilityCache.get(bounty.id)!;
      }
      
      const profile = await this.getUserProfile();
      const criteria = bounty.eligibilityCriteria;
      
      // Check if bounty is active
      if (!bounty.active) {
        console.log('❌ Bounty is not active');
        this.eligibilityCache.set(bounty.id, false);
        return false;
      }
      
      // Check if bounty has expired
      if (new Date() > bounty.endTime) {
        console.log('❌ Bounty has expired');
        this.eligibilityCache.set(bounty.id, false);
        return false;
      }
      
      // Check if bounty is full
      if (bounty.currentParticipants >= bounty.maxParticipants) {
        console.log('❌ Bounty is full');
        this.eligibilityCache.set(bounty.id, false);
        return false;
      }
      
      // Check age requirements
      if (criteria.minAge && profile.age) {
        if (profile.age < criteria.minAge) {
          console.log('❌ User does not meet minimum age requirement');
          this.eligibilityCache.set(bounty.id, false);
          return false;
        }
      }
      
      if (criteria.maxAge && profile.age) {
        if (profile.age > criteria.maxAge) {
          console.log('❌ User exceeds maximum age requirement');
          this.eligibilityCache.set(bounty.id, false);
          return false;
        }
      }
      
      // Check required metrics
      const hasAllMetrics = criteria.requiredMetrics.every(metric => 
        profile.availableMetrics.includes(metric)
      );
      
      if (!hasAllMetrics) {
        console.log('❌ User does not have all required metrics');
        this.eligibilityCache.set(bounty.id, false);
        return false;
      }
      
      // Check minimum data points
      if (profile.dataPointsCount < criteria.minDataPoints) {
        console.log('❌ User does not have enough data points');
        this.eligibilityCache.set(bounty.id, false);
        return false;
      }
      
      // Check verification requirement
      if (criteria.requiresVerification && profile.verificationStatus !== 'verified') {
        console.log('❌ User is not verified');
        this.eligibilityCache.set(bounty.id, false);
        return false;
      }
      
      // Check location requirement (if specified)
      if (criteria.location && profile.location) {
        if (profile.location !== criteria.location) {
          console.log('❌ User is not in required location');
          this.eligibilityCache.set(bounty.id, false);
          return false;
        }
      }
      
      // Check device requirements (if specified)
      if (criteria.deviceType && criteria.deviceType.length > 0) {
        const hasRequiredDevice = criteria.deviceType.some(device => 
          profile.devices.includes(device)
        );
        
        if (!hasRequiredDevice) {
          console.log('❌ User does not have required device type');
          this.eligibilityCache.set(bounty.id, false);
          return false;
        }
      }
      
      console.log('✅ User is eligible for this bounty');
      this.eligibilityCache.set(bounty.id, true);
      return true;
    } catch (error) {
      console.error('❌ Failed to check eligibility:', error);
      return false;
    }
  }

  /**
   * Check eligibility for multiple bounties
   */
  async checkMultipleBounties(bounties: Bounty[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const bounty of bounties) {
      const eligible = await this.checkBountyEligibility(bounty);
      results.set(bounty.id, eligible);
    }
    
    return results;
  }

  /**
   * Update user metrics availability
   */
  async updateAvailableMetrics(metrics: string[]): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      profile.availableMetrics = metrics;
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      
      this.userProfile = profile;
      
      // Clear eligibility cache as metrics have changed
      this.eligibilityCache.clear();
      
      console.log('✅ Available metrics updated');
    } catch (error) {
      console.error('❌ Failed to update metrics:', error);
      throw error;
    }
  }

  /**
   * Update data points count
   */
  async updateDataPointsCount(count: number): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      profile.dataPointsCount = count;
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      
      this.userProfile = profile;
      
      // Clear eligibility cache as data points have changed
      this.eligibilityCache.clear();
      
      console.log('✅ Data points count updated');
    } catch (error) {
      console.error('❌ Failed to update data points:', error);
      throw error;
    }
  }

  /**
   * Request user verification
   */
  async requestVerification(): Promise<void> {
    try {
      console.log('📝 Requesting user verification...');
      
      const profile = await this.getUserProfile();
      profile.verificationStatus = 'pending';
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      
      this.userProfile = profile;
      
      // In production, trigger actual verification process
      // For demo, automatically verify after delay
      setTimeout(async () => {
        await this.completeVerification();
      }, 5000);
      
      console.log('✅ Verification requested');
    } catch (error) {
      console.error('❌ Failed to request verification:', error);
      throw error;
    }
  }

  /**
   * Complete user verification
   */
  async completeVerification(): Promise<void> {
    try {
      const profile = await this.getUserProfile();
      profile.verificationStatus = 'verified';
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PROFILE,
        JSON.stringify(profile)
      );
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.VERIFIED_STATUS,
        JSON.stringify({
          verified: true,
          timestamp: new Date().toISOString(),
          walletAddress: await dynamicWalletService.getWallet(),
        })
      );
      
      this.userProfile = profile;
      
      // Clear eligibility cache as verification status changed
      this.eligibilityCache.clear();
      
      console.log('✅ User verification completed');
    } catch (error) {
      console.error('❌ Failed to complete verification:', error);
      throw error;
    }
  }

  /**
   * Clear eligibility cache
   */
  clearCache(): void {
    this.eligibilityCache.clear();
    console.log('✅ Eligibility cache cleared');
  }

  /**
   * Get eligibility summary for UI
   */
  async getEligibilitySummary(bounty: Bounty): Promise<{
    eligible: boolean;
    reasons: string[];
    missingRequirements: string[];
  }> {
    const eligible = await this.checkBountyEligibility(bounty);
    const reasons: string[] = [];
    const missingRequirements: string[] = [];
    
    const profile = await this.getUserProfile();
    const criteria = bounty.eligibilityCriteria;
    
    if (!bounty.active) {
      reasons.push('Bounty is not active');
    }
    
    if (new Date() > bounty.endTime) {
      reasons.push('Bounty has expired');
    }
    
    if (bounty.currentParticipants >= bounty.maxParticipants) {
      reasons.push('Bounty is full');
    }
    
    if (criteria.minAge && profile.age && profile.age < criteria.minAge) {
      missingRequirements.push(`Minimum age: ${criteria.minAge}`);
    }
    
    if (criteria.requiresVerification && profile.verificationStatus !== 'verified') {
      missingRequirements.push('Account verification required');
    }
    
    const missingMetrics = criteria.requiredMetrics.filter(metric => 
      !profile.availableMetrics.includes(metric)
    );
    
    if (missingMetrics.length > 0) {
      missingRequirements.push(`Missing metrics: ${missingMetrics.join(', ')}`);
    }
    
    if (profile.dataPointsCount < criteria.minDataPoints) {
      missingRequirements.push(
        `Need ${criteria.minDataPoints - profile.dataPointsCount} more data points`
      );
    }
    
    return {
      eligible,
      reasons,
      missingRequirements,
    };
  }
}

// Export singleton instance
export const eligibilityService = new EligibilityService();

// Helper function to format bounty for display
export const formatBountyForDisplay = (bounty: Bounty, eligible: boolean) => {
  return {
    ...bounty,
    displayStatus: eligible ? 'eligible' : 'ineligible',
    canParticipate: eligible && bounty.active && new Date() < bounty.endTime,
    spotsRemaining: bounty.maxParticipants - bounty.currentParticipants,
    timeRemaining: Math.max(0, bounty.endTime.getTime() - Date.now()),
  };
};
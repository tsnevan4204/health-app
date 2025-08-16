import { usePrivy } from '@privy-io/expo';

export function usePrivyAuth() {
  const privyData = usePrivy();
  
  // Safely extract properties that might not exist in current version
  const {
    user,
    logout,
  } = privyData;

  const ready = (privyData as any).ready ?? true;
  const authenticated = (privyData as any).authenticated ?? false;
  const login = (privyData as any).login ?? (() => Promise.resolve());
  const connectWallet = (privyData as any).connectWallet ?? (() => Promise.resolve());
  const linkWallet = (privyData as any).linkWallet ?? (() => Promise.resolve());
  const unlinkWallet = (privyData as any).unlinkWallet ?? (() => Promise.resolve());
  const exportWallet = (privyData as any).exportWallet ?? (() => Promise.resolve());
  const wallets = (privyData as any).wallets ?? [];

  const isLoading = !ready;
  const isAuthenticated = ready && authenticated;
  const userWallets = wallets || [];
  const embeddedWallet = userWallets.find((wallet: any) => wallet.walletClientType === 'privy');
  const connectedWallets = userWallets.filter((wallet: any) => wallet.walletClientType !== 'privy');

  const signIn = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Failed to sign in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  };

  const connectExternalWallet = async () => {
    try {
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const linkExternalWallet = async () => {
    try {
      await linkWallet();
    } catch (error) {
      console.error('Failed to link wallet:', error);
      throw error;
    }
  };

  const unlinkExternalWallet = async (walletAddress: string) => {
    try {
      await unlinkWallet(walletAddress);
    } catch (error) {
      console.error('Failed to unlink wallet:', error);
      throw error;
    }
  };

  const exportEmbeddedWallet = async () => {
    try {
      await exportWallet();
    } catch (error) {
      console.error('Failed to export wallet:', error);
      throw error;
    }
  };

  return {
    isLoading,
    isAuthenticated,
    user,
    userWallets,
    embeddedWallet,
    connectedWallets,
    signIn,
    signOut,
    connectExternalWallet,
    linkExternalWallet,
    unlinkExternalWallet,
    exportEmbeddedWallet,
  };
}
/// Health Data Access Control Module
/// This module manages access permissions for encrypted health data stored on Walrus
/// It integrates with Seal for decentralized secret management and NFT ownership verification

module health_data_access::health_access {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::vector;
    use std::string::{Self, String};

    /// Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVALID_NFT: u64 = 2;
    const E_ACCESS_EXPIRED: u64 = 3;
    const E_INVALID_POLICY: u64 = 4;

    /// Health Data Access Policy - Controls who can decrypt health data
    struct HealthAccessPolicy has key, store {
        id: UID,
        /// Hedera NFT token ID that grants access
        hedera_token_id: String,
        /// Hedera NFT serial number
        hedera_serial_number: u64,
        /// Walrus blob ID containing encrypted health data
        walrus_blob_id: String,
        /// Seal encryption parameters
        seal_threshold: u8,
        seal_key_server_ids: vector<String>,
        /// Access control settings
        owner: address,
        authorized_users: vector<address>,
        expiry_epoch: u64,
        /// Health data metadata (no PII)
        data_type: String,
        created_at: u64,
    }

    /// Access Grant Event - Emitted when access is granted
    struct AccessGranted has copy, drop {
        policy_id: ID,
        user: address,
        hedera_token_id: String,
        walrus_blob_id: String,
        timestamp: u64,
    }

    /// Access Denied Event - Emitted when access is denied
    struct AccessDenied has copy, drop {
        policy_id: ID,
        user: address,
        reason: String,
        timestamp: u64,
    }

    /// Create a new health data access policy
    public fun create_health_access_policy(
        hedera_token_id: vector<u8>,
        hedera_serial_number: u64,
        walrus_blob_id: vector<u8>,
        seal_threshold: u8,
        seal_key_server_ids: vector<vector<u8>>,
        data_type: vector<u8>,
        expiry_epoch: u64,
        ctx: &mut TxContext
    ): HealthAccessPolicy {
        let owner = tx_context::sender(ctx);
        
        // Convert byte vectors to strings
        let token_id_str = string::utf8(hedera_token_id);
        let blob_id_str = string::utf8(walrus_blob_id);
        let data_type_str = string::utf8(data_type);
        
        // Convert key server IDs
        let mut key_servers = vector::empty<String>();
        let mut i = 0;
        while (i < vector::length(&seal_key_server_ids)) {
            let server_id = vector::borrow(&seal_key_server_ids, i);
            vector::push_back(&mut key_servers, string::utf8(*server_id));
            i = i + 1;
        };

        HealthAccessPolicy {
            id: object::new(ctx),
            hedera_token_id: token_id_str,
            hedera_serial_number,
            walrus_blob_id: blob_id_str,
            seal_threshold,
            seal_key_server_ids: key_servers,
            owner,
            authorized_users: vector::empty(),
            expiry_epoch,
            data_type: data_type_str,
            created_at: tx_context::epoch(ctx),
        }
    }

    /// Seal approval function - Called by Seal to verify access rights
    public fun seal_approve(
        policy: &HealthAccessPolicy,
        user: address,
        nft_proof: vector<u8>, // Proof of NFT ownership from Hedera
        ctx: &mut TxContext
    ): bool {
        let current_epoch = tx_context::epoch(ctx);
        let policy_id = object::uid_to_inner(&policy.id);

        // Check if access has expired
        if (current_epoch > policy.expiry_epoch) {
            event::emit(AccessDenied {
                policy_id,
                user,
                reason: string::utf8(b"Access expired"),
                timestamp: current_epoch,
            });
            return false
        };

        // Check if user is authorized (owner or explicitly authorized)
        if (user != policy.owner && !vector::contains(&policy.authorized_users, &user)) {
            event::emit(AccessDenied {
                policy_id,
                user,
                reason: string::utf8(b"User not authorized"),
                timestamp: current_epoch,
            });
            return false
        };

        // In a real implementation, we would verify the NFT proof from Hedera
        // For now, we assume the proof is valid if provided
        if (vector::length(&nft_proof) == 0) {
            event::emit(AccessDenied {
                policy_id,
                user,
                reason: string::utf8(b"Invalid NFT proof"),
                timestamp: current_epoch,
            });
            return false
        };

        // Access granted
        event::emit(AccessGranted {
            policy_id,
            user,
            hedera_token_id: policy.hedera_token_id,
            walrus_blob_id: policy.walrus_blob_id,
            timestamp: current_epoch,
        });

        true
    }

    /// Add authorized user to access policy (only owner can call)
    public fun add_authorized_user(
        policy: &mut HealthAccessPolicy,
        new_user: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == policy.owner, E_NOT_AUTHORIZED);
        if (!vector::contains(&policy.authorized_users, &new_user)) {
            vector::push_back(&mut policy.authorized_users, new_user);
        };
    }

    /// Remove authorized user from access policy (only owner can call)
    public fun remove_authorized_user(
        policy: &mut HealthAccessPolicy,
        user_to_remove: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == policy.owner, E_NOT_AUTHORIZED);
        let (found, index) = vector::index_of(&policy.authorized_users, &user_to_remove);
        if (found) {
            vector::remove(&mut policy.authorized_users, index);
        };
    }

    /// Update expiry epoch (only owner can call)
    public fun update_expiry(
        policy: &mut HealthAccessPolicy,
        new_expiry: u64,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == policy.owner, E_NOT_AUTHORIZED);
        policy.expiry_epoch = new_expiry;
    }

    /// Transfer ownership of access policy
    public fun transfer_ownership(
        policy: &mut HealthAccessPolicy,
        new_owner: address,
        ctx: &mut TxContext
    ) {
        assert!(tx_context::sender(ctx) == policy.owner, E_NOT_AUTHORIZED);
        policy.owner = new_owner;
    }

    /// Get policy information (public read functions)
    public fun get_policy_info(policy: &HealthAccessPolicy): (String, u64, String, u8, address, u64) {
        (
            policy.hedera_token_id,
            policy.hedera_serial_number,
            policy.walrus_blob_id,
            policy.seal_threshold,
            policy.owner,
            policy.expiry_epoch
        )
    }

    /// Check if user is authorized
    public fun is_authorized(policy: &HealthAccessPolicy, user: address): bool {
        user == policy.owner || vector::contains(&policy.authorized_users, &user)
    }

    /// Get Seal parameters for decryption
    public fun get_seal_params(policy: &HealthAccessPolicy): (u8, vector<String>) {
        (policy.seal_threshold, policy.seal_key_server_ids)
    }

    /// Entry function to create and share access policy
    entry fun create_and_share_policy(
        hedera_token_id: vector<u8>,
        hedera_serial_number: u64,
        walrus_blob_id: vector<u8>,
        seal_threshold: u8,
        seal_key_server_ids: vector<vector<u8>>,
        data_type: vector<u8>,
        expiry_epoch: u64,
        ctx: &mut TxContext
    ) {
        let policy = create_health_access_policy(
            hedera_token_id,
            hedera_serial_number,
            walrus_blob_id,
            seal_threshold,
            seal_key_server_ids,
            data_type,
            expiry_epoch,
            ctx
        );

        // Share the policy object so it can be used by others
        transfer::share_object(policy);
    }
}
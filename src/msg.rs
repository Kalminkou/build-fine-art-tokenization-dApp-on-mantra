use cosmwasm_std::Binary;
use cosmwasm_std::Coin;
use cw721::Expiration;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub name: String,
    pub symbol: String,
    pub minter: String,

    pub max_mints: u64,
    pub mint_price: Coin,
    pub token_uri: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg<T> {
    TransferNft {
        recipient: String,
        token_id: String,
    },
    SendNft {
        contract: String,
        token_id: String,
        msg: Binary,
    },
    Approve {
        spender: String,
        token_id: String,
        expires: Option<Expiration>,
    },
    Revoke {
        spender: String,
        token_id: String,
    },
    ApproveAll {
        operator: String,
        expires: Option<Expiration>,
    },
    RevokeAll {
        operator: String,
    },
    Burn {
        token_id: String,
    },
    Mint(MintMsg<T>),
    SetMintConfig {
        price: Coin,
        max_mints: u64,
    },
    ToggleMinting {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct MintMsg<T> {
    pub owner: String,
    pub extension: T,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    OwnerOf {
        token_id: String,
        include_expired: Option<bool>,
    },

    Approval {
        token_id: String,
        spender: String,
        include_expired: Option<bool>,
    },

    Approvals {
        token_id: String,
        include_expired: Option<bool>,
    },

    AllOperators {
        owner: String,
        include_expired: Option<bool>,
        start_after: Option<String>,
        limit: Option<u32>,
    },

    NumTokens {},

    ContractInfo {},

    NftInfo {
        token_id: String,
    },

    AllNftInfo {
        token_id: String,
        include_expired: Option<bool>,
    },

    Tokens {
        owner: String,
        start_after: Option<String>,
        limit: Option<u32>,
    },

    AllTokens {
        start_after: Option<String>,
        limit: Option<u32>,
    },
    NftDetails {},
    // add code as instructed in the lesson
}

// Add this new struct
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct NftDetailsResponse {
    pub token_uri: Option<String>,
    pub mint_price: Coin,
    pub max_mints: u64,
}

// Add this new struct
#[derive(Serialize, Deserialize, Clone, PartialEq, JsonSchema, Debug)]
pub struct MinterResponse {
    pub minter: String,
}

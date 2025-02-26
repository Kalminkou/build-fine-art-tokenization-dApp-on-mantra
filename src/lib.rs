mod error;
mod execute;
pub mod helpers;
pub mod msg;
mod query;
pub mod state;

pub use crate::error::ContractError;
pub use crate::msg::{ExecuteMsg, InstantiateMsg, MintMsg, MinterResponse, QueryMsg};
pub use crate::state::Cw721Contract;
use cosmwasm_std::Empty;


pub type Extension = Option<Empty>;

#[cfg(not(feature = "library"))]
pub mod entry {
   use super::*;

   use cosmwasm_std::entry_point;
   use cosmwasm_std::{Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult};

   #[entry_point]
   pub fn instantiate(
       deps: DepsMut,
       env: Env,
       info: MessageInfo,
       msg: InstantiateMsg,
   ) -> StdResult<Response> {
      let tract = Cw721Contract::<Extension, Empty>::default();
      tract.instantiate(deps, env, info, msg)
   }

   #[entry_point]
   pub fn excecute(
         deps: DepsMut,
         env: Env,
         info: MessageInfo,
         msg: ExecuteMsg<Extension>,
      ) -> StdResult<Response, ContractError> {
         let mut tract = Cw721Contract::<Extension, Empty>::default();
         tract.execute(deps, env, info, msg)
      } 

   #[entry_point]
   pub fn query(
      deps: Deps,
      env: Env,
      msg: QueryMsg,
   ) -> StdResult<Binary> {
      let tract = Cw721Contract::<Extension, Empty>::default();
      tract.query(deps, env, msg)
   }
   
}
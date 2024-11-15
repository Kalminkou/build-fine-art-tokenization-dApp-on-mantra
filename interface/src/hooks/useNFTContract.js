import { useCallback, useState } from 'react';
import { useAccount, useCosmWasmClient } from "graz";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { CONTRACT_ADDRESS } from '../chain';
import { GasPrice } from "@cosmjs/stargate";
import { coins } from "@cosmjs/proto-signing";

export function useNftContract() {
  const { data: account } = useAccount();
  const { data: cosmWasmClient } = useCosmWasmClient();
  const [loading, setLoading] = useState(false);

  const getSigningClient = useCallback(async () => {
    if (!window.keplr) throw new Error("Keplr not found");
    await window.keplr.enable("mantra-dukong-1");
    const offlineSigner = window.keplr.getOfflineSigner("mantra-dukong-1");
    const gasPrice = GasPrice.fromString('0.01uom');
    return await SigningCosmWasmClient.connectWithSigner(
      "https://rpc.dukong.mantrachain.io", 
      offlineSigner, 
      { gasPrice }
    );
  }, []);

  const queryConfig = useCallback(async (caller = "default") => {
    if (!cosmWasmClient) return null;
    
    try {
      setLoading(true);
      console.log("Querying NFT details...");
      
      // Query contract details
      const nftdetails = await cosmWasmClient.queryContractSmart(CONTRACT_ADDRESS, { 
        nft_details: {} 
      });
      console.log("NFT details response:", nftdetails);

      // Query total minted
      const totalminted = await cosmWasmClient.queryContractSmart(CONTRACT_ADDRESS, { 
        num_tokens: {} 
      });
      console.log("Total minted response:", totalminted);

      // Default metadata in case token_uri is not set
      let metadata = {
        name: "Mona Lisa",
        description: "Painting of Mona Lisa by Leonardo da Vinci",
        image: "ipfs://QmcDZp9pparq6R5N9xP6v4dvQdy4ueYwhjF4mS2t3WPWtf",
        attributes: [
          {
            "trait_type": "Artist",
            "value": "Leonardo da Vinci"
          }
        ]
      };

      // Try to fetch metadata if token_uri exists
      if (nftdetails.token_uri) {
        try {
          const response = await fetch(nftdetails.token_uri);
          if (response.ok) {
            const fetchedMetadata = await response.json();
            metadata = fetchedMetadata;
          } else {
            console.warn("Using default metadata as token_uri fetch failed");
          }
        } catch (error) {
          console.warn("Using default metadata due to fetch error:", error);
        }
      } else {
        console.log("Using default metadata as token_uri is not set");
      }

      // Process IPFS image URL
      let imageUrl = metadata.image;
      if (imageUrl.startsWith('ipfs://')) {
        imageUrl = `https://gateway.pinata.cloud/ipfs/${imageUrl.slice(7)}`;
      }

      const nft = {
        name: metadata.name,
        description: metadata.description,
        image: imageUrl,
        attributes: metadata.attributes || [],
        mint_price: (Number(nftdetails.mint_price.amount) / 1000000),
        max_mint: Number(nftdetails.max_mints),
        total_minted: Number(totalminted.count)
      };

      console.log("Processed NFT data:", nft);
      return nft;
    } catch (error) {
      console.error("Error querying NFT config:", error);
      throw error;
    } finally {
      if (caller !== "mintNFT") {
        setLoading(false);
      }
    }
  }, [cosmWasmClient]);

  const mintNft = useCallback(async () => {
    if (!account) return;
    
    try {
      setLoading(true);
      console.log("Starting mint process...");

      const signingClient = await getSigningClient();
      const nftDetails = await queryConfig("mintNFT");
      
      if (!nftDetails) {
        throw new Error("Failed to fetch NFT details");
      }

      if (nftDetails.total_minted >= nftDetails.max_mint) {
        throw new Error("Maximum mint limit reached");
      }

      const mintPrice = nftDetails.mint_price;
      console.log("Executing mint with price:", mintPrice);

      const result = await signingClient.execute(
        account.bech32Address,
        CONTRACT_ADDRESS,
        { mint: { owner: account.bech32Address, extension: {} } },
        "auto",
        "",
        coins(mintPrice * 1000000, "uom")
      );

      console.log("Mint successful:", result);
      return result;
    } catch (error) {
      console.error("Mint failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [account, getSigningClient, queryConfig]);

  const instantiateContract = useCallback(async (initMsg) => {
    if (!account) return;
    setLoading(true);
    try {
      const signingClient = await getSigningClient();
      return await signingClient.instantiate(
        account.bech32Address,
        initMsg.code_id,
        initMsg,
        "Instantiate NFT Contract",
        "auto"
      );
    } finally {
      setLoading(false);
    }
  }, [account, getSigningClient]);

  return { 
    instantiateContract, 
    queryConfig, 
    mintNft, 
    loading, 
    setLoading 
  };
}
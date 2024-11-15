import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Flex,
  useColorMode,
  Container,
  Image,
  useToast,
  Center,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { useAccount, useConnect, useDisconnect } from "graz";
import { useNftContract } from './hooks/useNFTContract';
import { checkKeplrInstalled, getKeplrInstallUrl } from './utils/keplrUtils';
import { mantraChainConfig, CONTRACT_ADDRESS } from './chain';

export default function App() {
  const { data: account, isConnected, isConnecting, isReconnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { queryConfig, mintNft, loading, setLoading } = useNftContract();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const showToast = useCallback((message, status = "info") => {
    toast({
      title: status === "error" ? "Error" : "Success",
      description: message,
      status: status,
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  const connectWallet = async () => {
    try {
      if (!checkKeplrInstalled()) {
        const installUrl = getKeplrInstallUrl();
        if (window.confirm("Keplr wallet is not installed. Would you like to install it now?")) {
          window.open(installUrl, "_blank");
        }
        return;
      }

      await window.keplr.experimentalSuggestChain(mantraChainConfig);
      await window.keplr.enable(mantraChainConfig.chainId);
      await connect({
        chainId: mantraChainConfig.chainId,
        chainInfo: mantraChainConfig,
      });

      showToast("Wallet connected successfully!", "success");
    } catch (error) {
      console.error("Failed to connect:", error);
      showToast("Failed to connect. Please make sure Keplr is set up correctly.", "error");
    }
  };

  const fetchNFT = useCallback(async () => {
    if (!isConnected || !CONTRACT_ADDRESS) return;

    try {
      setLoading(true);
      const configData = await queryConfig();
      if (!configData) throw new Error("No NFT data received");
      setConfig(configData);
    } catch (error) {
      console.error("Failed to fetch config:", error);
      showToast("Error fetching config. Please try again later.", "error");
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [isConnected, queryConfig, showToast, setLoading]);

  useEffect(() => {
    if (isConnected) {
      fetchNFT();
    }
  }, [isConnected, fetchNFT]);

  const handleMint = useCallback(async () => {
    try {
      setLoading(true);
      await mintNft();
      await fetchNFT();
      showToast("NFT minted successfully!", "success");
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      showToast("Error minting NFT. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [mintNft, fetchNFT, showToast, setLoading]);

  return (
    <Box minH="100vh" minW="100vw" bg={colorMode === "dark" ? "gray.800" : "gray.100"}>
      <Container maxW="container.xl" py={8}>
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="xl">NFT Gallery</Heading>
          <HStack spacing={4}>
            {account && (
              <Text fontSize="sm">
                {account.bech32Address.slice(0, 8)}...{account.bech32Address.slice(-4)}
              </Text>
            )}
            <Button
              onClick={() => isConnected ? disconnect() : connectWallet()}
              isLoading={isConnecting || isReconnecting}
              loadingText="Connecting"
              colorScheme={isConnected ? "red" : "blue"}
            >
              {isConnected ? "Disconnect" : "Connect Wallet"}
            </Button>
            <Button onClick={toggleColorMode}>
              {colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            </Button>
          </HStack>
        </Flex>

        {isConnected ? (
          loading && isInitialLoad ? (
            <Center h="50vh">
              <VStack spacing={4}>
                <Spinner size="xl" />
                <Text>Loading NFT Data...</Text>
              </VStack>
            </Center>
          ) : config ? (
            <VStack spacing={8} align="stretch">
              <Center>
                <Image
                  src={config.image}
                  alt={config.name}
                  maxH="500px"
                  objectFit="contain"
                  borderRadius="lg"
                  boxShadow="xl"
                  fallbackSrc="/placeholder.png"
                />
              </Center>
              <VStack spacing={4} align="center">
                <Heading size="lg" colorScheme="black">{config.name}</Heading>
                <Text fontSize="md" textAlign="center" maxW="600px" colorScheme="black">
                  {config.description}
                </Text>
                <HStack>
                  <Badge colorScheme="blue">Max Mints: {config.max_mint}</Badge>
                  <Badge colorScheme="green">Mint Price: {config.mint_price} OM</Badge>
                  <Badge colorScheme="red">Total Minted: {config.total_minted}/{config.max_mint}</Badge>
                </HStack>
                <Button
                  onClick={handleMint}
                  isLoading={loading}
                  loadingText="Minting"
                  colorScheme="blue"
                  size="lg"
                  isDisabled={config.total_minted >= config.max_mint}
                >
                  {config.total_minted >= config.max_mint ? "Sold Out" : "Mint NFT"}
                </Button>
              </VStack>
            </VStack>
          ) : (
            <Center h="50vh">
              <VStack spacing={4}>
                <Heading size="md">No NFT Data Available</Heading>
                <Button onClick={fetchNFT} colorScheme="blue">
                  Retry Loading
                </Button>
              </VStack>
            </Center>
          )
        ) : (
          <Center h="50vh">
            <VStack spacing={6}>
              <Heading size="lg">Welcome to NFT Gallery</Heading>
              <Text>Connect your wallet to view and mint NFTs</Text>
              <Button size="lg" onClick={connectWallet} colorScheme="blue">
                Connect Wallet
              </Button>
            </VStack>
          </Center>
        )}
      </Container>
    </Box>
  );
}
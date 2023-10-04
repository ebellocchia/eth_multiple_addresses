# Introduction

Inspired by the way Coinbase Commerce works, this project allows generating multiple ETH addresses to receive payments on a single ETH account, in order to "emulate" the way Bitcoin works where a new address is generated at every payment request. This is useful for payment gateways because, in this way, they can automatically monitor each single address to check if the payment is received.

In order to achieve this, a new smart contract is created for each payment request, which forwards the funds to the ETH user account.
The contract is created in a deterministic way, so the address can be computed in advance and given to the payer without creating the contract. In this way, the contract is created only when the payment is actually received without wasting gas.

Please note that this doesn't preserve the privacy, like in Bitcoin where it's impossibile to know if 2 addresses belong to the same wallet, because it's possible from the smart contract to see the destination address. 

# Setup

Install `yarn` if not installed:

    npm install -g yarn

## Install package

Simply run:

    npm i --include=dev

## Compile

- To compile the contract:

        yarn compile

- To compile by starting from a clean build:

        yarn recompile

## Run tests

- To run tests without coverage:

        yarn test

- To run tests with coverage:

        yarn coverage

## Deploy

To deploy the contract:

    yarn deploy <NETWORK>

## Configuration

Hardhat is configured with the following networks:

|Network name|Description|
|---|---|
|`hardhat`|Hardhat built-in network|
|`locahost`|Localhost network (address: `127.0.0.1:8545`, it can be run with the following command: `yarn run-node`)|
|`bscTestnet`|Zero address|
|`bsc`|BSC mainnet|
|`ethereumSepolia`|ETH testnet (Sepolia)|
|`ethereum`|ETH mainnet|
|`polygonMumbai`|Polygon testnet (Mumbai)|
|`polygon`|Polygon mainnet|

The API keys, RPC nodes and mnemonic shall be configured in the `.env` file.\
You may need to modify the gas limit and price in the Hardhat configuration file for some networks (e.g. Polygon), to successfully execute the transactions (you'll get a gas error).

# How it works

## "Forwarder" smart contract

The `Forwarder` is the contract that receives the payment and forwards it to the user address.\
The user address is fixed in the contract at cannot be changed anymore once initialized.

A new `Forwarder` contract shall be created for each payment request and its address shall be given to the payer to transfer the funds.\
Funds can be either ERC20 tokens or ETH.

## "ForwarderFactory" smart contract

The `ForwarderFactory` allows deploying `Forwarder` contracts.

The deployment of `Forwarder` is very cheap: in fact, at construction, the factory deploys a `Forwarder` contract that is then used to clone the other contracts.\
In other words, the deployed `Forwarder` contracts will only be proxies (in particular [ERC-1167 Minimal Proxy Contract](https://eips.ethereum.org/EIPS/eip-1167)) of the parent `Forwarder` contract.

As explained in the introduction, `Forwarder` contracts are created in a deterministic way by using the `CREATE2` opcode, which allows creating a contract with a deterministic address by specifying a custom salt.\
The salt is provide by you so you take care of handling it. But don't worry, a global up-counter is perfectly fine for the purpose.\
Using the `CREATE2` opcode allows you to compute the address of a `Forwarder` contract without creating it. In this way, you can give the payment address to the payer and create the contract only when the payment is actually received.

The `ForwarderFactory` is the only contract that you have to deploy.

### "ForwarderFactory" functions

    function getForwarderAddress(
        uint256 salt_
    ) public view returns (address)

Get the address of a `Forwarder` contract using the specified `salt_` without creating it.

___

    function cloneForwarder(
        address payable destinationAddress_,
        uint256 salt_
    )

Deploy a new `Forwarder` contract using the specified `salt_`. The deployed `Forwarder` contract will forwards the funds the `destinationAddress_` address.

___

    function flushERC20(
        address payable forwaderAddress_,
        address tokenAddress_
    )

Flush the ERC20 token with address `tokenAddress_` of the `Forwader` contract with address `forwaderAddress_`.\
This means that the `Forwader` contract will transfer the ERC20 token to its `destinationAddress_`.
___

    function flushEth(
        address payable forwaderAddress_
    )

Flush ETH of the `Forwader` contract with address `forwaderAddress_`.\
This means that the `Forwader` contract will transfer the ETH to its `destinationAddress_`.

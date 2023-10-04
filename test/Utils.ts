import { Contract, ContractFactory, Signer } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "./Constants";

//
// Interfaces
//

export interface Accounts {
  owner: Signer;
  signers: Signer[];
}

export interface TestContext {
  accounts: Accounts;
  destination_account: Signer;
  destination_address: string;
  forwarder: Contract;
  forwarder_factory: Contract;
  mock_token: Contract;
}

//
// Exported functions
//

export async function initTestContext() : Promise<TestContext> {
  const accounts: Accounts = await initAccounts();
  const destination_account: Signer = accounts.signers[0];
  const destination_address: string = await destination_account.getAddress();
  const forwarder: Contract = await deployForwarderContract();
  const forwarder_factory: Contract = await deployForwarderFactoryContract();
  const mock_token: Contract = await deployMockERC20TokenContract(constants.ERC20_TOKEN_SUPPLY);

  return {
    accounts,
    destination_account,
    destination_address,
    forwarder,
    forwarder_factory,
    mock_token,
  };
}

export async function getClonedForwarderContract(
  forwarderFactory: Contract,
  salt: number
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("Forwarder");
  return await contract_factory.attach(await forwarderFactory.getForwarderAddress(salt));
}

export async function cloneForwarderContract(
  forwarderFactory: Contract,
  destinationAddress: string,
  salt: number
) : Promise<Contract> {
  await forwarderFactory.cloneForwarder(destinationAddress, salt);
  return await getClonedForwarderContract(forwarderFactory, salt);
}

//
// Not exported functions
//

async function initAccounts() : Promise<Accounts> {
  const all_signers: Signer[] = await hre.ethers.getSigners();

  const owner: Signer = all_signers[0];
  const signers: Signer[] = [];
  for (let i = 1; i < all_signers.length; i++) {
    signers.push(all_signers[i])
  }

  return {
    owner,
    signers,
  };
}

async function deployForwarderContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("Forwarder");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

async function deployForwarderFactoryContract() : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("ForwarderFactory");
  const instance: Contract = await contract_factory.deploy();
  await instance.deployed();

  return instance;
}

async function deployMockERC20TokenContract(
  initialSupply: number
) : Promise<Contract> {
  const contract_factory: ContractFactory = await hre.ethers.getContractFactory("MockERC20Token");
  const instance: Contract = await contract_factory.deploy(initialSupply);
  await instance.deployed();

  return instance;
}

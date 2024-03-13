import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "./Constants";
import * as utils from "./Utils";

//
// Tests for forwarder contract
//
describe("Forwarder", () => {
  let test_ctx: utils.TestContext;

  beforeEach(async () => {
    test_ctx = await utils.initTestContext();
  });

  it("should have null destination address and owner when not initialized", async () => {
    expect(await test_ctx.forwarder.destinationAddress())
      .to.equal(constants.NULL_ADDRESS);
    expect(await test_ctx.forwarder.owner())
      .to.equal(constants.NULL_ADDRESS);
  });

  it("should revert if functions are not called by the owner", async () => {
    const not_owner_account: Signer = test_ctx.accounts.signers[0];
    const not_owner_address: string = await not_owner_account.getAddress();

    // Contract shall be initialized
    await test_ctx.forwarder.init(test_ctx.destination_address);

    await expect(test_ctx.forwarder.connect(not_owner_account).flushERC20(constants.NULL_ADDRESS))
      .to.be.revertedWithCustomError(test_ctx.forwarder, "OwnableUnauthorizedAccount")
      .withArgs(not_owner_address);
    await expect(test_ctx.forwarder.connect(not_owner_account).flushEth())
      .to.be.revertedWithCustomError(test_ctx.forwarder, "OwnableUnauthorizedAccount")
      .withArgs(not_owner_address);
  });

  it("should have the correct destination address and owner when initialized", async () => {
    await test_ctx.forwarder.init(test_ctx.destination_address);

    expect(await test_ctx.forwarder.destinationAddress())
      .to.equal(test_ctx.destination_address);
    expect(await test_ctx.forwarder.owner())
      .to.equal(await test_ctx.accounts.owner.getAddress());
  });

  it("should flush ERC20 token if initialized", async () => {
    const token_amount: number = 10;

    await test_ctx.forwarder.init(test_ctx.destination_address);
    await test_ctx.mock_token.transfer(test_ctx.forwarder.address, token_amount);

    await expect(await test_ctx.forwarder.flushERC20(test_ctx.mock_token.address))
      .not.to.be.reverted;
    expect(await test_ctx.mock_token.balanceOf(test_ctx.destination_address))
      .to.equal(10);
  });

  it("should flush ETH if initialized", async () => {
    const eth_amount: BigNumber = hre.ethers.utils.parseEther("1.0");
    const initial_balance: BigNumber = await test_ctx.destination_account.getBalance();

    await test_ctx.forwarder.init(test_ctx.destination_address);
    await test_ctx.accounts.owner.sendTransaction({
      to: test_ctx.forwarder.address,
      value: eth_amount,
    });

    await expect(await test_ctx.forwarder.flushEth())
      .not.to.be.reverted;
    expect(await test_ctx.destination_account.getBalance())
      .to.equal(initial_balance.add(eth_amount));
  });

  it("should revert if initializing with a null address", async () => {
    await expect(test_ctx.forwarder.init(constants.NULL_ADDRESS))
      .to.be.revertedWithCustomError(test_ctx.forwarder, "NullDestinationAddressError");
  });

  it("should revert if initializing more than once", async () => {
    await test_ctx.forwarder.init(test_ctx.destination_address);
    await expect(test_ctx.forwarder.init(test_ctx.destination_address))
      .to.be.revertedWithCustomError(test_ctx.forwarder, "InvalidInitialization");
  });

  it("should revert if flushing without being initialized", async () => {
    await expect(test_ctx.forwarder.flushERC20(test_ctx.mock_token.address))
      .to.be.revertedWithCustomError(test_ctx.forwarder, "OwnableUnauthorizedAccount");
    await expect(test_ctx.forwarder.flushEth())
      .to.be.revertedWithCustomError(test_ctx.forwarder, "OwnableUnauthorizedAccount");
  });
});

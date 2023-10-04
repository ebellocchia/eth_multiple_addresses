import { expect } from "chai";
import { BigNumber, Contract, Signer } from "ethers";
import hre from "hardhat";
// Project
import * as constants from "./Constants";
import * as utils from "./Utils";

//
// Tests for forwarder factory contract
//
describe("ForwarderContract", () => {
  let test_ctx: utils.TestContext;

  beforeEach(async () => {
    test_ctx = await utils.initTestContext();
  });

  it("should construct correctly", async () => {
    expect(await test_ctx.forwarder_factory.owner())
      .to.equal(await test_ctx.accounts.owner.getAddress());
    expect(await test_ctx.forwarder_factory.parentForwarder())
      .not.to.equal(constants.NULL_ADDRESS);
  });

  it("should revert if functions are not called by the owner", async () => {
    const not_owner_account: Signer = test_ctx.accounts.signers[0];

    await expect(test_ctx.forwarder_factory.connect(not_owner_account).cloneForwarder(constants.NULL_ADDRESS, 0))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(test_ctx.forwarder_factory.connect(not_owner_account).flushEth(constants.NULL_ADDRESS))
      .to.be.revertedWith("Ownable: caller is not the owner");
    await expect(test_ctx.forwarder_factory.connect(not_owner_account).flushERC20(constants.NULL_ADDRESS, constants.NULL_ADDRESS))
      .to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should clone a forwarder contract", async () => {
    const salt: number = 0;

    await expect(await test_ctx.forwarder_factory.cloneForwarder(
      test_ctx.destination_address,
      salt
    ))
      .to.emit(test_ctx.forwarder_factory, "ForwarderCloned")
      .withArgs(
        await test_ctx.forwarder_factory.getForwarderAddress(salt),
        test_ctx.destination_address,
        salt
      );
    const forwarder: Contract = await utils.getClonedForwarderContract(test_ctx.forwarder_factory, salt);

    expect(await forwarder.owner())
      .to.equal(test_ctx.forwarder_factory.address);
    expect(await forwarder.destinationAddress())
      .to.equal(test_ctx.destination_address);
  });

  it("should flush ERC20 token of a created forwarder contract", async () => {
    const token_amount: number = 10;
    const salt: number = 0;

    const forwarder: Contract = await utils.cloneForwarderContract(
      test_ctx.forwarder_factory, 
      test_ctx.destination_address, 
      salt
    );
  
    await test_ctx.mock_token.transfer(forwarder.address, token_amount);
    await test_ctx.forwarder_factory.flushERC20(forwarder.address, test_ctx.mock_token.address);
  
    expect(await test_ctx.mock_token.balanceOf(test_ctx.destination_address))
      .to.equal(10);
  });

  it("should flush ETH of a created forwarder contract", async () => {
    const eth_amount: BigNumber = hre.ethers.utils.parseEther("1.0");
    const initial_balance: BigNumber = await test_ctx.destination_account.getBalance();
    const salt: number = 0;

    const forwarder: Contract = await utils.cloneForwarderContract(
      test_ctx.forwarder_factory, 
      test_ctx.destination_address, 
      salt
    );
  
    await test_ctx.accounts.owner.sendTransaction({
      to: forwarder.address,
      value: eth_amount,
    });
    await test_ctx.forwarder_factory.flushEth(forwarder.address);
  
    expect(await test_ctx.destination_account.getBalance())
      .to.equal(initial_balance.add(eth_amount));
  });

  it("should revert if cloning a forwarder with a null address", async () => {
    await expect(test_ctx.forwarder_factory.cloneForwarder(constants.NULL_ADDRESS, 0))
      .to.be.revertedWithCustomError(test_ctx.forwarder, "NullDestinationAddressError");
  });

  it("should revert if cloning a forwarder with the same salt more than once", async () => {
    const salt: number = 0;

    await test_ctx.forwarder_factory.cloneForwarder(test_ctx.destination_address, salt);
    await expect(test_ctx.forwarder_factory.cloneForwarder(test_ctx.destination_address, salt))
      .to.be.revertedWith("ERC1167: create2 failed");
  });
});

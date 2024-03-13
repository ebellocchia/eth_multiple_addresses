// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

//=============================================================//
//                           IMPORTS                           //
//=============================================================//
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


/**
 * @author Emanuele Bellocchia (ebellocchia@gmail.com)
 * @title  Forwader contract
 * @notice A forwader contract receives ERC20 tokens and ETH and flushes them to a
 *         fixed destination address.
 *         The destination address is specificied at contract initialization and cannot be changed later.
 */
contract Forwarder is
    OwnableUpgradeable
{
    using SafeERC20 for IERC20;

    //=============================================================//
    //                           STORAGE                           //
    //=============================================================//

    /// Destination address
    address payable public destinationAddress;

    //=============================================================//
    //                           ERRORS                            //
    //=============================================================//

    /**
     * Error raised if destination address is null
     */
    error NullDestinationAddressError();

    //=============================================================//
    //                          FUNCTIONS                          //
    //=============================================================//

    /**
     * Initialize contract
     * @param destinationAddress_ Destination address
     */
    function init(
        address payable destinationAddress_
    ) public initializer {
        if (destinationAddress_ == payable(address(0))) {
            revert NullDestinationAddressError();
        }
        destinationAddress = destinationAddress_;
        __Ownable_init(_msgSender());
    }

    /**
     * Flush the ERC20 token `tokenAddress_` to the destination address
     */
    function flushERC20(
        address tokenAddress_
    ) public onlyOwner {
        IERC20 erc20_token = IERC20(tokenAddress_);
        uint256 balance = erc20_token.balanceOf(address(this));
        erc20_token.safeTransfer(destinationAddress, balance);
    }

    /**
     * Flush ETH to the destination address
     */
    function flushEth() public onlyOwner {
        destinationAddress.transfer(address(this).balance);
    }

    /**
     * Enable ETH receiving
     */
    receive() external payable {}

    /**
     * Enable ETH receiving
     */
    fallback() external payable {}
}

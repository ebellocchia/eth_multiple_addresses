// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

//=============================================================//
//                           IMPORTS                           //
//=============================================================//
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "./Forwarder.sol";


/**
 * @author Emanuele Bellocchia (ebellocchia@gmail.com)
 * @title  Factory for forwader contracts
 * @notice The factory allows the creation of new forwarder contracts and the flush of existent ones.
 *         The forwarder contracts are cloned from a parent contract, which is created at factory construction.
 */
contract ForwarderFactory is
    Ownable
{
    //=============================================================//
    //                           STORAGE                           //
    //=============================================================//

    /// Parent forwarder address
    address payable public parentForwarder;

    //=============================================================//
    //                             EVENTS                          //
    //=============================================================//

    /**
     * Event emitted when a forwarder contract is cloned
     * @param forwarder          Forwarder contract address
     * @param destinationAddress Destination address
     * @param salt               Salt
     */
    event ForwarderCloned(
        Forwarder forwarder,
        address destinationAddress,
        uint256 salt
    );

    //=============================================================//
    //                           ERRORS                            //
    //=============================================================//

    /**
     * Error raised if failing when creating the parent forwarder contract
     */
    error ParentForwarderError();

    //=============================================================//
    //                         CONSTRUCTOR                         //
    //=============================================================//

    /**
     * Constructor
     */
    constructor() {
        __createParentForwarder();
    }

    //=============================================================//
    //                          FUNCTIONS                          //
    //=============================================================//

    /**
     * Flush ERC20 token `tokenAddress_` of the forwarder contract at `forwaderAddress_`
     * @param forwaderAddress_ Forwarder address
     * @param tokenAddress_    Token address
     */
    function flushERC20(
        address payable forwaderAddress_,
        address tokenAddress_
    ) public onlyOwner {
        Forwarder(forwaderAddress_).flushERC20(tokenAddress_);
    }

    /**
     * Flush ETH of the forwarder contract at `forwaderAddress_`
     * @param forwaderAddress_ Forwarder address
     */
    function flushEth(
        address payable forwaderAddress_
    ) public onlyOwner {
        Forwarder(forwaderAddress_).flushEth();
    }

    /**
     * Create a new forwader contract by cloning the parent one, using `salt_` as salt and `destinationAddress_` as destination address
     * @param destinationAddress_ Destination address
     * @param salt_               Salt
     * @return Cloned contract address
     */
    function cloneForwarder(
        address payable destinationAddress_,
        uint256 salt_
    ) public onlyOwner returns (Forwarder) {
        Forwarder forwarder = Forwarder(__cloneForwarder(salt_));
        forwarder.init(destinationAddress_);

        emit ForwarderCloned(
            forwarder,
            destinationAddress_,
            salt_
        );

        return forwarder;
    }

    /**
     * Get the address of a forwarder contract using `salt_` as salt. There is no requirement for the forwarder contract to exist.
     * @param salt_ Salt
     * @return Contract address
     */
    function getForwarderAddress(
        uint256 salt_
    ) public view returns (address) {
        return Clones.predictDeterministicAddress(parentForwarder, bytes32(salt_));
    }

    /**
     * Create a new forwader contract by cloning the parent one, using `salt_` as salt
     * @param salt_ Salt
     * @return Contract address
     */
    function __cloneForwarder(
        uint256 salt_
    ) private returns (address payable) {
        return payable(
            Clones.cloneDeterministic(parentForwarder, bytes32(salt_))
        );
    }

    /**
     * Create the parent forwarder
     */
    function __createParentForwarder() private {
        parentForwarder = payable(address(new Forwarder()));
        if (parentForwarder == payable(address(0))) {
            revert ParentForwarderError();
        }
    }
}

// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Dependencies/IERC20.sol";
import "./Interfaces/ICommunityIssuance.sol";
import "./Dependencies/BaseMath.sol";
import "./Dependencies/LiquityMath.sol";
import "./Dependencies/OwnableUpgradeable.sol";
import "./Dependencies/CheckContract.sol";
import "./Dependencies/SafeMath.sol";
import "./Dependencies/Initializable.sol";


contract CommunityIssuance is ICommunityIssuance, OwnableUpgradeable, CheckContract, BaseMath, Initializable {
    using SafeMath for uint;

    // --- Data ---

    string constant public NAME = "CommunityIssuance";

    uint public issuancePerSecond;

    uint public LQTYSupplyCap;

    IERC20 public lqtyToken;

    address public stabilityPoolAddress;

    uint public totalLQTYIssued;
    uint public lastIssuanceTime;

    // --- Events ---

    event LQTYTokenAddressSet(address _lqtyTokenAddress);
    event StabilityPoolAddressSet(address _stabilityPoolAddress);
    event TotalLQTYIssuedUpdated(uint _totalLQTYIssued);
    event IssuanceFactorUpdated(uint oldFactor, uint newFactor);
    event SupplyCapUpdated(uint oldCap, uint newCap);

    // --- Functions ---

    constructor() public {
        _disableInitializers();
    }

    function initialize() initializer external {
        __Ownable_init();
        lastIssuanceTime = block.timestamp;
    }

    function setAddresses(address _lqtyTokenAddress, address _stabilityPoolAddress) external onlyOwner override {
        checkContract(_lqtyTokenAddress);
        checkContract(_stabilityPoolAddress);

        lqtyToken = IERC20(_lqtyTokenAddress);
        stabilityPoolAddress = _stabilityPoolAddress;

        emit LQTYTokenAddressSet(_lqtyTokenAddress);
        emit StabilityPoolAddressSet(_stabilityPoolAddress);
    }

    function setParams(address _lqtyTokenAddress, uint _issuanceFactor)  external onlyOwner {
        checkContract(_lqtyTokenAddress);

        if (_lqtyTokenAddress != address(lqtyToken) || LQTYSupplyCap == 0) {
            lqtyToken = IERC20(_lqtyTokenAddress);
            issuancePerSecond = _issuanceFactor;
            totalLQTYIssued = 0;
            lastIssuanceTime = block.timestamp;
            LQTYSupplyCap = lqtyToken.balanceOf(address(this));

            emit SupplyCapUpdated(0, LQTYSupplyCap);
            emit LQTYTokenAddressSet(_lqtyTokenAddress);
        }
        emit IssuanceFactorUpdated(issuancePerSecond, _issuanceFactor);
    
        issuancePerSecond = _issuanceFactor;
    }

    function issueLQTY() external override returns (uint) {
        _requireCallerIsStabilityPool();

        if (issuancePerSecond == 0) return 0;

        uint issuance = block.timestamp.sub(lastIssuanceTime).mul(issuancePerSecond);
        lastIssuanceTime = block.timestamp;
        totalLQTYIssued = totalLQTYIssued.add(issuance);
        if (totalLQTYIssued > LQTYSupplyCap) {
            uint delta = totalLQTYIssued.sub(LQTYSupplyCap);
            issuance = issuance.sub(delta);
            totalLQTYIssued = LQTYSupplyCap;
        }
        emit TotalLQTYIssuedUpdated(totalLQTYIssued);
        
        return issuance;
    }

    function sendLQTY(address _account, uint _LQTYamount) external override {
        _requireCallerIsStabilityPool();

        lqtyToken.transfer(_account, _LQTYamount);
    }

    // --- 'require' functions ---

    function _requireCallerIsStabilityPool() internal view {
        require(msg.sender == stabilityPoolAddress, "CommunityIssuance: caller is not SP");
    }

    function _getCumulativeIssuanceFraction() internal view returns (uint) {
    }

}

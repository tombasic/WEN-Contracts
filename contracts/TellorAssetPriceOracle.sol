// SPDX-License-Identifier: MIT

pragma solidity 0.6.11;

import "./Dependencies/Ownable.sol";
import "./Dependencies/IBaseOracle.sol";
import "./Dependencies/SafeMath.sol";

interface SimplifiedTellorInterface {
    function getNewValueCountbyRequestId(uint _requestId) external view returns (uint);

    function getTimestampbyRequestIDandIndex(uint _requestID, uint _index) external view returns (uint);

    function retrieveData(uint _requestId, uint _timestamp) external view returns (uint);
}

contract TellorAssetPriceOracle is SimplifiedTellorInterface, Ownable {
    using SafeMath for uint;

    uint constant public TELLOR_DIGITS = 6;
    uint constant public ETHUSD_TELLOR_REQ_ID = 1;

    IBaseOracle public baseOracle;

    mapping (uint => address) public reqIdToAsset;
      
    struct TellorResponse {
        bool ifRetrieve;
        uint value;
        uint timestamp;
        bool success;
    }

    constructor(IBaseOracle _baseOracle, address _wrappedNativeToken) public {
        baseOracle = _baseOracle;
        reqIdToAsset[ETHUSD_TELLOR_REQ_ID] = _wrappedNativeToken;
    }

    function getNewValueCountbyRequestId(uint _requestId) external view override returns (uint) {
        return _requestId;
    }

    function getTimestampbyRequestIDandIndex(uint _requestId, uint) external view override returns (uint) {
        address asset = reqIdToAsset[_requestId];
        (, uint updateAt, ) = baseOracle.getPriceInfo(asset);
        return updateAt;
    }

    function retrieveData(uint _requestId, uint) external view override returns (uint) {
        address asset = reqIdToAsset[_requestId];
        (uint price, , ) = baseOracle.getPriceInfo(asset);
        uint answer = price.div(10 ** (18 - TELLOR_DIGITS));
        return answer;
    }

    function setReqId(uint _requestId, address _asset) external onlyOwner {
        require(_requestId > 1, "Invalid req id");
        require(_asset != address(0x0), "Invalid asset address");

        (uint price, , ) = baseOracle.getPriceInfo(_asset);
        require(price > 0, "Invalid asset");
        
        reqIdToAsset[_requestId] = _asset;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./Token.sol";

contract dBank {
    //assign Token contract to variable
    Token private token;

    //add mappings
    mapping(address => uint256) public etherBalanceOf;
    mapping(address => uint256) public depositStart;
    mapping(address => bool) public isDeposited;

    //add events
    event Deposit(
        address indexed _from,
        uint256 _etherAmount,
        uint256 _timeStart
    );

    event Withdraw(
        address indexed _from,
        uint256 _etherAmount,
        uint256 _interestEared,
        uint256 _withdrawTime
    );

    event CheckInterest(
        address indexed _from,
        uint256 _etherAmount,
        uint256 _interestEared
    );

    event CheckTimePassed(address indexed _from, uint256 _timePassed);

    //pass as constructor argument deployed Token contract
    constructor(Token _token) public {
        //assign token deployed contract to variable
        token = _token;
    }

    function deposit() public payable {
        //check if msg.sender didn't already deposited funds
        require(!isDeposited[msg.sender], "Error: Deposit already active");

        //check if msg.value is >= than 0.01 ETH
        require(
            msg.value >= 0.01 ether,
            "Error: Deposit must be greater than 0.01 ETH"
        );

        //increase msg.sender ether deposit balance
        etherBalanceOf[msg.sender] += msg.value;

        //start msg.sender hodling time
        depositStart[msg.sender] += block.timestamp;

        //set msg.sender deposit status to true
        isDeposited[msg.sender] = true;

        //emit Deposit event
        emit Deposit(msg.sender, msg.value, block.timestamp);
    }

    function withdraw() public {
        //check if msg.sender deposit status is true
        require(
            isDeposited[msg.sender],
            "Error: You have not yet deposited ETH"
        );
        //assign msg.sender ether deposit balance to variable for event
        uint256 userBalance = etherBalanceOf[msg.sender];

        //check user's hodl time
        uint256 hodlTime = block.timestamp - depositStart[msg.sender];

        //calc accrued interest assuming 10% interest in wei
        uint256 interestPerSecond =
            31668017 * (etherBalanceOf[msg.sender] / 1e16);
        uint256 interest = interestPerSecond * hodlTime;

        //send eth to user
        msg.sender.transfer(userBalance);

        //send interest in tokens to user
        token.mint(msg.sender, interest);

        //reset depositer data
        etherBalanceOf[msg.sender] = 0;
        depositStart[msg.sender] = 0;
        isDeposited[msg.sender] = false;

        //emit event, convert interestEarned from wei to DBC assuming DBC has same wei conversion rates as ETH
        emit Withdraw(
            msg.sender,
            userBalance,
            interest / 1e18,
            block.timestamp
        );
    }

    function checkInterest() public {
        require(isDeposited[msg.sender]);
        //assign msg.sender ether deposit balance to variable for event
        uint256 userBalance = etherBalanceOf[msg.sender];

        //check user's hodl time
        uint256 hodlTime = block.timestamp - depositStart[msg.sender];

        //calc accrued interest assuming 10% interest in wei
        uint256 interestPerSecond = 31668017 * (userBalance / 1e16);
        uint256 interest = interestPerSecond * hodlTime;

        emit CheckInterest(msg.sender, userBalance, interest);
    }

    function checkTimePassed()
        public
        view
        returns (uint256 _depositStart, uint256 _amountDeposited)
    {
        require(
            isDeposited[msg.sender],
            "Error: You have not deposited ETH yet"
        );
        return (depositStart[msg.sender], etherBalanceOf[msg.sender]);
    }

    function borrow() public payable {
        //check if collateral is >= than 0.01 ETH
        //check if user doesn't have active loan
        //add msg.value to ether collateral
        //calc tokens amount to mint, 50% of msg.value
        //mint&send tokens to user
        //activate borrower's loan status
        //emit event
    }

    function payOff() public {
        //check if loan is active
        //transfer tokens from user back to the contract
        //calc fee
        //send user's collateral minus fee
        //reset borrower's data
        //emit event
    }
}

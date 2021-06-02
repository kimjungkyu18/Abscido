import { Tabs, Tab } from 'react-bootstrap'
import dBank from '../abis/dBank.json'
import React, { Component } from 'react';
import Token from '../abis/Token.json'
import dbank from '../dbank.png';
import Web3 from 'web3';
import './App.css';

//h0m3w0rk - add new tab to check accrued interest

class App extends Component {

  async componentWillMount() {
    await this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    //check if MetaMask exists
    if (typeof window.ethereum !== 'undefined'){
      //assign to values to variables: web3, netId, accounts
      const web3 = new Web3(window.ethereum)
      const netId = await web3.eth.net.getId()
      console.log(netId)

      // Ask client to connect MetaMask to app, allowing us to access accounts
      await window.ethereum.enable() //(implement eth_requestAccounts at a later point)
      const accounts = await web3.eth.getAccounts()
      console.log(accounts)

      //check if account is detected, then load balance&setStates, elsepush alert 
      if (typeof accounts[0] !== 'undefined') {
        const balance = await web3.eth.getBalance(accounts[0])
        console.log(balance)
        this.setState({ account: accounts[0], balance: balance, web3: web3})
      } else {
        window.alert('Please connect to site using MetaMask')
      }

      // Create contract objects to interact with contracts on the blockchain
      try {
        const token = new web3.eth.Contract(Token.abi, Token.networks[netId].address)
        const dbank = new web3.eth.Contract(dBank.abi, dBank.networks[netId].address)
        const dBankAddress = dBank.networks[netId].address
        this.setState({ token: token, dbank: dbank})
        console.log(token.options.address)
      } catch(e) {
        console.log('Error', e)
        window.alert('Contracts not deployed to the current network')
      }


    //if MetaMask not exists push alert
    } else {
      window.alert('Please install MetaMask')
    }
  }

  async deposit(amount) {
    if (this.state.dbank !== 'undefined') {
      try {
        await this.state.dbank.methods.deposit().send({value: amount.toString(), from: this.state.account})
      } catch (e) {
        console.log('Error, deposit: ', e)
      }
    }
  }

  async withdraw(e) {
    //prevent button from default click
    //check if this.state.dbank is ok
    if (this.state.dbank !== 'undefined') {
      try {
        await this.state.dbank.methods.withdraw().send({from: this.state.account})
      } catch (e) {
        console.log('Error, withdraw: ', e)
      }
    }
  }

  async calculateInterest() {
    const receipt = await this.state.dbank.methods.checkTimePassed().call({from: this.state.account})
    console.log(receipt)
    const hodlTime = Date.now() / 1000 - receipt[0]
    const userBalance = receipt[1]
    const interestPerSecond = 31668017 * (userBalance / 1e16);
    const interest = interestPerSecond * hodlTime
    this.setState({interest: interest})
  }

  async checkInterest() {
    const receipt = await this.state.dbank.methods.checkInterest().send({from: this.state.account})
    let interest = receipt.events.CheckInterest.returnValues[2]
    this.setState({interest: interest})
    console.log('interest:', this.state.interest)
  }

  constructor(props) {
    super(props)
    this.state = {
      web3: 'undefined',
      account: '',
      token: null,
      dbank: null,
      balance: 0,
      interest: 0, // In ETH
      dBankAddress: null
    }
  }

  render() {
    return (
      <div className='text-monospace'>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="DBC"
            target="_blank"
            rel="noopener noreferrer"
          >
        <img src={dbank} className="App-logo" alt="logo" height="32"/>
          <b>Abscido</b>
        </a>
        </nav>
        <div className="container-fluid mt-5 text-center">
        <br></br>
          <h1>Welcome to Abscido</h1>
          <h2>Account: {this.state.account}</h2>
          <br></br>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
              <Tabs defaultActiveKey="check-interest" id="uncontrolled-tab-example">
                <Tab eventKey="deposit" title="Deposit">
                  <div>
                    How much do you want to deposit?
                    <br></br>
                    Minimum is 0.01 ETH.
                    <br></br>
                    Only 1 deposit is allowed at a time
                    <form onSubmit={(e) => {
                      e.preventDefault() // Prevents refreshing of page after click
                      let amount = this.depositAmount.value // Grab deposit amount through ref
                      this.setState({ deposit: amount}) // Set deposit state to amount in ETH
                      amount = amount * 10 ** 18 // Convert from ETH to wei
                      this.deposit(amount)
                      }}>
                    <div className='form-group mr-sm-2'>
                      <br></br>
                      <input
                        id='depositAmount'
                        step='0.01'
                        type='number'
                        ref={(input) => { this.depositAmount = input }}
                        className='form-control form-control-md'
                        placeholder='Amount...'
                        required
                        min='0.01'
                        />
                    </div>
                    <button type='submit' className='btn btn-primary'>DEPOSIT</button>
                    </form>
                  </div>
                </Tab>
                <Tab eventKey="withdraw" title="Withdraw">
                  <div>Do you wish to withdraw?</div>
                  <br></br>
                  <button type='submit' className='btn btn-primary' onClick={(e) => {
                    e.preventDefault()
                    this.withdraw()
                  }}>WITHDRAW</button>
                </Tab>
                <Tab eventKey="check-interest" title="Check Interest">
                <div>Check interest here!</div>
                  <br></br>
                  <button type='submit' className='btn btn-primary' onClick={(e) => {
                    e.preventDefault()
                    this.calculateInterest()
                  }}>CHECK INTEREST</button>
                  <div>Interest: {this.state.interest}</div>
                </Tab>
              </Tabs>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
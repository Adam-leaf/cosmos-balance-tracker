require("dotenv").config();
const axios = require("axios");
const token_names = require("./tokenNames");

// Function to fetch data from API
async function fetchAssetInfo(address, chain) {
  const headers = {
    Authorization: process.env.BEARER_TOKEN_MINTSCAN,
  };
  const params = {
    network: chain,
    address: address,
  };

  // API Used - The mintscan API used, provides [delegated balance, current balance, and staking rewards]
  const mintscanAPI = `https://apis.mintscan.io/v1/${chain}/accounts/${address}`;

  try {
    const response = await axios.get(mintscanAPI, {
      headers: headers,
      params: params,
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      // If error is 400, return a predefined structure with all values as 0 and token name as NONE
      return {
        bankBalance: [],
        delegations: [],
        stakingRewards: { total: [{ denom: "none", amount: "0" }] }
      };
    } else {
      // For other errors, log and re-throw the error
      console.error("Error fetching balance data:", error);
      throw error;
    }
  }
}

async function processAssetInfo(address, chain) {
  try {
    // Fetch asset information
    const assetInfo = await fetchAssetInfo(address, chain);

    // Extract desired properties
    const { bankBalance, delegations, stakingRewards } = assetInfo;

    // Initialize an object to store token balances
    const tokenBalances = {};

    // Process bank balance
    bankBalance.forEach((balance) => {
      const { denom, amount } = balance;
      const tokenName = token_names[denom]?.name || denom;
      const decimal = token_names[denom]?.decimal || 0;
      tokenBalances[tokenName] = tokenBalances[tokenName] || {};
      tokenBalances[tokenName].balance = (
        amount / Math.pow(10, decimal)
      ).toFixed(6);
    });

    // Extract balance from each delegation and create an array of key-value pairs
    const delegatedValue = delegations.map(({ balance }) => ({
      denom: balance.denom,
      delegated: balance.amount,
    }));

    // Process delegations
    delegatedValue.forEach((delegation) => {
      const { denom, delegated } = delegation;
      const tokenName = token_names[denom]?.name || denom;
      const decimal = token_names[denom]?.decimal || 0;
      tokenBalances[tokenName] = tokenBalances[tokenName] || {};
      tokenBalances[tokenName].delegated = (
        delegated / Math.pow(10, decimal)
      ).toFixed(6);
    });

    const rewards = stakingRewards.total.map(({ denom, amount }) => ({
      denom,
      rewards: amount,
    }));

    // Process staking rewards
    rewards.forEach((reward) => {
      const { denom, rewards } = reward;
      const tokenName = token_names[denom]?.name || denom;
      const decimal = token_names[denom]?.decimal || 0;
      tokenBalances[tokenName] = tokenBalances[tokenName] || {};
      tokenBalances[tokenName].rewards = (
        rewards / Math.pow(10, decimal)
      ).toFixed(6);
    });

    // Calculate total for each token
    Object.keys(tokenBalances).forEach((tokenName) => {
      const {
        balance = 0,
        rewards = 0,
        delegated = 0,
      } = tokenBalances[tokenName];
      const decimal = token_names[tokenName]?.decimal || 0;
      const total =
        (parseFloat(balance) + parseFloat(rewards) + parseFloat(delegated)) /
        Math.pow(10, decimal);
      tokenBalances[tokenName].total = total.toFixed(6);
    });

    // Output formatted token balances
    //console.log(tokenBalances);
    return tokenBalances;
  } catch (error) {
    // Handle errors
    console.error("Error fetching asset information:", error.stack);
  }
}

module.exports = {
    processAssetInfo
};

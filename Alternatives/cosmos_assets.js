// Description: This file contains the code to fetch the balance and delegation rewards of a given address on the Osmosis blockchain.
const axios = require("axios");
const token_names = require("../tokenNames");

// Address to query
// TODO: Make it take address from a CSV
const address = "";

// RPC endpoints
cosmos_rpc = "";

// API Used
all_balance_api = `cosmos/bank/v1beta1/balances/${address}`;
delegation_rewards_api = `cosmos/distribution/v1beta1/delegators/${address}/rewards`;

// Function to fetch balance data
async function fetchBalanceData() {
  try {
    const response = await axios.get(`${cosmos_rpc}${all_balance_api}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching balance data:", error);
    throw error;
  }
}

// Function to fetch delegation rewards
async function fetchDelegationRewards() {
  try {
    const response = await axios.get(`${cosmos_rpc}${delegation_rewards_api}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching delegation rewards:", error);
    throw error;
  }
}

async function combineBalancesAndRewards() {
  try {
    const balanceData = await fetchBalanceData();
    const delegationRewards = await fetchDelegationRewards();

    const combined = {};

    balanceData.balances.forEach((balance) => {
      const denom = balance.denom;
      const tokenInfo = token_names[denom] || { name: denom, decimal: 6 }; // Get token info or default to IBC with 6 decimal places
      const amount = (
        parseFloat(balance.amount) / Math.pow(10, tokenInfo.decimal)
      ).toFixed(6); // Adjust amount based on decimal value and round off to 6 decimal places
      combined[tokenInfo.name] = {
        balance: parseFloat(amount),
        reward: 0,
        total: parseFloat(amount),
      };
    });

    delegationRewards.total.forEach((reward) => {
      const denom = reward.denom;
      const tokenInfo = token_names[denom] || { name: denom, decimal: 6 }; // Get token info or default to IBC with 6 decimal places
      const amount = (
        parseFloat(reward.amount) / Math.pow(10, tokenInfo.decimal)
      ).toFixed(6); // Adjust amount based on decimal value and round off to 6 decimal places
      const parsedAmount = parseFloat(amount);
      if (combined[tokenInfo.name]) {
        combined[tokenInfo.name].reward = parsedAmount;
        combined[tokenInfo.name].total += parsedAmount;
      } else {
        combined[tokenInfo.name] = {
          balance: 0,
          reward: parsedAmount,
          total: parsedAmount,
        };
      }
    });

    // Round off all totals to 6 decimal places
    Object.keys(combined).forEach((token) => {
      combined[token].total = parseFloat(combined[token].total.toFixed(6));
    });

    console.log(combined);
  } catch (error) {
    console.error("Error combining balances and rewards:", error);
  }
}

combineBalancesAndRewards();

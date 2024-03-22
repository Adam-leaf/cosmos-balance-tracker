const fs = require("fs");
const path = require("path");

// Function to process the balances.json file
async function processBalancesData() {
 const balancesFilePath = path.join(__dirname, "balances.json");
 let balancesData;

 try {
    // Read the balances.json file
    const data = fs.readFileSync(balancesFilePath, "utf8");
    balancesData = JSON.parse(data);
 } catch (error) {
    console.error("Error reading balances.json:", error);
    return;
 }

 let stakedWalletsCount = 0;
 const assetsSumByChain = {};
 const emptyWallets = []; // Array to store empty wallets
 const nonStakedAddresses = {}; // Object to store non-staked addresses by chain

 // Define thresholds for each chain
 const chainThresholds = {
    celestia: { TIA: 2 },
    osmosis: { OSMO: 5 },
    cosmos: { ATOM: 2 }
 };

 // Iterate over the data to count staked wallets, sum assets by chain, and collect non-staked addresses
 balancesData.forEach(wallet => {
    let isStaked = true; // Assume staked by default
    const chain = wallet.chain;

    // Check if the wallet is non-staked based on the new rule
    if (chainThresholds[chain]) {
      Object.entries(wallet.balance).forEach(([assetName, assetData]) => {
        if (chainThresholds[chain][assetName] && parseFloat(assetData.balance) > chainThresholds[chain][assetName]) {
          isStaked = false;
          if (!nonStakedAddresses[chain]) {
            nonStakedAddresses[chain] = [];
          }
          nonStakedAddresses[chain].push(wallet.address);
        }
      });
    }

    if (isStaked) {
      stakedWalletsCount++;
    }

    if (!assetsSumByChain[chain]) {
      assetsSumByChain[chain] = {};
    }

    // Iterate over each asset in the wallet, excluding "No_Balance"
    Object.entries(wallet.balance).forEach(([assetName, assetData]) => {
      if (assetName !== "No_Balance" && assetData.total) {
        if (!assetsSumByChain[chain][assetName]) {
          assetsSumByChain[chain][assetName] = 0;
        }
        assetsSumByChain[chain][assetName] += parseFloat(assetData.total);
      }
    });

    // Check if the wallet has No_Balance
    if (Object.keys(wallet.balance).includes("No_Balance")) {
      emptyWallets.push({ chain: wallet.chain, address: wallet.address });
    }
 });

 // Add the additional row to the data
 balancesData.push({
    "staked_wallets": stakedWalletsCount,
    "assets_sum_by_chain": assetsSumByChain,
    "non_staked_addresses": nonStakedAddresses
 });

 // Write the updated data back to the balances.json file
 try {
    fs.writeFileSync(balancesFilePath, JSON.stringify(balancesData, null, 2));
    console.log("Assets Sum by Chain Calculated and written to balances.json successfully.");
 } catch (error) {
    console.error("Error writing to balances.json:", error);
 }

 // Write empty wallets to a new JSON file
 try {
    const emptyWalletsFilePath = path.join(__dirname, "emptyWallets.json");
    const emptyWalletsData = {
      "empty_wallets": emptyWallets,
      "total_empty_wallets": emptyWallets.length
    };
    fs.writeFileSync(emptyWalletsFilePath, JSON.stringify(emptyWalletsData, null, 2));
    console.log("Empty wallets data written to emptyWallets.json successfully.");
 } catch (error) {
    console.error("Error writing to emptyWallets.json:", error);
 }

 // Write assetsSumByChain to a new JSON file named simple_report.json
 try {
    const simpleReportFilePath = path.join(__dirname, "simple_report.json");
    fs.writeFileSync(simpleReportFilePath, JSON.stringify(assetsSumByChain, null, 2));
    console.log("Assets Sum by Chain data written to simple_report.json successfully.");
 } catch (error) {
    console.error("Error writing to simple_report.json:", error);
 }
}

// Call the function to process the balances.json file
processBalancesData();
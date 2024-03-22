const fs = require("fs");
const csv = require("csv-parser");
const { processAssetInfo } = require("./analyse_assets");
const Bottleneck = require("bottleneck");
const { exec } = require("child_process"); // Used to run node commands from code

const readline = require("readline");

// Create a rate limiter to control concurrency
const limiter = new Bottleneck({
  maxConcurrent: 1, // Adjust based on your API's rate limits
});

// Interface for reading input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("");
console.log(
  "-------------------------------------------------------------------------------------------------------------------------------------------------"
);
console.log("Welcome to the Cosmos Balance Tracker");
console.log(
  "- Please ensure that the addresses are in the wallets.csv file in the format 'chain,address'. No headers are required."
);
console.log(
  "- If an error occurs for the 1st address. Leave the first row empty and start adding the addresses from the 2nd row."
);
console.log(
  "- Please make sure that you have the required mintscan API keys in the .env file (BEARER_TOKEN_MINTSCAN)"
);
console.log(
  "- 3 JSON files will be generated once the program is completed, refer below to understand the purpose of each file"
);
console.log("");
console.log("Guidelines:");
console.log(
  "wallets.csv - Stores the wallet addresses that need to be tracked"
);
console.log(
  "balances.json - Stores the resulting tracked assets (Contains: Assets from each wallet, Assets sum by chain, Non-staked addresses "
);
console.log("emptyWallets.json - Stores the addresses of empty wallets");
console.log("simple_report.json - Stores only the total asset balance on each chain");
console.log(
  "-------------------------------------------------------------------------------------------------------------------------------------------------"
);
console.log("");
console.log("Features:");
console.log("1. Input 1 to start parsing and generate the balances.json ");
console.log("2. Any other input will exit the program");
console.log("");

rl.question("Enter your choice:", (input) => {
  if (input === "1") {
    // Call the async function to parse CSV and process each row
    parseCSVAndProcess();
  } else {
    console.log("Invalid Input. Exiting...");
    rl.close();
    process.exit(1);
  }

  rl.close();
});

async function parseCSVAndProcess() {
  const balances = []; // Array to store balances data
  let processedCount = 0; // Initialize the counter
  const csvSource = "wallets.csv"; // CSV file to read

  // Function to count the lines in the CSV file
  async function countLinesInCSV() {
    return new Promise((resolve, reject) => {
      let lineCount = 0;
      fs.createReadStream(csvSource)
        .pipe(csv())
        .on("data", () => lineCount++)
        .on("end", () => resolve(lineCount))
        .on("error", (error) => reject(error));
    });
  }

  async function startProcessing(totalLines) {
    // Read the CSV file
    const readStream = fs
      .createReadStream(csvSource)
      .pipe(csv(["chain", "address"]));

    const queue = []; // Queue to manage the processing order
    let activePromises = 0; // Counter for active promises

    readStream.on("data", (row) => {
      const chain = row["chain"];
      const address = row["address"];
      if (address !== undefined) {
        // Add the promise to the queue
        queue.push(
          limiter
            .schedule(() => processAssetInfoWithRetry(address, chain, 3))
            .then((balanceData) => {
              // Push balance data to the balances array
              balances.push({ address, chain, balance: balanceData });
              // Log the progress
              processedCount++;
              console.log(`${processedCount}/${totalLines} wallets processed`);
            })
            .catch((error) => {
              console.error(`Failed to process ${address} on ${chain}:`, error);
            })
            .finally(() => {
              activePromises--; // Decrement the counter when the promise is resolved or rejected
              processNext(); // Process the next item in the queue
            })
        );

        // Process the next item in the queue if there's room
        processNext();
      }
    });

    readStream.on("end", async () => {
      console.log("CSV file read successfully.");

      // Wait for all active promises to resolve
      await Promise.all(queue);

      // Write balances data to a JSON file
      fs.writeFile(
        "balances.json",
        JSON.stringify(balances, null, 2),
        (err) => {
          if (err) {
            console.error("Error writing JSON file:", err);
          } else {
            console.log("Balances data written to balances.json successfully.");
            // Execute process_balance.js after balances.json has been created
            exec("node process_balance.js", (error, stdout, stderr) => {
              if (error) {
                console.error(`Error executing process_balance.js: ${error}`);
                return;
              }
              if (stderr) {
                console.error(
                  `Error output from process_balance.js: ${stderr}`
                );
                return;
              }
              console.log(`Output from process_balance.js: ${stdout}`);
            });
          }
        }
      );
    });

    readStream.on("error", (error) => {
      console.error("Error parsing CSV:", error);
    });

    // Function to process the next item in the queue
    function processNext() {
      if (activePromises < limiter.maxConcurrent && queue.length > 0) {
        activePromises++;
        const nextPromise = queue.shift();
        nextPromise();
      }
    }
  }

  // Count the lines in the CSV file and start processing
  countLinesInCSV()
    .then((totalLines) => {
      console.log(`Processing ${totalLines} wallets...`);
      startProcessing(totalLines);
    })
    .catch((error) => {
      console.error("Error counting lines in CSV:", error);
    });
}

// Function to create a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to process asset info with retry mechanism
async function processAssetInfoWithRetry(address, chain, retries) {
  try {
    return await processAssetInfo(address, chain);
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying ${address} on ${chain}...`);
      await delay(10000); // Wait for 10 seconds before retrying
      return await processAssetInfoWithRetry(address, chain, retries - 1);
    } else {
      throw `Retries left: ${retries}`; // If all retries failed, throw the error
    }
  }
}

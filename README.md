
**A: PREPARING THE CSV FILE**
1. Add your "wallets.csv" file into the root. (Follow the format in appendix 1)
2. To speed up the process you can use excel to copy paste addresses and their respective chains
3. However, if youre editing using excel, remember to open the csv file in your editor and leave the first row empty (To avoid parsing errors)


**B: PREPARING THE ENV FILE (MINTSCAN API)**
1. For safety purposes, the MINTSCAN API was not provided. Please create a .env file and use the variable BEARER_TOKEN_MINTSCAN to store your mintscan api
2. The api can be obtained through https://api.mintscan.io/.
3. Make sure to email support to activate your API key (Working Days only)


**C: RUNNING THE PROGRAM**
1. The program can be run using the "node index.js" command in the CLI
2. Enter 1 to start and wait for the program to finish 
3. It takes roughly 4 minutes for 500 Addresses
4. 3 JSON files will be generated. (balances.json,emptyWallets.json and simple_report.json)

**D: FILE GUIDELINES**
1. wallets.csv - Stores the wallet addresses that need to be tracked
2. balances.json - Stores the resulting tracked assets (Contains: Assets from each wallet, Assets sum by chain, Non-staked addresses
3. emptyWallets.json - Stores the addresses of empty wallets
4. simple_report.json - Stores only the total asset balance on each chain
5. tokenNames.js - Stores the contract address of the token and their respective symbols

**E: RATE LIMITS**
1. There are 50,000 credits provided by MINTSCAN API, which refreshes daily
2. Each wallet requires 5 Credits to Query 
3. For example if there are 800 Wallets to query the credits consumed would be 800*5 = 4000 Credits

**Appendices**
1. *Random wallet for Example:

![image](https://github.com/Adam-leaf/cosmos-balance-tracker/assets/164289963/d02be978-f2f4-45cc-a008-bf5306bdc272)

2. Mintscan API .env Example:

![image](https://github.com/Adam-leaf/cosmos-balance-tracker/assets/164289963/773a8142-9714-4dd3-ae2c-cf8c00164ed9)

3. Example of program running:

![image](https://github.com/Adam-leaf/cosmos-balance-tracker/assets/164289963/7f739afa-6994-49d0-a6fc-075f2b1f4075)






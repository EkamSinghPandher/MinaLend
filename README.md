<div align="center">
    <img alt="MINALEND" width="170" height="170" src="apps/web/public/logo.png"/>
</div>

# ZkCredit - The First ZeroKnowlege Personal Loans DeFi App

This project is developed based on MINA's [Protokit](https://github.com/proto-kit) [starter-kit](https://github.com/proto-kit/starter-kit). ([original README](https://github.com/proto-kit/starter-kit/blob/develop/README.md)).

## Features


## Quick start

**Prerequisites:**

- Node.js `v18` (we recommend using NVM)
- pnpm `v9.8`
- nvm

To install NVM in MacOS, follow this [guide](https://sukiphan.medium.com/how-to-install-nvm-node-version-manager-on-macos-d9fe432cc7db).

To install NVM in Ubuntu, follow this [guide](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating).

## Setup

```zsh
git clone https://github.com/EkamSinghPandher/MinaLend
cd MinaLend
nvm install v18
nvm use
pnpm install
```


## Running

```zsh
pnpm env:inmemory dev
```

Then open [http://localhost:3000/](http://localhost:3000/) in your browser.

## Testing

```zsh
pnpm run test --filter=chain -- --watchAll
```

## Future Work
- Integrate a Mina <-> Ethereum bridge such as the LambdaClass [mina_bridge](https://github.com/lambdaclass/mina_bridge). Note that mina_bridge is work-in-progress. We plan to integrate it when the project is in a relatively stable form.

- Integrate [SingPass](https://api.singpass.gov.sg/) to get proof of assets in Singapore.
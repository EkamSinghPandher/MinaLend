import { Balance, TokenId, VanillaRuntimeModules } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { MinaLendModule } from "./modules/minalend";

export const modules = VanillaRuntimeModules.with({
  Balances,
  MinaLendModule
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(100_000_000),
  },
  MinaLendModule: {
    tokenId: TokenId.from(0),
  }
};

export default {
  modules,
  config,
};

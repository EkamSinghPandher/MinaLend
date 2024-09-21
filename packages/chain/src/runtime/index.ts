import { Balance, VanillaRuntimeModules, TokenId } from "@proto-kit/library";
import { ModulesConfig } from "@proto-kit/common";

import { Balances } from "./modules/balances";
import { MinaLendModule } from "./modules/minalend";

export const modules = VanillaRuntimeModules.with({
  Balances,
  MinaLendModule
});

export const config: ModulesConfig<typeof modules> = {
  Balances: {
    totalSupply: Balance.from(10_000),
  },
  MinaLendModule: {
    tokenId: TokenId.from(0),
  }, // Add this line

};

export default {
  modules,
  config,
};

import { runtimeModule, state, runtimeMethod } from "@proto-kit/module";
import { State, StateMap, assert } from "@proto-kit/protocol";
import { Balance, BalancesKey, Balances as BaseBalances, errors, TokenId } from "@proto-kit/library";
import { Provable, PublicKey } from "o1js";

interface BalancesConfig {
  totalSupply: Balance;
}

@runtimeModule()
export class Balances extends BaseBalances<BalancesConfig> {
  @state() public circulatingSupply = State.from<Balance>(Balance);
  @state() public balances = StateMap.from<BalancesKey, Balance>(
    BalancesKey,
    Balance
  );

  public async getBalance(
    tokenId: TokenId,
    address: PublicKey
  ): Promise<Balance> {
    const key = new BalancesKey({ tokenId, address });
    const balanceOption = await this.balances.get(key);
    return Balance.Unsafe.fromField(balanceOption.value.value);
  }

  public async setBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ) {
    const key = new BalancesKey({ tokenId, address });
    await this.balances.set(key, amount);
  }

  public async transfer(
    tokenId: TokenId,
    from: PublicKey,
    to: PublicKey,
    amount: Balance
  ) {
    const fromBalance = await this.getBalance(tokenId, from);

    const fromBalanceIsSufficient = fromBalance.greaterThanOrEqual(amount);

    assert(fromBalanceIsSufficient, errors.fromBalanceInsufficient());

    const newFromBalance = fromBalance.sub(amount);
    await this.setBalance(tokenId, from, newFromBalance);

    const toBalance = await this.getBalance(tokenId, to);
    const newToBalance = toBalance.add(amount);

    await this.setBalance(tokenId, to, newToBalance);
  }

  public async mint(tokenId: TokenId, address: PublicKey, amount: Balance) {
    const balance = await this.getBalance(tokenId, address);
    const newBalance = balance.add(amount);
    await this.setBalance(tokenId, address, newBalance);
  }

  public async burn(tokenId: TokenId, address: PublicKey, amount: Balance) {
    const balance = await this.getBalance(tokenId, address);
    Provable.log("Balance", balance, amount);
    const newBalance = balance.sub(amount);
    await this.setBalance(tokenId, address, newBalance);
  }

  @runtimeMethod()
  public async transferSigned(
    tokenId: TokenId,
    from: PublicKey,
    to: PublicKey,
    amount: Balance
  ) {
    assert(this.transaction.sender.value.equals(from), errors.senderNotFrom());

    await this.transfer(tokenId, from, to, amount);
  }

  @runtimeMethod()
  public async addBalance(
    tokenId: TokenId,
    address: PublicKey,
    amount: Balance
  ): Promise<void> {
    const circulatingSupply = await this.circulatingSupply.get();
    const newCirculatingSupply = Balance.from(circulatingSupply.value).add(
      amount
    );
    assert(
      newCirculatingSupply.lessThanOrEqual(this.config.totalSupply),
      "Circulating supply would be higher than total supply"
    );
    await this.circulatingSupply.set(newCirculatingSupply);
    await this.mint(tokenId, address, amount);
  }
}

import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, UInt64 } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { MinaLendModule } from "../../../src/runtime/modules/minalend";
import { Offer } from "../../../src/runtime/modules/offer";
import { log } from "@proto-kit/common";
import { TokenId } from "@proto-kit/library";

log.setLevel("ERROR");

describe("minalend", () => {
  it("should demonstrate how MinaLend works", async () => {
    const appChain = TestingAppChain.fromRuntime({
      MinaLendModule,
    });

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        MinaLendModule: {

        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alicePublicKey = alicePrivateKey.toPublicKey();
    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = alicePrivateKey.toPublicKey();
    const tokenId = TokenId.from(0);

    appChain.setSigner(alicePrivateKey);

    const offer = new Offer({
      offerId: UInt64.from(12),
      lender: alicePublicKey,
      borrower: bobPublicKey,
      annualInterestRate: UInt64.from(10),
      tokenId: TokenId.from(0),
      amount: UInt64.from(1000),
      period: UInt64.from(12),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const minaLendMod = appChain.runtime.resolve("MinaLendModule");

    const tx1 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer);
    });

    await tx1.sign();
    await tx1.send();

    const block = await appChain.produceBlock();

    const onChainOffer = await appChain.query.runtime.MinaLendModule.offers.get(UInt64.from(0));

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    // expect(onChainOffer?.offerId.toBigInt()).toBe(0n);
  }, 1_000_000);
});

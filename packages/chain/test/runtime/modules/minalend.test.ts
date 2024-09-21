import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { MinaLendModule } from "../../../src/runtime/modules/minalend";
import { Offer } from "../../../src/runtime/modules/offer";
import { log } from "@proto-kit/common";
import { TokenId, UInt64 } from "@proto-kit/library";

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

    const oKey = UInt64.from(12);

    const offer = new Offer({
      offerId: oKey,
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



    const onChainOffer = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    console.log(onChainOffer);

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer?.status.toBigInt()).toBe(0n);
  }, 1_000_000);
});

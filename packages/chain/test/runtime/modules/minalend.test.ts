import { TestingAppChain } from "@proto-kit/sdk";
import { PrivateKey, PublicKey } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { MinaLendModule } from "../../../src/runtime/modules/minalend";
import { Offer } from "../../../src/runtime/modules/offer";
import { log } from "@proto-kit/common";
import { TokenId, UInt64 } from "@proto-kit/library";

log.setLevel("ERROR");

/// Test for creating the offer
describe("minalend create offer", () => {
  it("should demonstrate how MinaLend creating of an offer works", async () => {
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
    const tokenId = TokenId.from(0);

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      borrower: PublicKey.empty(),
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

    expect(block?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer?.status.toBigInt()).toBe(0n);
  }, 1_000_000);
});


/// Test for cancelling the offer
describe("minalend cancel offer", () => {
  it("should demonstrate how MinaLend cancelling of an offer works", async () => {
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
    const tokenId = TokenId.from(0);

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      borrower: PublicKey.empty(),
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

    const block1 = await appChain.produceBlock();

    const onChainOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer1?.status.toBigInt()).toBe(0n);

    const tx2 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.cancelOffer(oKey);
    });

    await tx2.sign();
    await tx2.send();

    const block2= await appChain.produceBlock();

    const onChainOffer2 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer2?.status.toBigInt()).toBe(4n);

  }, 1_000_000);
});


/// Test for updating the offer
describe("minalend update offer", () => {
  it("should demonstrate how MinaLend updating of an offer works", async () => {
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
    const tokenId = TokenId.from(0);

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer1 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      borrower: PublicKey.empty(),
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
      await minaLendMod.createOffer(offer1);
    });

    await tx1.sign();
    await tx1.send();

    const block1 = await appChain.produceBlock();

    const onChainOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer1?.annualInterestRate.toBigInt()).toBe(10n);
    expect(onChainOffer1?.amount.toBigInt()).toBe(1000n);

    const offer2 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      borrower: PublicKey.empty(),
      annualInterestRate: UInt64.from(5),
      tokenId: TokenId.from(0),
      amount: UInt64.from(500),
      period: UInt64.from(12),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const tx2 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.updateOffer(oKey, offer2);
    });

    await tx2.sign();
    await tx2.send();

    const block2= await appChain.produceBlock();

    const onChainOffer2 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer2?.annualInterestRate.toBigInt()).toBe(5n);
    expect(onChainOffer2?.amount.toBigInt()).toBe(500n);

  }, 1_000_000);
});



/// Test for accepting the offer
describe("minalend accept offer", () => {
  it("should demonstrate how MinaLend accepting of an offer works", async () => {
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
    const bobPublicKey = bobPrivateKey.toPublicKey();
    const tokenId = TokenId.from(0);

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer1 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      borrower: PublicKey.empty(),
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
      await minaLendMod.createOffer(offer1);
    });

    await tx1.sign();
    await tx1.send();

    const block1 = await appChain.produceBlock();

    const onChainOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer1?.amount.toBigInt()).toBe(1000n);

    appChain.setSigner(bobPrivateKey);

   
    const tx2 = await appChain.transaction(bobPublicKey, async () => {
      await minaLendMod.acceptOffer(oKey, bobPublicKey);
    });

    await tx2.sign();
    await tx2.send();

    const block2= await appChain.produceBlock();

    const onChainOffer2 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);
    expect(onChainOffer2?.status.toBigInt()).toBe(1n);
    expect(onChainOffer2?.borrower).toEqual(bobPublicKey);

  }, 1_000_000);
});




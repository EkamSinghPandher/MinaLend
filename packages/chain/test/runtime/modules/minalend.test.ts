import "reflect-metadata";
import { TestingAppChain } from "@proto-kit/sdk";
import { Bool, PrivateKey, PublicKey } from "o1js";
import { Balances } from "../../../src/runtime/modules/balances";
import { MinaLendModule } from "../../../src/runtime/modules/minalend";
import { Offer } from "../../../src/runtime/modules/offer";
import { log } from "@proto-kit/common";
import { BalancesKey, TokenId, UInt64 } from "@proto-kit/library";

log.setLevel("ERROR");

/// Test for creating the offer
describe("minalend create offer", () => {
  it("should demonstrate how MinaLend creating of an offer works", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      MinaLendModule,
    });

    const tokenId = TokenId.from(0);

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        MinaLendModule: {
          tokenId: tokenId
        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alicePublicKey = alicePrivateKey.toPublicKey();

    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = bobPrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      annualInterestRate: UInt64.from(10),
      tokenId: tokenId,
      amount: UInt64.from(15),
      period: UInt64.from(12),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const balances = appChain.runtime.resolve("Balances");
    const minaLendMod = appChain.runtime.resolve("MinaLendModule");

    // init: add balance to Alice (should succed)
    const tx0 = await appChain.transaction(alicePublicKey, async () => {
      await balances.addBalance(tokenId, alicePublicKey, UInt64.from(20));
    });
    await tx0.sign();
    await tx0.send();
    const block0 = await appChain.produceBlock();
    expect(block0?.transactions[0].status.toBoolean()).toBe(true);
    const key = new BalancesKey({ tokenId, address: alicePublicKey });
    const savedBalance = await appChain.query.runtime.Balances.balances.get(key);
    expect(savedBalance?.toBigInt()).toBe(20n);

    // test 1: should fail (sent by Alice on behalf of Bob)
    offer.offerId = oKey;
    offer.lender = bobPublicKey;
    const tx1 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer);
    });

    await tx1.sign();
    await tx1.send();

    const block1 = await appChain.produceBlock();
    expect(block1?.transactions[0].status.toBoolean()).toBe(false);

    // test 2: offer is saved and can be retrieved (and pool balance is updated)
    offer.offerId = oKey;
    offer.lender = alicePublicKey;
    const tx2 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer);
    });

    await tx2.sign();
    await tx2.send();

    const block2 = await appChain.produceBlock();
    const savedOffer = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer?.offerId.toBigInt()).toBe(oKey.toBigInt());

    const poolAddr = minaLendMod.getPoolAddress();
    const poolKey = new BalancesKey({ tokenId, address: poolAddr });
    const savedPoolBalance = await appChain.query.runtime.Balances.balances.get(poolKey);
    expect(savedPoolBalance?.toBigInt()).toBe(offer.amount.toBigInt());

    // test 3: not enough balance (should fail)
    offer.offerId = UInt64.from(15);
    offer.lender = alicePublicKey;
    const tx3 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer);
    });

    await tx3.sign();
    await tx3.send();

    const block3 = await appChain.produceBlock();
    expect(block3?.transactions[0].status.toBoolean()).toBe(false);
  }, 1_000_000);
});

/// Test for cancelling the offer
describe("minalend cancel offer", () => {
  it("should demonstrate how MinaLend cancelling of an offer works", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      MinaLendModule,
    });

    const tokenId = TokenId.from(0);

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        MinaLendModule: {
          tokenId: tokenId
        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alicePublicKey = alicePrivateKey.toPublicKey();

    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = bobPrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      annualInterestRate: UInt64.from(10),
      tokenId: TokenId.from(0),
      amount: UInt64.from(10),
      period: UInt64.from(12),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const balances = appChain.runtime.resolve("Balances");
    const minaLendMod = appChain.runtime.resolve("MinaLendModule");

    // init: add balance to Alice (should succed)
    const tx0 = await appChain.transaction(alicePublicKey, async () => {
      await balances.addBalance(tokenId, alicePublicKey, UInt64.from(20));
    });
    await tx0.sign();
    await tx0.send();
    const block0 = await appChain.produceBlock();
    expect(block0?.transactions[0].status.toBoolean()).toBe(true);
    const key = new BalancesKey({ tokenId, address: alicePublicKey });
    const savedBalance = await appChain.query.runtime.Balances.balances.get(key);
    expect(savedBalance?.toBigInt()).toBe(20n);

    // actual tx
    const tx1 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer);
    });

    await tx1.sign();
    await tx1.send();

    const block1 = await appChain.produceBlock();

    const savedOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer1?.status.toBigInt()).toBe(0n);

    const tx2 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.cancelOffer(oKey);
    });

    await tx2.sign();
    await tx2.send();

    const block2 = await appChain.produceBlock();

    const savedOffer2 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer2?.status.toBigInt()).toBe(4n);

  }, 1_000_000);
});

/// Test for updating the offer
describe("minalend update offer", () => {
  it("should demonstrate how MinaLend updating of an offer works", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      MinaLendModule,
    });

    const tokenId = TokenId.from(0);

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        MinaLendModule: {
          tokenId: tokenId
        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alicePublicKey = alicePrivateKey.toPublicKey();
    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = bobPrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer1 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      annualInterestRate: UInt64.from(10),
      tokenId: TokenId.from(0),
      amount: UInt64.from(10),
      period: UInt64.from(12),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const balances = appChain.runtime.resolve("Balances");
    const minaLendMod = appChain.runtime.resolve("MinaLendModule");

    // init: add balance to Alice (should succed)
    const tx0 = await appChain.transaction(alicePublicKey, async () => {
      await balances.addBalance(tokenId, alicePublicKey, UInt64.from(20));
    });
    await tx0.sign();
    await tx0.send();
    const block0 = await appChain.produceBlock();
    expect(block0?.transactions[0].status.toBoolean()).toBe(true);
    const key = new BalancesKey({ tokenId, address: alicePublicKey });
    const savedBalance = await appChain.query.runtime.Balances.balances.get(key);
    expect(savedBalance?.toBigInt()).toBe(20n);

    // init offer
    const tx1 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer1);
    });

    await tx1.sign();
    await tx1.send();

    const block1 = await appChain.produceBlock();

    const savedOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer1?.annualInterestRate.toBigInt()).toBe(offer1.annualInterestRate.toBigInt());
    expect(savedOffer1?.amount.toBigInt()).toBe(offer1.amount.toBigInt());

    // update offer (up)
    const offer2 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      annualInterestRate: UInt64.from(5),
      tokenId: tokenId,
      amount: UInt64.from(15),
      period: UInt64.from(12),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const tx2 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.updateOfferUp(oKey, offer2);
    });

    await tx2.sign();
    await tx2.send();

    const block2 = await appChain.produceBlock();

    const savedOffer2 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer2?.annualInterestRate.toBigInt()).toBe(offer2.annualInterestRate.toBigInt());
    expect(savedOffer2?.amount.toBigInt()).toBe(offer2.amount.toBigInt());

    // check balance is updated
    const balanceKey = new BalancesKey({ tokenId, address: alicePublicKey });
    const savedBalance2 = await appChain.query.runtime.Balances.balances.get(balanceKey);
    expect(savedBalance2?.toBigInt()).toBe(UInt64.from(5).toBigInt());

    // update offer (down)
    const offer3 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      annualInterestRate: UInt64.from(5),
      tokenId: tokenId,
      amount: UInt64.from(5),
      period: UInt64.from(12),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const tx3 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.updateOfferDown(oKey, offer3);
    });

    await tx3.sign();
    await tx3.send();

    const block3 = await appChain.produceBlock();

    const savedOffer3 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block3?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer3?.annualInterestRate.toBigInt()).toBe(offer3.annualInterestRate.toBigInt());
    expect(savedOffer3?.amount.toBigInt()).toBe(offer3.amount.toBigInt());

    // check balance is updated
    const savedBalance3 = await appChain.query.runtime.Balances.balances.get(balanceKey);
    expect(savedBalance3?.toBigInt()).toBe(UInt64.from(15).toBigInt());
  }, 1_000_000);
});

/// Test for accepting the offer
describe("minalend accept offer", () => {
  it("should demonstrate how MinaLend accepting of an offer works", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      MinaLendModule,
    });

    const tokenId = TokenId.from(0);

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        MinaLendModule: {
          tokenId: tokenId
        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alicePublicKey = alicePrivateKey.toPublicKey();

    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = bobPrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer1 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
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

    const balances = appChain.runtime.resolve("Balances");
    const minaLendMod = appChain.runtime.resolve("MinaLendModule");

    // init: add balance to Alice (should succed)
    const tx0 = await appChain.transaction(alicePublicKey, async () => {
      await balances.addBalance(tokenId, alicePublicKey, UInt64.from(2000));
    });
    await tx0.sign();
    await tx0.send();
    const block0 = await appChain.produceBlock();
    expect(block0?.transactions[0].status.toBoolean()).toBe(true);
    const key = new BalancesKey({ tokenId, address: alicePublicKey });
    const savedBalance = await appChain.query.runtime.Balances.balances.get(key);
    expect(savedBalance?.toBigInt()).toBe(2000n);

    // actual tx
    const tx1 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer1);
    });

    await tx1.sign();
    await tx1.send();

    const block1 = await appChain.produceBlock();

    const savedOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);

    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer1?.amount.toBigInt()).toBe(offer1.amount.toBigInt());

    appChain.setSigner(bobPrivateKey);
    const tx2 = await appChain.transaction(bobPublicKey, async () => {
      await minaLendMod.acceptOffer(oKey, bobPublicKey);
    });

    await tx2.sign();
    await tx2.send();

    const block2 = await appChain.produceBlock();

    const savedOffer2 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);
    const savedLoan = await appChain.query.runtime.MinaLendModule.loans.get(oKey);

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer2?.status.toBigInt()).toBe(1n);
    expect(savedLoan?.borrower).toEqual(bobPublicKey);

  }, 1_000_000);
});

/// Test for accepting the offer
describe("minalend repay loan", () => {
  it("should demonstrate how MinaLend loan repayment", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      MinaLendModule,
    });

    const tokenId = TokenId.from(0);

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        MinaLendModule: {
          tokenId: tokenId
        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alicePublicKey = alicePrivateKey.toPublicKey();
    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = bobPrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(12);

    const offer1 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      annualInterestRate: UInt64.from(10),
      tokenId: TokenId.from(0),
      amount: UInt64.from(1000),
      period: UInt64.from(365),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const balances = appChain.runtime.resolve("Balances");
    const minaLendMod = appChain.runtime.resolve("MinaLendModule");

    // init: add balance to Alice (should succed)
    const tx0 = await appChain.transaction(alicePublicKey, async () => {
      await balances.addBalance(tokenId, alicePublicKey, UInt64.from(2000));
    });
    await tx0.sign();
    await tx0.send();
    const block0 = await appChain.produceBlock();
    expect(block0?.transactions[0].status.toBoolean()).toBe(true);
    const key = new BalancesKey({ tokenId, address: alicePublicKey });
    const savedBalance = await appChain.query.runtime.Balances.balances.get(key);
    expect(savedBalance?.toBigInt()).toBe(2000n);

    // set offer
    const tx1 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer1);
    });
    await tx1.sign();
    await tx1.send();
    const block1 = await appChain.produceBlock();
    const savedOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);
    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer1?.amount.toBigInt()).toBe(1000n);
    appChain.setSigner(bobPrivateKey);

    // accept offer
    const tx2 = await appChain.transaction(bobPublicKey, async () => {
      await minaLendMod.acceptOffer(oKey, bobPublicKey);
    });
    await tx2.sign();
    await tx2.send();
    const block2 = await appChain.produceBlock();

    expect(block2?.transactions[0].status.toBoolean()).toBe(true);

    // repay
    const savedLoan = await appChain.query.runtime.MinaLendModule.loans.get(oKey);
    // console.log(savedLoan?.amountToPay.toBigInt());
    // console.log(savedLoan?.amountPaid.toBigInt());

    const tx3 = await appChain.transaction(bobPublicKey, async () => {
      await minaLendMod.repayLoan(oKey, UInt64.from(100));
    });

    await tx3.sign();
    await tx3.send();
    const block3 = await appChain.produceBlock();

    const savedLoan2 = await appChain.query.runtime.MinaLendModule.loans.get(oKey);
    // console.log(savedLoan2?.amountToPay.toBigInt());
    // console.log(savedLoan2?.amountPaid.toBigInt());

    expect(block3?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedLoan2?.isCompleted.toBoolean()).toBe(false);
    expect(savedLoan2?.amountPaid.toBigInt()).toBe(100n);
  }, 1_000_000);
});

/// Test for accepting the offer
describe("minalend finalize loan", () => {
  it("should demonstrate how MinaLend finalizeLoan() works", async () => {
    const appChain = TestingAppChain.fromRuntime({
      Balances,
      MinaLendModule,
    });

    const tokenId = TokenId.from(0);

    appChain.configurePartial({
      Runtime: {
        Balances: {
          totalSupply: UInt64.from(10000),
        },
        MinaLendModule: {
          tokenId: tokenId
        }
      },
    });

    await appChain.start();

    const alicePrivateKey = PrivateKey.random();
    const alicePublicKey = alicePrivateKey.toPublicKey();
    const bobPrivateKey = PrivateKey.random();
    const bobPublicKey = bobPrivateKey.toPublicKey();

    appChain.setSigner(alicePrivateKey);

    const oKey = UInt64.from(21);

    const offer1 = new Offer({
      offerId: oKey,
      lender: alicePublicKey,
      annualInterestRate: UInt64.from(10),
      tokenId: TokenId.from(0),
      amount: UInt64.from(1000),
      period: UInt64.from(365),
      minPropertyValue: UInt64.from(100000),
      minIncomeMonthly: UInt64.from(10000),
      penalty: UInt64.from(100),
      status: UInt64.from(0)
    }
    );

    const balances = appChain.runtime.resolve("Balances");
    const minaLendMod = appChain.runtime.resolve("MinaLendModule");

    // init: add balance to Alice (should succed)
    const tx01 = await appChain.transaction(alicePublicKey, async () => {
      await balances.addBalance(tokenId, alicePublicKey, UInt64.from(2000));
    });
    await tx01.sign();
    await tx01.send();
    const block01 = await appChain.produceBlock();
    expect(block01?.transactions[0].status.toBoolean()).toBe(true);
    const tx02 = await appChain.transaction(alicePublicKey, async () => {
      await balances.addBalance(tokenId, bobPublicKey, UInt64.from(2000));
    });
    await tx02.sign();
    await tx02.send();
    const block02 = await appChain.produceBlock();
    expect(block02?.transactions[0].status.toBoolean()).toBe(true);

    const keyAlice = new BalancesKey({ tokenId, address: alicePublicKey });
    const savedBalanceAlice = await appChain.query.runtime.Balances.balances.get(keyAlice);
    expect(savedBalanceAlice?.toBigInt()).toBe(2000n);
    const keyBob = new BalancesKey({ tokenId, address: bobPublicKey });
    const savedBalanceBob = await appChain.query.runtime.Balances.balances.get(keyBob);
    expect(savedBalanceBob?.toBigInt()).toBe(2000n);

    // set offer
    const tx1 = await appChain.transaction(alicePublicKey, async () => {
      await minaLendMod.createOffer(offer1);
    });
    await tx1.sign();
    await tx1.send();
    const block1 = await appChain.produceBlock();
    const savedOffer1 = await appChain.query.runtime.MinaLendModule.offers.get(oKey);
    expect(block1?.transactions[0].status.toBoolean()).toBe(true);
    expect(savedOffer1?.amount.toBigInt()).toBe(1000n);
    appChain.setSigner(bobPrivateKey);

    // accept offer
    const tx2 = await appChain.transaction(bobPublicKey, async () => {
      await minaLendMod.acceptOffer(oKey, bobPublicKey);
    });
    await tx2.sign();
    await tx2.send();
    const block2 = await appChain.produceBlock();
    expect(block2?.transactions[0].status.toBoolean()).toBe(true);

    // repay all
    const savedLoan = await appChain.query.runtime.MinaLendModule.loans.get(oKey);
    const payment = savedLoan ? savedLoan.amountToPay : UInt64.from(0);

    const tx3 = await appChain.transaction(bobPublicKey, async () => {
      await minaLendMod.repayLoan(oKey, payment);
    });

    await tx3.sign();
    await tx3.send();
    const block3 = await appChain.produceBlock();
    expect(block3?.transactions[0].status.toBoolean()).toBe(true);

    // finalize
    const tx4 = await appChain.transaction(bobPublicKey, async () => {
      await minaLendMod.finalizeLoan(oKey);
    });

    await tx4.sign();
    await tx4.send();
    const block4 = await appChain.produceBlock();
    expect(block4?.transactions[0].status.toBoolean()).toBe(true);

    const savedLoan2 = await appChain.query.runtime.MinaLendModule.loans.get(oKey);
    expect(savedLoan2?.isCompleted.toBoolean()).toBe(true);
  }, 1_000_000);
});
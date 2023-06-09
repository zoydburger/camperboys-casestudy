import { getAllPossibleCouponCombinations } from "./coupons.server";
describe("basics", () => {
  it(`blocks blocked types`, () => {
    const coupon1 = { blockedTypes: ["1"] };
    const coupon2 = { blockedTypes: ["1"] };
    const ret = getAllPossibleCouponCombinations([coupon1, coupon2]);
    expect(ret).toHaveLength(2);
    expect(ret).toContainEqual([coupon1]);
    expect(ret).toContainEqual([coupon2]);
  });
  it(`combines coupons`, () => {
    const coupon1 = { blockedTypes: [] };
    const coupon2 = { blockedTypes: [] };
    const ret = getAllPossibleCouponCombinations([coupon1, coupon2]);
    expect(ret).toHaveLength(1);
    expect(ret).toContainEqual([coupon1, coupon2]);
  });
  it(`blocks multiple types`, () => {
    const coupon1 = { blockedTypes: ["1", "2"] };
    const coupon2 = { blockedTypes: ["1"] };
    const coupon3 = { blockedTypes: ["2"] };
    const ret = getAllPossibleCouponCombinations([coupon1, coupon2, coupon3]);
    expect(ret).toHaveLength(2);
    expect(ret).toContainEqual([coupon1]);
    expect(ret).toContainEqual([coupon2, coupon3]);
  });
});
describe("complex", () => {
  it(`l, r      l, r      l, r       f      f, l        f, l         
    langzeit1 langzeit2 langzeit3 coupon frühbucher1 frühbucher2, test
    * langzeit1, coupon, test
    * langzeit2, coupon, test
    * langzeit3, coupon, test
    * frühbucher1, test
    * frühbucher2, test`, () => {
    const coupons = [
      { name: "lz1", blockedTypes: ["l", "r"] },
      { name: "lz2", blockedTypes: ["l", "r"] },
      { name: "lz3", blockedTypes: ["l", "r"] },
      { name: "coupon", blockedTypes: ["f"] },
      { name: "fb1", blockedTypes: ["l", "f"] },
      { name: "fb2", blockedTypes: ["l", "f"] },
      { name: "test", blockedTypes: [] },
    ];
    const ret = getAllPossibleCouponCombinations(coupons);
    expect(ret).toHaveLength(5);
    const groups = [
      [0, 3, 6],
      [1, 3, 6],
      [2, 3, 6],
      [4, 6],
      [5, 6],
    ];
    for (const group of groups) {
      expect(ret).toContainEqual(group.map((idx) => coupons[idx]));
    }
  });
  it(`l, r      l, r      l, r       f      f, l        f, l       r  
    langzeit1 langzeit2 langzeit3 coupon frühbucher1 frühbucher2, test
    * langzeit1, coupon
    * langzeit2, coupon
    * langzeit3, coupon
    * coupon, test
    * frühbucher1, test
    * frühbucher2, test`, () => {
    const coupons = [
      { name: "lz1", blockedTypes: ["l", "r"] },
      { name: "lz2", blockedTypes: ["l", "r"] },
      { name: "lz3", blockedTypes: ["l", "r"] },
      { name: "coupon", blockedTypes: ["f"] },
      { name: "fb1", blockedTypes: ["l", "f"] },
      { name: "fb2", blockedTypes: ["l", "f"] },
      { name: "test", blockedTypes: ["r"] },
    ];
    const ret = getAllPossibleCouponCombinations(coupons);
    expect(ret).toHaveLength(6);
    const groups = [
      [0, 3],
      [1, 3],
      [2, 3],
      // Changed order here!
      [6, 3],
      [4, 6],
      [5, 6],
    ];
    for (const group of groups) {
      expect(ret).toContainEqual(group.map((idx) => coupons[idx]));
    }
  });
  it(`l, r      l, r      l, r       f      f, l        f, l       f  
    langzeit1 langzeit2 langzeit3 coupon frühbucher1 frühbucher2, test
    * langzeit1, coupon
    * langzeit1, test
    * langzeit2, coupon
    * langzeit2, test
    * langzeit3, coupon
    * langzeit3, test
    * frühbucher1
    * frühbucher2`, () => {
    const coupons = [
      { blockedTypes: ["l", "r"] },
      { blockedTypes: ["l", "r"] },
      { blockedTypes: ["l", "r"] },
      { blockedTypes: ["f"] },
      { blockedTypes: ["l", "f"] },
      { blockedTypes: ["l", "f"] },
      { blockedTypes: ["f"] },
    ];
    const ret = getAllPossibleCouponCombinations(coupons);
    expect(ret).toHaveLength(8);
    const groups = [[0, 3], [0, 6], [1, 3], [1, 6], [2, 3], [2, 6], [4], [5]];
    for (const group of groups) {
      expect(ret).toContainEqual(group.map((idx) => coupons[idx]));
    }
  });
  it(`l, r      l, r      l, r       f      f       f, l        f, l         
    langzeit1 langzeit2 langzeit3 coupon coupon2 frühbucher1 frühbucher2, test
    * langzeit1, coupon, test
    * langzeit1, coupon2, test
    * langzeit2, coupon, test
    * langzeit2, coupon2, test
    * langzeit3, coupon, test
    * langzeit3, coupon2, test
    * frühbucher1, test
    * frühbucher2, test`, () => {
    const coupons = [
      { blockedTypes: ["l", "r"] },
      { blockedTypes: ["l", "r"] },
      { blockedTypes: ["l", "r"] },
      { blockedTypes: ["f"] },
      { blockedTypes: ["f"] },
      { blockedTypes: ["l", "f"] },
      { blockedTypes: ["l", "f"] },
      { blockedTypes: [] },
    ];
    const ret = getAllPossibleCouponCombinations(coupons);
    expect(ret).toHaveLength(8);
    const groups = [
      [0, 3, 7],
      [0, 4, 7],
      [1, 3, 7],
      [1, 4, 7],
      [2, 3, 7],
      [2, 4, 7],
      [5, 7],
      [6, 7],
    ];
    for (const group of groups) {
      expect(ret).toContainEqual(group.map((idx) => coupons[idx]));
    }
  });
});

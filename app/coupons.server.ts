export function getAllPossibleCouponCombinations<
  T extends { blockedTypes: Array<string> }
>(coupons: Array<T>): Array<Array<T>> {
  const combinations: Array<Array<T>> = [];
  for (const coupon of coupons) {
    let foundGroup = false;
    for (let index = 0, length = combinations.length; index < length; index++) {
      const couponGroup = combinations[index];
      const blockedByGroup = coupon.blockedTypes.some((type) =>
        couponGroup.some((c) => c.blockedTypes.includes(type))
      );
      if (!blockedByGroup) {
        couponGroup.push(coupon);
        foundGroup = true;
        continue;
      }

      const validSubset = couponGroup.filter(
        (c) =>
          !coupon.blockedTypes.some((type) => c.blockedTypes.includes(type)) &&
          !combinations.find(
            (group) => group.includes(c) && group.includes(coupon)
          )
      );

      if (validSubset.length > 0) {
        combinations.push([coupon, ...validSubset]);
        foundGroup = true;
        continue;
      }
    }
    if (!foundGroup) {
      combinations.push([coupon]);
    }
  }
  return combinations;
}


export const PAYMENT_CONSTANTS = {
  MIN_AMOUNT_USD: 0.01,
  MIN_AMOUNT_KHR: 100,
  CURRENCY_USD: 'USD',
  CURRENCY_KHR: 'KHR',
};

export const validateOrderAmount = (amount, currency = PAYMENT_CONSTANTS.CURRENCY_USD) => {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return {
      valid: false,
      error: `Invalid order amount. Orders must be at least $${PAYMENT_CONSTANTS.MIN_AMOUNT_USD} USD or ${PAYMENT_CONSTANTS.MIN_AMOUNT_KHR} Riel (KHR) to proceed with payment.`,
      minAmount: PAYMENT_CONSTANTS.MIN_AMOUNT_USD,
    };
  }

  const minThreshold = currency === PAYMENT_CONSTANTS.CURRENCY_KHR
    ? PAYMENT_CONSTANTS.MIN_AMOUNT_KHR
    : PAYMENT_CONSTANTS.MIN_AMOUNT_USD;

  if (parsedAmount < minThreshold) {
    return {
      valid: false,
      error: currency === PAYMENT_CONSTANTS.CURRENCY_KHR
        ? `Minimum order amount is ${PAYMENT_CONSTANTS.MIN_AMOUNT_KHR} Riel (KHR).`
        : `Invalid order amount. Orders must be at least $${PAYMENT_CONSTANTS.MIN_AMOUNT_USD} to proceed with payment.`,
      minAmount: minThreshold,
    };
  }

  return { valid: true, error: null, amount: parsedAmount };
};

export default PAYMENT_CONSTANTS;

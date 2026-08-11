export class NoDiscount {
  calculate() { return 0; }
}

export class PercentageDiscount {
  constructor(percentage) {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) throw new Error('Percentage must be between 0 and 100.');
    this.percentage = percentage;
  }

  calculate(subtotal) { return subtotal * (this.percentage / 100); }
}

export class FixedAmountDiscount {
  constructor(amount) {
    if (!Number.isFinite(amount) || amount < 0) throw new Error('Discount amount must be non-negative.');
    this.amount = amount;
  }

  calculate(subtotal) { return Math.min(this.amount, subtotal); }
}

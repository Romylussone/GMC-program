import { LoanPolicy } from '../contracts/LoanPolicy.js';
import { addDays } from '../utils/date.js';

export class StandardLoanPolicy extends LoanPolicy {
  constructor(days = 14) { super(); this.days = days; }

  canBorrow(item, member, activeLoans) {
    if (!item.available) return { allowed: false, reason: 'Item is unavailable' };
    if (!item.loanable) return { allowed: false, reason: 'Item is reference-only' };
    if (activeLoans.length >= member.maxLoans) return { allowed: false, reason: 'Member loan limit reached' };
    return { allowed: true };
  }

  dueDate(borrowedAt) { return addDays(borrowedAt, this.days); }
}

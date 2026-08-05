/** Strategy contract for loan rules. */
export class LoanPolicy {
  canBorrow(_item, _member, _activeLoans) {
    throw new Error('LoanPolicy.canBorrow must be implemented');
  }

  dueDate(_borrowedAt) {
    throw new Error('LoanPolicy.dueDate must be implemented');
  }
}

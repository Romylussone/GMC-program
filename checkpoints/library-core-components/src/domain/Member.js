export class Member {
  constructor({ id, name, email, maxLoans = 5 }) {
    if (!id || !name || !email) throw new Error('Member requires id, name, and email');
    Object.assign(this, { id, name, email, maxLoans });
  }
}

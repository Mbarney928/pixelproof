/** An expected failure with a message fit for the terminal (bad config, missing baseline, …). */
export class UserError extends Error {
  override readonly name = 'UserError';
}

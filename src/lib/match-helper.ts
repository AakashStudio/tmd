/**
 * Canonicalizes two user IDs into a deterministic ordered pair (user1Id < user2Id).
 * 
 * Since the PostgreSQL schema enforces @@unique([user1Id, user2Id]), this canonicalization
 * guarantees that whether user A likes user B or user B likes user A, only ONE unique match
 * record can ever exist between the pair. A->B and B->A duplicate matches are mathematically
 * impossible to create.
 */
export function getCanonicalMatchPair(
  userIdA: string,
  userIdB: string
): { user1Id: string; user2Id: string } {
  if (!userIdA || !userIdB) {
    throw new Error("Both user IDs must be provided to form a match pair.");
  }

  if (userIdA === userIdB) {
    throw new Error("A user cannot match with themselves.");
  }

  if (userIdA < userIdB) {
    return { user1Id: userIdA, user2Id: userIdB };
  } else {
    return { user1Id: userIdB, user2Id: userIdA };
  }
}

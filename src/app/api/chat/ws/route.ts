import { NextRequest } from 'next/server';
import { verifySessionFromRequest } from '@/lib/auth/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let lastChecked = new Date().toISOString();
  let isActive = true;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const poll = async () => {
        while (isActive) {
          try {
            // Check for new messages
            const newMessages = await query(
              `SELECT 
                msg.id,
                msg.conversation_id as "conversationId",
                msg.sender_id as "senderId",
                msg.content,
                msg.message_type as "messageType",
                msg.status,
                msg.created_at as "createdAt"
               FROM messages msg
               JOIN conversations c ON c.id = msg.conversation_id
               JOIN matches m ON m.id = c.match_id
               WHERE (m.user1_id = $1 OR m.user2_id = $1)
                 AND msg.sender_id != $1
                 AND msg.created_at > $2
               ORDER BY msg.created_at ASC`,
              [session.userId, lastChecked]
            );

            for (const msg of newMessages.rows) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'new_message', data: msg })}\n\n`)
              );
            }

            // Check for status updates (delivered/read) on MY messages
            const statusUpdates = await query(
              `SELECT msg.id, msg.conversation_id as "conversationId", msg.status, msg.delivered_at as "deliveredAt", msg.read_at as "readAt"
               FROM messages msg
               JOIN conversations c ON c.id = msg.conversation_id
               JOIN matches m ON m.id = c.match_id
               WHERE (m.user1_id = $1 OR m.user2_id = $1)
                 AND msg.sender_id = $1
                 AND msg.updated_at > $2
                 AND msg.status != 'sent'`,
              [session.userId, lastChecked]
            );

            for (const update of statusUpdates.rows) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'status_update', data: update })}\n\n`)
              );
            }

            // Check for new matches
            const newMatches = await query(
              `SELECT m.id, m.created_at as "createdAt",
                CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END as "matchedUserId",
                p.name,
                (SELECT pp.storage_url FROM profile_photos pp WHERE pp.user_id = p.user_id AND pp.is_primary = true LIMIT 1) as "primaryPhoto"
               FROM matches m
               JOIN profiles p ON p.user_id = CASE WHEN m.user1_id = $1 THEN m.user2_id ELSE m.user1_id END
               WHERE (m.user1_id = $1 OR m.user2_id = $1)
                 AND m.status = 'active'
                 AND m.created_at > $2`,
              [session.userId, lastChecked]
            );

            for (const match of newMatches.rows) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'new_match', data: match })}\n\n`)
              );
            }

            lastChecked = new Date().toISOString();

            // Keepalive
            controller.enqueue(encoder.encode(`: keepalive\n\n`));

            // Poll every 2 seconds
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (err) {
            console.error('SSE poll error:', err);
            isActive = false;
            controller.close();
          }
        }
      };

      poll();
    },
    cancel() {
      isActive = false;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

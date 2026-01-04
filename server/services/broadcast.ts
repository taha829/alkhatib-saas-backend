import db from '../database.js';
import { sendMessage } from '../whatsapp/bot.js';
// We'll import Telegram send function later if needed, for now focusing on WhatsApp
// import { sendTelegramMessage } from '../telegram/bot.js';

let isProcessing = false;

// Configuration
const INTERVAL_MS = 10 * 1000; // Check every 10 seconds
const BATCH_SIZE = 2; // Process 2 messages per tick (conservative to avoid bans)

export function startBroadcastService() {
    console.log('[Broadcast Service] Started background worker.');
    setInterval(processQueue, INTERVAL_MS);
}

async function processQueue() {
    if (isProcessing) return;
    isProcessing = true;

    try {
        // 1. Find active campaigns (running)
        const activeCampaigns = db.prepare("SELECT id, platform, name FROM campaigns WHERE status = 'running'").all() as { id: number, platform: string, name: string }[];

        if (activeCampaigns.length === 0) {
            isProcessing = false;
            return;
        }

        console.log(`[Broadcast Service] Ticking... Found ${activeCampaigns.length} active campaigns.`);

        for (const campaign of activeCampaigns) {
            // 2. Find pending recipients for this campaign
            const recipients = db.prepare(`
                SELECT id, phone, name FROM campaign_recipients 
                WHERE campaign_id = ? AND status = 'pending' 
                LIMIT ?
            `).all(campaign.id, BATCH_SIZE) as { id: number, phone: string, name: string }[];

            if (recipients.length === 0) {
                // No more pending recipients, mark campaign as completed
                db.prepare("UPDATE campaigns SET status = 'completed' WHERE id = ?").run(campaign.id);
                console.log(`[Broadcast Service] ✅ Campaign ${campaign.id} (${campaign.name}) completed.`);
                continue;
            }

            console.log(`[Broadcast Service] Processing ${recipients.length} recipients for Campaign ${campaign.id}...`);

            // 3. Get Campaign Message
            const campaignData = db.prepare("SELECT message FROM campaigns WHERE id = ?").get(campaign.id) as { message: string };

            // 4. Send Messages
            for (const recipient of recipients) {
                try {
                    // Personalize message
                    const personalizedMsg = campaignData.message.replace(/{name}/g, recipient.name || 'عزيزي العميل');

                    if (campaign.platform === 'whatsapp') {
                        await sendMessage(recipient.phone, personalizedMsg);
                    } else if (campaign.platform === 'telegram') {
                        // TODO: Implement Telegram Broadcast
                        // await sendTelegramMessage(recipient.phone, personalizedMsg);
                    }

                    // Mark as sent
                    db.prepare("UPDATE campaign_recipients SET status = 'sent' WHERE id = ?").run(recipient.id);
                    db.prepare("UPDATE campaigns SET sent_count = sent_count + 1 WHERE id = ?").run(campaign.id);

                    // Dynamic Status Update: Mark contact as contacted if they exist in contacts table
                    // Use clean numbers for comparison or LIKE to handle variations
                    const cleanPhoneForSearch = recipient.phone.replace(/\D/g, '').slice(-9); // Get last 9 digits to match local format
                    db.prepare("UPDATE contacts SET status = 'contacted' WHERE phone LIKE ?").run(`%${cleanPhoneForSearch}%`);

                    console.log(`[Broadcast] Sent to ${recipient.phone} (Campaign ${campaign.id}) - Contact marked as contacted.`);

                } catch (error: any) {
                    console.error(`[Broadcast] Failed to send to ${recipient.phone}:`, error.message);

                    // Mark as failed
                    db.prepare("UPDATE campaign_recipients SET status = 'failed', error_message = ? WHERE id = ?").run(error.message, recipient.id);
                    db.prepare("UPDATE campaigns SET failed_count = failed_count + 1 WHERE id = ?").run(campaign.id);
                }

                // Small delay between batch items
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

    } catch (error) {
        console.error('[Broadcast Service] Error processing queue:', error);
    } finally {
        isProcessing = false;
    }
}

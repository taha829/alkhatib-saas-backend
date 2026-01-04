import { NotificationEventType } from '../domain/NotificationEvent.js';
import { NotificationRule, DEFAULT_NOTIFICATION_RULES } from '../domain/NotificationRule.js';

export class NotificationRuleEngine {
    private rules: Map<NotificationEventType, NotificationRule>;

    constructor() {
        this.rules = new Map();
        this.loadDefaultRules();
    }

    private loadDefaultRules(): void {
        DEFAULT_NOTIFICATION_RULES.forEach(rule => {
            this.rules.set(rule.event, rule);
        });
    }

    getRule(event: NotificationEventType): NotificationRule {
        const rule = this.rules.get(event);
        if (!rule) {
            console.warn(`[RuleEngine] No rule found for event: ${event}`);
            // قاعدة افتراضية
            return {
                event,
                channels: [],
                priority: 'MEDIUM' as any,
                audioType: 'INFO' as any,
                template: 'INFO_TEMPLATE',
                isEnabled: false,
            };
        }
        return rule;
    }

    updateRule(event: NotificationEventType, rule: Partial<NotificationRule>): void {
        const existingRule = this.rules.get(event);
        if (existingRule) {
            this.rules.set(event, { ...existingRule, ...rule });
        }
    }

    getAllRules(): NotificationRule[] {
        return Array.from(this.rules.values());
    }
}

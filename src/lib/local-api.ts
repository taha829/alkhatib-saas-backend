/**
/**
 * Local API Utility
 * This utility handles communication with the local Express backend.
 */

export const localApi = {
    /**
     * Check backend health
     */
    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Failed to connect to local backend:', error);
            throw error;
        }
    },

    /**
     * Trigger a scrape operation
     */
    async scrape(params: any) {
        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });
            if (!response.ok) throw new Error('Scrape operation failed');
            return await response.json();
        } catch (error) {
            console.error('Local backend scrape error:', error);
            throw error;
        }
    }
};

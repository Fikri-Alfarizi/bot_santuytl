/**
 * Shop Items Configuration
 */

export const SHOP_ITEMS = [
    // --- CONSUMABLES ---
    {
        id: 'premium_spin_ticket',
        name: '🎟️ Premium Spin Ticket',
        description: 'Tiket untuk sekali putar SPIN PREMIUM! Hadiah lebih mantap.',
        price: 5000,
        type: 'consumable',
        category: 'gacha'
    },
    {
        id: 'xp_boost',
        name: '⚡ Double XP (24 Jam)',
        description: 'XP kamu jadi 2x lipat selama 24 jam!',
        price: 15000,
        type: 'xp_boost',
        duration: 24 * 60 * 60 * 1000,
        multiplier: 2,
        category: 'boost'
    },
    {
        id: 'coin_boost',
        name: '💰 Double Coins (24 Jam)',
        description: 'Coins kamu jadi 2x lipat selama 24 jam!',
        price: 20000,
        type: 'coin_boost',
        duration: 24 * 60 * 60 * 1000,
        multiplier: 2,
        category: 'boost'
    },

    // --- ROLES (Temporary) ---
    {
        id: 'role_active',
        name: '🌟 Active Member (Permanen)',
        description: 'Role untuk member yang aktif chat! Murah meriah.',
        price: 10000,
        type: 'role',
        duration: 0, // Permanent
        roleId: process.env.ROLE_ACTIVE || null,
        category: 'role'
    },
    {
        id: 'role_meme',
        name: '🤡 Meme Lord (Permanen)',
        description: 'Lu lucu? Beli role ini biar orang tau.',
        price: 25000,
        type: 'role',
        duration: 0,
        roleId: process.env.ROLE_MEME || null,
        category: 'role'
    },
    {
        id: 'role_night',
        name: '🦉 Night Owl (Permanen)',
        description: 'Khusus buat yang suka begadang.',
        price: 25000,
        type: 'role',
        duration: 0,
        roleId: process.env.ROLE_NIGHT || null,
        category: 'role'
    },
    {
        id: 'role_gamer',
        name: '🎮 Gamer (Permanen)',
        description: 'Certified Gamer. No noobs allowed.',
        price: 25000,
        type: 'role',
        duration: 0,
        roleId: process.env.ROLE_GAMER || null,
        category: 'role'
    },
    {
        id: 'role_vip',
        name: '👑 VIP Role (7 Hari)',
        description: 'Dapet role VIP selama 7 hari. Akses channel eksklusif + Chat beda warna!',
        price: 50000,
        type: 'role',
        duration: 7 * 24 * 60 * 60 * 1000, // 7 days
        roleId: process.env.VIP_ROLE_ID || null,
        category: 'role'
    },
    {
        id: 'role_sultan',
        name: '💎 Sultan Role (30 Hari)',
        description: 'Status SULTAN! Pamer ke member lain kalo lu kaya raya.',
        price: 250000,
        type: 'role',
        duration: 30 * 24 * 60 * 60 * 1000,
        roleId: process.env.SULTAN_ROLE_ID || null,
        category: 'role'
    },
    {
        id: 'role_viper',
        name: '🐍 Viper Elite (30 Hari)',
        description: 'Tier di atas Sultan. Sangat eksklusif.',
        price: 1000000,
        type: 'role',
        duration: 30 * 24 * 60 * 60 * 1000,
        roleId: process.env.ROLE_VIPER || null,
        category: 'role'
    },
    {
        id: 'role_godfather',
        name: '🕴️ The Godfather (30 Hari)',
        description: 'Puncak rantai makanan. Lu yang punya server (secara teori).',
        price: 5000000,
        type: 'role',
        duration: 30 * 24 * 60 * 60 * 1000,
        roleId: process.env.ROLE_GODFATHER || null,
        category: 'role'
    },
    {
        id: 'color_custom',
        name: '🎨 Custom Color Role (3 Hari)',
        description: 'Pilih warna sendiri untuk role kamu!',
        price: 10000,
        type: 'custom_color',
        duration: 3 * 24 * 60 * 60 * 1000,
        category: 'role'
    },

    // --- UTILITY ---
    {
        id: 'rename_bot',
        name: '🤖 Rename Bot (1 Jam)',
        description: 'Ganti nama bot sesuai keinginan kamu (1 jam)',
        price: 75000,
        type: 'rename_bot',
        duration: 60 * 60 * 1000,
        category: 'utility'
    }
];

/**
 * Get item by ID
 */
export function getItemById(itemId) {
    return SHOP_ITEMS.find(item => item.id === itemId);
}

/**
 * Get all items by type
 */
export function getItemsByType(type) {
    return SHOP_ITEMS.filter(item => item.type === type);
}

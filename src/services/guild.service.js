import db from '../db/index.js';

class GuildService {
    getSettings(guildId) {
        let settings = db.prepare('SELECT * FROM guild_settings WHERE guild_id = ?').get(guildId);
        if (!settings) {
            const info = db.prepare('INSERT INTO guild_settings (guild_id) VALUES (?)').run(guildId);
            settings = {
                guild_id: guildId,
                welcome_channel_id: null,
                leave_channel_id: null,
                log_channel_id: null,
                welcome_message: 'Selamat datang {user} di {server}!',
                auto_role_id: null,
                admin_allowed_roles: null
            };
        }
        return settings;
    }

    updateSetting(guildId, key, value) {
        this.getSettings(guildId); // Ensure exists
        const stmt = db.prepare(`UPDATE guild_settings SET ${key} = ? WHERE guild_id = ?`);
        return stmt.run(value, guildId);
    }

    // --- ACCESS CONTROL ---

    getAdminRoles(guildId) {
        const settings = this.getSettings(guildId);
        if (!settings.admin_allowed_roles) return [];
        try {
            return JSON.parse(settings.admin_allowed_roles);
        } catch (e) {
            return [];
        }
    }

    addAdminRole(guildId, roleId) {
        const roles = this.getAdminRoles(guildId);
        if (!roles.includes(roleId)) {
            roles.push(roleId);
            this.updateSetting(guildId, 'admin_allowed_roles', JSON.stringify(roles));
        }
        return roles;
    }

    removeAdminRole(guildId, roleId) {
        let roles = this.getAdminRoles(guildId);
        roles = roles.filter(id => id !== roleId);
        this.updateSetting(guildId, 'admin_allowed_roles', JSON.stringify(roles));
        return roles;
    }

    isAdmin(interaction) {
        // 1. Check Owner
        if (interaction.user.id === interaction.guild.ownerId) return true;

        // 2. Check Allowed Roles
        const allowedRoles = this.getAdminRoles(interaction.guild.id);
        if (allowedRoles.length > 0) {
            if (interaction.member.roles.cache.some(r => allowedRoles.includes(r.id))) {
                return true;
            }
        }

        // Return false (Default Admin permission don't automatically grant access to this dashboard
        // unless we want to allow Administrator permission by default? User said "hanya bisa di akses oleh yang owner tentukan")
        return false;
    }
}

export default new GuildService();

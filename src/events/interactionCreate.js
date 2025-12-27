export default {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle Chat Commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                const reply = { content: '❌ Error executing command!', ephemeral: true };
                if (interaction.replied || interaction.deferred) await interaction.followUp(reply);
                else await interaction.reply(reply);
            }
        }

        // Handle Buttons
        else if (interaction.isButton()) {
            // VERIFIKASI SISTEM
            if (interaction.customId.startsWith('verify_btn_')) {
                const roleId = interaction.customId.split('_')[2];
                const role = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: '❌ Role tidak ditemukan/sudah dihapus!', ephemeral: true });
                }

                // Cek apakah user sudah punya role
                if (interaction.member.roles.cache.has(roleId)) {
                    return interaction.reply({ content: '✅ Kamu sudah terverifikasi!', ephemeral: true });
                }

                try {
                    await interaction.member.roles.add(role);
                    await interaction.reply({
                        content: `🎉 **Selamat Datang!** Kamu berhasil verifikasi dan mendapatkan role **${role.name}**.`,
                        ephemeral: true
                    });
                } catch (error) {
                    console.error(error);
                    await interaction.reply({ content: '❌ Bot gagal memberi role. Pastikan role Bot lebih tinggi dari role target!', ephemeral: true });
                }
            }
        }
    },
};

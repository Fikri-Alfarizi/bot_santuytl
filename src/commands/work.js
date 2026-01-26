import { SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getJobById, JOBS } from '../config/jobs/jobs.data.js';
import userService from '../services/user.service.js';
import db from '../db/index.js';

export const data = new SlashCommandBuilder()
    .setName('work')
    .setDescription('[👤 Public] Bekerja sesuai profesi untuk dapat gaji');

export async function execute(interaction) {
    const user = db.prepare('SELECT job FROM users WHERE id = ?').get(interaction.user.id);

    // Compat: Match ID or Name
    let jobConfig = JOBS.find(j => j.id === user?.job);
    if (!jobConfig) jobConfig = JOBS.find(j => j.name === user?.job);

    if (!jobConfig) {
        return interaction.reply({
            content: '❌ **PENGANGGURAN TERDETEKSI!**\nKamu belum punya pekerjaan. Lamar dulu ketik `/job`.',
            ephemeral: true
        });
    }

    // Task & Logic
    const task = jobConfig.tasks[Math.floor(Math.random() * jobConfig.tasks.length)];

    // UI: Select Menu for Answers (Cleaner than buttons for long text)
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('work_answer')
        .setPlaceholder('Pilih tindakan yang benar...')
        .addOptions(
            task.options.map((opt, i) =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(opt.substring(0, 100)) // Discord limit
                    .setValue(`ans_${i}`)
                    .setEmoji(['🇦', '🇧', '🇨', '🇩'][i] || '🔧')
            )
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = {
        title: `🏢 **SHIFT KERJA: ${jobConfig.name.toUpperCase()}**`,
        description: `Halo **${interaction.user.username}**, saatnya bekerja!\n\n❓ **KASUS:**\n*${task.question}*`,
        color: 0x3498DB,
        footer: { text: 'Pilih jawaban yang benar di bawah 👇' }
    };

    const reply = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 30000 });

    collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) return i.reply({ content: '🤫 Diem lu! Ini kerjaan orang.', ephemeral: true });

        const selectedIndex = parseInt(i.values[0].split('_')[1]);
        const selectedAnswer = task.options[selectedIndex];

        if (selectedAnswer === task.answer) {
            // Success
            const salary = Math.floor(Math.random() * (jobConfig.salary.max - jobConfig.salary.min + 1)) + jobConfig.salary.min;
            userService.addCoins(i.user.id, i.user.username, salary);

            const successEmbed = {
                title: '✅ **KERJA BAGUS!**',
                description: `Tepat sekali! Atasan senang dengan kinerjamu.`,
                color: 0x00FF00,
                fields: [
                    { name: '📝 Jawaban', value: task.answer, inline: true },
                    { name: '💰 Gaji Shift', value: `\`RP ${salary.toLocaleString()}\``, inline: true }
                ]
            };

            await i.update({ embeds: [successEmbed], components: [] });
        } else {
            // Fail
            const failEmbed = {
                title: '❌ **SALAH PROCEDURE!**',
                description: `Aduh, kamu melakukan kesalahan fatal.`,
                color: 0xFF0000,
                fields: [
                    { name: '📝 Jawaban Benar', value: task.answer, inline: true },
                    { name: '💸 Denda', value: 'Gaji dipotong (Rp 0)', inline: true }
                ],
                footer: { text: 'Belajar lagi SOP-nya ya!' }
            };

            await i.update({ embeds: [failEmbed], components: [] });
        }
        collector.stop();
    });

    collector.on('end', collected => {
        if (collected.size === 0) {
            reply.edit({
                content: '',
                embeds: [{ title: '💤 **DIPECAT!**', description: 'Kamu ketiduran pas jam kerja. Gaji hangus.', color: 0x000000 }],
                components: []
            }).catch(() => { });
        }
    });
}

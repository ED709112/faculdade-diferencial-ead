const db = require('../config/database');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const billingService = require('./billingService');
const promoService = require('./promoService');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', '..', 'backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS) || 14;

// =====================================================
// FOLLOW UP AUTOMATIZADO
// =====================================================

async function processFollowUps() {
  try {
    const [rules] = await db.query(
      "SELECT * FROM follow_up_rules WHERE is_active = 1"
    );

    for (const rule of rules) {
      const [leads] = await db.query(
        `SELECT id, name, status, updated_at FROM leads
         WHERE status = ? AND updated_at <= DATE_SUB(NOW(), INTERVAL ? DAY)
         LIMIT 50`,
        [rule.from_status, rule.days_waiting]
      );

      for (const lead of leads) {
        await db.query('UPDATE leads SET status = ?, updated_at = NOW() WHERE id = ?', [rule.to_status, lead.id]);
        await db.query(
          `INSERT INTO lead_interactions (lead_id, type, direction, subject, message)
           VALUES (?, 'system', 'outbound', 'Follow up automático', ?)`,
          [lead.id, `Lead movido automaticamente de "${rule.from_status}" para "${rule.to_status}" após ${rule.days_waiting} dias (regra: ${rule.name})`]
        );
        console.log(`[FollowUp] Lead #${lead.id} (${lead.name}) movido para ${rule.to_status}`);
      }
    }
  } catch (error) {
    console.error('[FollowUp] Erro:', error.message);
  }
}

// =====================================================
// BACKUP AUTOMÁTICO DO BANCO
// =====================================================

async function runDatabaseBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 3306;
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD || '';
    const database = process.env.DB_NAME || 'faculdade_diferencial_ead';
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const fileName = `backup-${database}-${dateStr}.sql`;
    const filePath = path.join(BACKUP_DIR, fileName);

    const cmd = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > "${filePath}" 2>/dev/null`;

    await new Promise((resolve, reject) => {
      exec(cmd, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve();
      });
    });

    const size = fs.statSync(filePath).size;

    await db.query(
      'INSERT INTO backup_history (file_name, file_size, type) VALUES (?, ?, ?)',
      [fileName, size, 'database']
    );

    console.log(`[Backup] Banco de dados salvo: ${fileName} (${(size / 1024 / 1024).toFixed(2)} MB)`);

    // Limpar backups antigos
    const [backups] = await db.query(
      'SELECT id, file_name FROM backup_history ORDER BY created_at DESC LIMIT 100'
    );

    if (backups.length > MAX_BACKUPS) {
      for (const old of backups.slice(MAX_BACKUPS)) {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, old.file_name));
        } catch {}
        await db.query('DELETE FROM backup_history WHERE id = ?', [old.id]);
      }
      console.log(`[Backup] Limpeza: removidos ${backups.length - MAX_BACKUPS} backups antigos`);
    }
  } catch (error) {
    console.error('[Backup] Erro:', error.message);
  }
}

// =====================================================
// LEMBRETES VENCIDOS - marcar notificação
// =====================================================

async function checkOverdueReminders() {
  try {
    const [reminders] = await db.query(
      `SELECT r.*, l.name as lead_name FROM reminders r
       LEFT JOIN leads l ON r.lead_id = l.id
       WHERE r.is_done = 0 AND r.remind_at <= NOW()
       LIMIT 50`
    );
    // Por enquanto só loga; notificação em tempo real ficaria via socket/email
    if (reminders.length > 0) {
      console.log(`[Reminders] ${reminders.length} lembrete(s) vencido(s) pendente(s)`);
    }
  } catch (error) {
    console.error('[Reminders] Erro:', error.message);
  }
}

// =====================================================
// AGENDADOR
// =====================================================

let followUpTimer = null;
let backupTimer = null;
let reminderTimer = null;
let billingTimer = null;
let promoTimer = null;

function start() {
  if (followUpTimer) return;

  console.log('CRM Automações iniciado');

  // Follow ups: a cada 5 minutos
  followUpTimer = setInterval(processFollowUps, 5 * 60 * 1000);
  processFollowUps();

  // Lembretes: a cada minuto
  reminderTimer = setInterval(checkOverdueReminders, 60 * 1000);

  // Régua de cobrança: a cada 5 minutos (envio automático via WhatsApp)
  billingTimer = setInterval(billingService.processBillingDunning, 5 * 60 * 1000);
  billingService.processBillingDunning();

  // Campanhas de divulgação (novos cursos): a cada 5 minutos
  promoTimer = setInterval(promoService.processPromoSending, 5 * 60 * 1000);
  promoService.processPromoSending();

  // Backup: diário às 03:00 (checagem a cada hora)
  backupTimer = setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour === 3 && minute === 0) {
      runDatabaseBackup();
    }
  }, 60 * 1000);

  // Backup inicial (no primeiro boot)
  setTimeout(runDatabaseBackup, 30 * 1000);
}

function stop() {
  if (followUpTimer) clearInterval(followUpTimer);
  if (backupTimer) clearInterval(backupTimer);
  if (reminderTimer) clearInterval(reminderTimer);
  if (billingTimer) clearInterval(billingTimer);
  if (promoTimer) clearInterval(promoTimer);
  followUpTimer = backupTimer = reminderTimer = billingTimer = promoTimer = null;
}

module.exports = { start, stop, processFollowUps, runDatabaseBackup, checkOverdueReminders };

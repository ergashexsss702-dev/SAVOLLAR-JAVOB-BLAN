import fs from 'fs';
import path from 'path';
import { AccessCodeRecord, AuditLogItem, PaymentRecord, UserSession } from '../../shared/types.ts';

interface DatabaseSchema {
  accessCodes: AccessCodeRecord[];
  users: UserSession[];
  payments: PaymentRecord[];
  auditLogs: AuditLogItem[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_CODES: AccessCodeRecord[] = [
  {
    id: 'code-demo-1',
    code: '07080717',
    description: 'Boshlang\'ich sinov (demo) kodi',
    maxUses: 9999,
    usedCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'code-vip-1',
    code: '77700011',
    description: 'Yillik to\'liq ta\'lim obunasi',
    maxUses: 50,
    usedCount: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'code-vip-2',
    code: '99881122',
    description: 'Maktab o\'qituvchisi paketi',
    maxUses: 100,
    usedCount: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-sample-1',
    userName: 'Akmal Karimov',
    phone: '+998901234567',
    amount: 70000,
    status: 'Tasdiqlangan',
    codeIssued: '07080717',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    note: 'Telegram @ergashexsss7o2 orqali to\'lov tasdiqlandi'
  },
  {
    id: 'pay-sample-2',
    userName: 'Nilufar Usmonova',
    phone: '+998939876543',
    amount: 70000,
    status: 'Kutilmoqda',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    note: 'Karta orqali chek yuborilgan, tekshirish kutilmoqda'
  }
];

class JsonStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private ensureDir() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch {
        // Directory creation error fallback
      }
    }
  }

  private load(): DatabaseSchema {
    this.ensureDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          accessCodes: parsed.accessCodes || INITIAL_CODES,
          users: parsed.users || [],
          payments: parsed.payments || INITIAL_PAYMENTS,
          auditLogs: parsed.auditLogs || [],
        };
      } catch (e) {
        console.error('Failed to parse database file, resetting to initial defaults', e);
      }
    }

    const initial: DatabaseSchema = {
      accessCodes: INITIAL_CODES,
      users: [],
      payments: INITIAL_PAYMENTS,
      auditLogs: [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          action: 'Tizim ishga tushirildi',
          details: 'Baza ma\'lumotlari boshlang\'ich holatda sozlandi',
          actor: 'System'
        }
      ]
    };
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(dataToSave: DatabaseSchema) {
    try {
      this.ensureDir();
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  private persist() {
    this.saveDirect(this.data);
  }

  // Access codes
  public getAccessCodes(): AccessCodeRecord[] {
    return [...this.data.accessCodes];
  }

  public findAccessCode(code: string): AccessCodeRecord | undefined {
    return this.data.accessCodes.find(
      (c) => c.code.trim() === code.trim() && c.isActive
    );
  }

  public incrementCodeUsage(code: string) {
    const item = this.data.accessCodes.find((c) => c.code.trim() === code.trim());
    if (item) {
      item.usedCount += 1;
      this.persist();
    }
  }

  public addAccessCode(record: Omit<AccessCodeRecord, 'id' | 'usedCount' | 'createdAt'>): AccessCodeRecord {
    const newRecord: AccessCodeRecord = {
      ...record,
      id: `code-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      usedCount: 0,
      createdAt: new Date().toISOString()
    };
    this.data.accessCodes.push(newRecord);
    this.addAuditLog('Yangi kirish kodi yaratildi', `Kod: ${newRecord.code}, Tavsif: ${newRecord.description}`, 'Admin');
    this.persist();
    return newRecord;
  }

  public toggleAccessCode(id: string, isActive: boolean): boolean {
    const item = this.data.accessCodes.find((c) => c.id === id);
    if (item) {
      item.isActive = isActive;
      this.addAuditLog('Kirish kodi holati o\'zgartirildi', `ID: ${id}, Faol: ${isActive}`, 'Admin');
      this.persist();
      return true;
    }
    return false;
  }

  // Users
  public getUsers(): UserSession[] {
    return [...this.data.users];
  }

  public addUserSession(session: UserSession) {
    // Keep last 100 sessions
    this.data.users = [session, ...this.data.users.filter((u) => u.userId !== session.userId)].slice(0, 100);
    this.persist();
  }

  // Payments
  public getPayments(): PaymentRecord[] {
    return [...this.data.payments];
  }

  public createPayment(userName: string, phone: string, amount = 70000): PaymentRecord {
    const record: PaymentRecord = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userName,
      phone,
      amount,
      status: 'Kutilmoqda',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.payments.unshift(record);
    this.addAuditLog('To\'lov so\'rovi yaratildi', `Foydalanuvchi: ${userName}, Tel: ${phone}`, 'User');
    this.persist();
    return record;
  }

  public updatePaymentStatus(id: string, status: PaymentRecord['status'], codeIssued?: string, note?: string): boolean {
    const payment = this.data.payments.find((p) => p.id === id);
    if (payment) {
      payment.status = status;
      payment.updatedAt = new Date().toISOString();
      if (codeIssued) payment.codeIssued = codeIssued;
      if (note) payment.note = note;
      this.addAuditLog('To\'lov holati yangilandi', `ID: ${id}, Yangi holat: ${status}, Kod: ${codeIssued || 'berilmadi'}`, 'Admin');
      this.persist();
      return true;
    }
    return false;
  }

  // Audit Logs
  public getAuditLogs(): AuditLogItem[] {
    return [...this.data.auditLogs].slice(0, 100);
  }

  public addAuditLog(action: string, details: string, actor = 'System') {
    const log: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      actor
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 200);
    }
    this.persist();
  }
}

export const db = new JsonStore();

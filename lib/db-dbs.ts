import fs from 'fs';
import path from 'path';

const dbsPath = path.join(process.cwd(), 'dbs');

if (!fs.existsSync(dbsPath)) {
    fs.mkdirSync(dbsPath, { recursive: true });
}

const readDbsFile = <T>(filename: string, defaultValue: T): T => {
    const filePath = path.join(dbsPath, filename);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
    }
    try {
        const file = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(file);
    } catch (error) {
        console.error(`[DBS] Erro ao ler ${filename}:`, error);
        return defaultValue;
    }
};

const saveDbsFile = <T>(filename: string, data: T): void => {
    const filePath = path.join(dbsPath, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`[DBS] Erro ao salvar ${filename}:`, error);
    }
};

import { Notification } from './db';

export const getNotificationsFromDbs = (): Notification[] => {
    return readDbsFile<Notification[]>('notifications.json', []);
};

export const saveNotificationsToDbs = (notifications: Notification[]): void => {
    saveDbsFile('notifications.json', notifications);
};

export const createNotificationDbs = (data: { userId: string; title: string; message: string; type: Notification['type'] }): Notification => {
    const notifications = getNotificationsFromDbs();
    
    const notification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        read: false,
        createdAt: new Date().toISOString()
    };
    
    notifications.push(notification);
    saveNotificationsToDbs(notifications);
    return notification;
};

export const createMassNotificationDbs = (data: { title: string; message: string; type: Notification['type'] }): Notification => {
    return createNotificationDbs({ ...data, userId: 'all' });
};

export const getUserNotificationsDbs = (userId: string): Notification[] => {
    const notifications = getNotificationsFromDbs();
    return notifications
        .filter(n => n.userId === userId || n.userId === 'all')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getUnreadNotificationCountDbs = (userId: string): number => {
    const notifications = getNotificationsFromDbs();
    return notifications.filter(n => 
        (n.userId === userId || n.userId === 'all') && !n.read
    ).length;
};

export const markNotificationAsReadDbs = (notificationId: string, userId: string): boolean => {
    const notifications = getNotificationsFromDbs();
    const index = notifications.findIndex(n => 
        n.id === notificationId && (n.userId === userId || n.userId === 'all')
    );
    
    if (index === -1) return false;
    
    notifications[index].read = true;
    saveNotificationsToDbs(notifications);
    return true;
};

export const markAllNotificationsAsReadDbs = (userId: string): void => {
    const notifications = getNotificationsFromDbs();
    notifications.forEach(n => {
        if (n.userId === userId || n.userId === 'all') {
            n.read = true;
        }
    });
    saveNotificationsToDbs(notifications);
};

export const deleteNotificationDbs = (notificationId: string): boolean => {
    const notifications = getNotificationsFromDbs();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return false;
    
    notifications.splice(index, 1);
    saveNotificationsToDbs(notifications);
    return true;
};

export const getAllNotificationsDbs = (): Notification[] => {
    return getNotificationsFromDbs().sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

import { Affiliate, User } from './db';

export const getAffiliatesFromDbs = (): Affiliate[] => {
    return readDbsFile<Affiliate[]>('affiliates.json', []);
};

export const saveAffiliatesToDbs = (affiliates: Affiliate[]): void => {
    saveDbsFile('affiliates.json', affiliates);
};

export const getUsersFromDbs = (): (User & { affiliateCode?: string; banned?: boolean })[] => {
    return readDbsFile<(User & { affiliateCode?: string; banned?: boolean })[]>('users.json', []);
};

export const saveUsersToDbs = (users: (User & { affiliateCode?: string; banned?: boolean })[]): void => {
    saveDbsFile('users.json', users);
};

const generateAffiliateCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const getUserAffiliateCodeDbs = (userId: string): string => {
    const users = getUsersFromDbs();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return '';
    

    if (!users[userIndex].affiliateCode) {
        const code = generateAffiliateCode();
        users[userIndex].affiliateCode = code;
        saveUsersToDbs(users);
        return code;
    }
    
    return users[userIndex].affiliateCode || '';
};

export const findUserByAffiliateCodeDbs = (code: string): (User & { affiliateCode?: string }) | undefined => {
    const users = getUsersFromDbs();
    return users.find(u => u.affiliateCode === code.toUpperCase());
};

export const createAffiliateRelationDbs = (referrerId: string, referredId: string, referredEmail: string): Affiliate | null => {
    const affiliates = getAffiliatesFromDbs();
    

    const existing = affiliates.find(a => a.referredId === referredId);
    if (existing) return null;
    

    if (referrerId === referredId) return null;
    
    const now = new Date().toISOString();
    const affiliate: Affiliate = {
        id: `aff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        referrerId,
        referredId,
        referredEmail,
        hasRecharged: false,
        rechargeAmount: 0,
        rewardPaid: false,
        createdAt: now,
        updatedAt: now
    };
    
    affiliates.push(affiliate);
    saveAffiliatesToDbs(affiliates);
    return affiliate;
};

export const getAffiliatesByReferrerDbs = (referrerId: string): Affiliate[] => {
    const affiliates = getAffiliatesFromDbs();
    return affiliates.filter(a => a.referrerId === referrerId);
};

export const updateAffiliateRechargeDbs = (referredId: string, amount: number): void => {
    const affiliates = getAffiliatesFromDbs();
    const index = affiliates.findIndex(a => a.referredId === referredId);
    if (index === -1) return;
    
    const affiliate = affiliates[index];
    

    if (amount >= 5 && !affiliate.hasRecharged) {
        affiliates[index].hasRecharged = true;
        affiliates[index].rechargeAmount = amount;
        affiliates[index].updatedAt = new Date().toISOString();
        saveAffiliatesToDbs(affiliates);
        

        checkAndPayAffiliateRewardDbs(affiliate.referrerId);
    }
};

export const checkAndPayAffiliateRewardDbs = (referrerId: string): boolean => {
    const affiliates = getAffiliatesFromDbs();
    
    const pendingAffiliates = affiliates.filter(a => 
        a.referrerId === referrerId && 
        a.hasRecharged && 
        !a.rewardPaid
    );
    

    if (pendingAffiliates.length >= 3) {

        let count = 0;
        for (let i = 0; i < affiliates.length && count < 3; i++) {
            if (affiliates[i].referrerId === referrerId && 
                affiliates[i].hasRecharged && 
                !affiliates[i].rewardPaid) {
                affiliates[i].rewardPaid = true;
                affiliates[i].updatedAt = new Date().toISOString();
                count++;
            }
        }
        saveAffiliatesToDbs(affiliates);
        

        const users = getUsersFromDbs();
        const userIndex = users.findIndex(u => u.id === referrerId);
        if (userIndex !== -1) {
            users[userIndex].balance += 5;
            users[userIndex].updatedAt = new Date().toISOString();
            saveUsersToDbs(users);
            

            createNotificationDbs({
                userId: referrerId,
                title: '🎉 Bônus de Afiliado!',
                message: 'Parabéns! Você ganhou R$5,00 por indicar 3 amigos que recarregaram!',
                type: 'SUCCESS'
            });
        }
        
        return true;
    }
    
    return false;
};

export const getAffiliateStatsDbs = (referrerId: string): { 
    totalInvites: number; 
    rechargedCount: number; 
    pendingReward: number;
    totalEarned: number;
} => {
    const affiliates = getAffiliatesFromDbs();
    const userAffiliates = affiliates.filter(a => a.referrerId === referrerId);
    const rechargedCount = userAffiliates.filter(a => a.hasRecharged && !a.rewardPaid).length;
    const paidCount = userAffiliates.filter(a => a.rewardPaid).length;
    
    return {
        totalInvites: userAffiliates.length,
        rechargedCount,
        pendingReward: Math.floor(rechargedCount / 3) * 5,
        totalEarned: Math.floor(paidCount / 3) * 5
    };
};

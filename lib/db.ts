import fs from 'fs';
import path from 'path';

const dbsDir = path.join(process.cwd(), 'dbs');
const usersPath = path.join(dbsDir, 'users.json');
const productsPath = path.join(dbsDir, 'products.json');
const transactionsPath = path.join(dbsDir, 'transactions.json');
const contasPath = path.join(dbsDir, 'contas.json');
const contasSemDimasPath = path.join(dbsDir, 'contas_semdimas.json');
const couponsPath = path.join(dbsDir, 'coupons.json');
const likesOrdersPath = path.join(dbsDir, 'likesOrders.json');
const apiKeysPath = path.join(dbsDir, 'apiKeys.json');
const settingsPath = path.join(dbsDir, 'settings.json');
const notificationsPath = path.join(dbsDir, 'notifications.json');
const affiliatesPath = path.join(dbsDir, 'affiliates.json');
const ratingsPath = path.join(dbsDir, 'ratings.json');
const guestAccountsPath = path.join(dbsDir, 'guest_accounts.json');
const analyticsPath = path.join(dbsDir, 'analytics.json');
const cheatKeysPath = path.join(dbsDir, 'cheat-keys.json');
const modapkKeysPath = path.join(dbsDir, 'modapk-keys.json');
const streamingKeysPath = path.join(dbsDir, 'streaming-keys.json');
const tokenAccountsPath = path.join(dbsDir, 'token_accounts.json');

export interface User {
    id: string;
    email: string;
    name: string;
    password?: string;
    otp?: string;
    otpExpires?: number;
    isVerified: boolean;
    balance: number;
    role: 'USER' | 'ADMIN';
    ipAddress?: string;
    affiliateCode?: string;
    banned?: boolean;

    discordId?: string;
    discordUsername?: string;
    discordAvatar?: string;

    customDiscount?: {
        type: 'PERCENT' | 'FIXED';
        value: number;
        expiresAt?: string;
        appliesTo?: string[];
        setBy?: string;
        setAt?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    stock: number;
    available: boolean;
    type: 'DIAMONDS' | 'PASSE' | 'LIKES' | 'GUEST_ACCOUNT' | 'BYPASS' | 'CHEAT' | 'MODAPK' | 'TOKEN' | 'STREAMING' | 'OTHER';
    createdAt: string;
    updatedAt: string;
}

export interface Transaction {
    id: string;
    userId: string;
    type: 'DEPOSIT' | 'PURCHASE';
    description: string;
    amount: number;
    date: string;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    pixCode?: string;
    qrCodeUrl?: string;

    gameUid?: string;
    playerNick?: string;
    productName?: string;
    likesAdded?: number;
    couponCode?: string;
    discount?: number;

    guestAccountUid?: string;
    guestAccountPassword?: string;

    bypassUid?: string;
    bypassDays?: number;
    bypassExpiration?: string;
    bypassDownloadUrl?: string;
    bypassTutorialUrl?: string;

    cheatKey?: string;
    cheatPlanType?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    cheatDownloadUrl?: string;
    cheatTutorialUrl?: string;

    modapkKey?: string;
    modapkPlanType?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    modapkDownloadUrl?: string;
    modapkTutorialUrl?: string;

    streamingKey?: string;
    streamingPlatform?: 'hbomax' | 'primevideo' | 'crunchyroll' | 'paramount' | 'canvapro' | 'disney';
}

export interface GarenaAccount {
    uid: string;
    password: string;
    accessToken?: string;
    jwt?: string;
    diamonds: number;
    passes: number;
    presentesSentToday: number;
    lastCheck?: string;
    status: 'ACTIVE' | 'ERROR' | 'INACTIVE';
    addedAt?: string;
    updatedAt?: string;
}

export interface UsedAccount {
    uid: string;
    password: string;
    usedAt: string;
    reason: string;
}

export interface LikesOrder {
    id: string;
    orderId: string;
    userId: string;
    playerId: string;
    playerName?: string;
    region: string;
    totalLikes: number;
    likesDelivered: number;
    likesPerDay: number;
    daysTotal: number;
    daysCompleted: number;
    status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ERROR';
    lastDelivery?: string;
    nextDelivery?: string;
    errorCount: number;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
    history: LikesDelivery[];
}

export interface LikesDelivery {
    date: string;
    likesAdded: number;
    success: boolean;
    error?: string;
}

export interface Settings {
    maintenance: boolean;
    maintenanceMessage?: string;
}

export interface Coupon {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minPurchase: number;
    maxUses: number;
    usedCount: number;
    usedBy: string[];
    expiresAt?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiKey {
    id: string;
    userId: string;
    key: string;
    name: string;
    active: boolean;
    usageCount: number;
    lastUsed?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'PROMO';
    read: boolean;
    createdAt: string;
}

export interface Affiliate {
    id: string;
    referrerId: string;
    referredId: string;
    referredEmail: string;
    hasRecharged: boolean;
    rechargeAmount: number;
    rewardPaid: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CheatKey {
    id: string;
    key: string;
    planType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    addedAt: string;
    addedBy?: string;
    sold?: boolean;
    soldAt?: string;
    soldTo?: string;
}

export interface ModApkKey {
    id: string;
    key: string;
    planType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    addedAt: string;
    addedBy?: string;
    sold?: boolean;
    soldAt?: string;
    soldTo?: string;
}

export interface StreamingKey {
    id: string;
    key: string;
    platform: 'hbomax' | 'primevideo' | 'crunchyroll' | 'paramount' | 'canvapro' | 'disney';
    addedAt: string;
    addedBy?: string;
    sold?: boolean;
    soldAt?: string;
    soldTo?: string;
}

export interface TokenAccount {
    uid: string;
    password: string;
    diamonds: number;
    caixas: number;
    presentesSentToday: number;
    status: 'ACTIVE' | 'ERROR' | 'INACTIVE';
    lastCheck?: string;
    addedAt?: string;
    updatedAt?: string;
}

export interface Database {
    users: User[];
    products: Product[];
    transactions: Transaction[];
    garenaAccounts: GarenaAccount[];
    notifications: Notification[];
    affiliates: Affiliate[];
    coupons: Coupon[];
    likesOrders: LikesOrder[];
    apiKeys: ApiKey[];
    settings: Settings;
}

function ensureDbsDir(): void {
    if (!fs.existsSync(dbsDir)) {
        fs.mkdirSync(dbsDir, { recursive: true });
    }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
    ensureDbsDir();
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
            return defaultValue;
        }
        const file = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(file);
    } catch (error) {
        return defaultValue;
    }
}

function writeJsonFile<T>(filePath: string, data: T): void {
    ensureDbsDir();
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Erro ao salvar ${filePath}:`, error);
    }
}

export const getUsers = (): User[] => readJsonFile<User[]>(usersPath, []);
export const saveUsers = (users: User[]): void => writeJsonFile(usersPath, users);

export const getProducts = (): Product[] => readJsonFile<Product[]>(productsPath, []);
export const saveProducts = (products: Product[]): void => writeJsonFile(productsPath, products);

export const getTransactions = (): Transaction[] => readJsonFile<Transaction[]>(transactionsPath, []);
export const saveTransactions = (transactions: Transaction[]): void => writeJsonFile(transactionsPath, transactions);

export const getGarenaAccounts = (): GarenaAccount[] => readJsonFile<GarenaAccount[]>(contasPath, []);
export const saveGarenaAccounts = (accounts: GarenaAccount[]): void => writeJsonFile(contasPath, accounts);
export const getAllGarenaAccounts = (): GarenaAccount[] => getGarenaAccounts();

export const getContasSemDimas = (): any[] => readJsonFile<any[]>(contasSemDimasPath, []);
export const saveContasSemDimas = (contas: any[]): void => writeJsonFile(contasSemDimasPath, contas);

export const getCoupons = (): Coupon[] => readJsonFile<Coupon[]>(couponsPath, []);
export const saveCoupons = (coupons: Coupon[]): void => writeJsonFile(couponsPath, coupons);

export const getLikesOrders = (): LikesOrder[] => readJsonFile<LikesOrder[]>(likesOrdersPath, []);
export const saveLikesOrders = (orders: LikesOrder[]): void => writeJsonFile(likesOrdersPath, orders);

export const getApiKeys = (): ApiKey[] => readJsonFile<ApiKey[]>(apiKeysPath, []);
export const saveApiKeys = (keys: ApiKey[]): void => writeJsonFile(apiKeysPath, keys);

export const getSettingsFromFile = (): Settings => readJsonFile<Settings>(settingsPath, { maintenance: false });
export const saveSettingsToFile = (settings: Settings): void => writeJsonFile(settingsPath, settings);

export const getNotifications = (): Notification[] => readJsonFile<Notification[]>(notificationsPath, []);
export const saveNotifications = (notifications: Notification[]): void => writeJsonFile(notificationsPath, notifications);

export const getAffiliates = (): Affiliate[] => readJsonFile<Affiliate[]>(affiliatesPath, []);
export const saveAffiliates = (affiliates: Affiliate[]): void => writeJsonFile(affiliatesPath, affiliates);

export const getCheatKeys = (): CheatKey[] => readJsonFile<CheatKey[]>(cheatKeysPath, []);
export const saveCheatKeys = (keys: CheatKey[]): void => writeJsonFile(cheatKeysPath, keys);

export const getModApkKeys = (): ModApkKey[] => readJsonFile<ModApkKey[]>(modapkKeysPath, []);
export const saveModApkKeys = (keys: ModApkKey[]): void => writeJsonFile(modapkKeysPath, keys);

export const getStreamingKeys = (): StreamingKey[] => readJsonFile<StreamingKey[]>(streamingKeysPath, []);
export const saveStreamingKeys = (keys: StreamingKey[]): void => writeJsonFile(streamingKeysPath, keys);

export const getTokenAccounts = (): TokenAccount[] => readJsonFile<TokenAccount[]>(tokenAccountsPath, []);
export const saveTokenAccounts = (accounts: TokenAccount[]): void => writeJsonFile(tokenAccountsPath, accounts);

export const getDb = (): Database => {
    return {
        users: getUsers(),
        products: getProducts(),
        transactions: getTransactions(),
        garenaAccounts: getGarenaAccounts(),
        notifications: getNotifications(),
        affiliates: getAffiliates(),
        coupons: getCoupons(),
        likesOrders: getLikesOrders(),
        apiKeys: getApiKeys(),
        settings: getSettingsFromFile()
    };
};

export const saveDb = (data: Database): void => {
    saveUsers(data.users);
    saveProducts(data.products);
    saveTransactions(data.transactions);
    saveGarenaAccounts(data.garenaAccounts);
    saveNotifications(data.notifications || []);
    saveAffiliates(data.affiliates || []);
    saveCoupons(data.coupons || []);
    saveLikesOrders(data.likesOrders || []);
    saveApiKeys(data.apiKeys || []);
    saveSettingsToFile(data.settings);
};

export const getUsedAccounts = (): UsedAccount[] => getContasSemDimas();
export const saveUsedAccounts = (accounts: UsedAccount[]): void => saveContasSemDimas(accounts);

export const moveToUsedAccounts = (uid: string, reason: string): boolean => {
    const accounts = getGarenaAccounts();
    const account = accounts.find(a => a.uid === uid);

    if (!account) return false;

    const usedAccounts = getContasSemDimas();
    usedAccounts.push({
        uid: account.uid,
        password: account.password,
        usedAt: new Date().toISOString(),
        reason
    });
    saveContasSemDimas(usedAccounts);

    const index = accounts.findIndex(a => a.uid === uid);
    if (index !== -1) {
        accounts.splice(index, 1);
        saveGarenaAccounts(accounts);
    }

    return true;
};

export const getAllProducts = (): Product[] => getProducts();

export const findProductById = (id: string): Product | undefined => {
    const products = getProducts();
    return products.find(p => p.id === id);
};

export const findProductByType = (type: Product['type']): Product | undefined => {
    const products = getProducts();
    return products.find(p => p.type === type);
};

export const getProductPrice = (type: Product['type']): number => {
    const product = findProductByType(type);
    return product?.price || 0;
};

export const updateProduct = (id: string, updates: Partial<Product>): Product | null => {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
        ...products[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveProducts(products);
    return products[index];
};

export const updateProductStock = (id: string, stock: number): Product | null => {
    return updateProduct(id, { stock });
};

export const upsertProduct = (product: Partial<Product> & { id: string }): Product => {
    const existing = findProductById(product.id);
    if (existing) {
        return updateProduct(product.id, product) || existing;
    }
    return createProduct({
        id: product.id,
        name: product.name || 'Novo Produto',
        description: product.description || '',
        price: product.price || 0,
        image: product.image || '',
        stock: product.stock || 0,
        available: product.available ?? true,
        type: product.type || 'OTHER'
    });
};

export const createProduct = (product: Omit<Product, 'createdAt' | 'updatedAt'>): Product => {
    const products = getProducts();
    const now = new Date().toISOString();
    const newProduct: Product = {
        ...product,
        createdAt: now,
        updatedAt: now
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
};

export const findUserByEmail = (email: string): User | undefined => {
    const users = getUsers();
    return users.find(u => u.email === email);
};

export const createUser = (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
    const users = getUsers();
    const now = new Date().toISOString();
    const newUser: User = {
        ...user,
        id: user.email,
        createdAt: now,
        updatedAt: now
    };
    users.push(newUser);
    saveUsers(users);
    return newUser;
};

export const updateUser = (email: string, updates: Partial<User>): User | null => {
    const users = getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index === -1) return null;

    users[index] = {
        ...users[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveUsers(users);
    return users[index];
};

export const createTransaction = (transaction: Omit<Transaction, 'date'>): Transaction => {
    const transactions = getTransactions();
    const newTransaction: Transaction = {
        ...transaction,
        date: new Date().toISOString()
    };
    transactions.push(newTransaction);
    saveTransactions(transactions);
    return newTransaction;
};

export const findTransactionById = (id: string): Transaction | undefined => {
    const transactions = getTransactions();
    return transactions.find(t => t.id === id);
};

export const updateTransaction = (id: string, updates: Partial<Transaction>): Transaction | null => {
    const transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) return null;

    transactions[index] = {
        ...transactions[index],
        ...updates
    };
    saveTransactions(transactions);
    return transactions[index];
};

export const getUserTransactions = (userId: string): Transaction[] => {
    const transactions = getTransactions();
    return transactions.filter(t => t.userId === userId);
};

export const getPendingTransaction = (userId: string, minutesAgo?: number): Transaction | undefined => {
    const transactions = getTransactions();
    const now = new Date();
    return transactions.find(t => {
        if (t.userId !== userId || t.status !== 'PENDING' || t.type !== 'DEPOSIT') return false;
        if (minutesAgo) {
            const txDate = new Date(t.date);
            const diffMinutes = (now.getTime() - txDate.getTime()) / (1000 * 60);
            return diffMinutes <= minutesAgo;
        }
        return true;
    });
};

export const findGarenaAccountByUid = (uid: string): GarenaAccount | undefined => {
    const accounts = getGarenaAccounts();
    return accounts.find(a => a.uid === uid);
};

export const addGarenaAccount = (account: Omit<GarenaAccount, 'addedAt' | 'updatedAt'>): GarenaAccount => addOrUpdateGarenaAccount(account);

export const addOrUpdateGarenaAccount = (account: Omit<GarenaAccount, 'addedAt' | 'updatedAt'>): GarenaAccount => {
    const accounts = getGarenaAccounts();
    const now = new Date().toISOString();
    const existing = accounts.findIndex(a => a.uid === account.uid);

    const existingPassword = existing !== -1 ? accounts[existing].password : account.password;
    const newPassword = account.password || existingPassword;

    if (existing !== -1) {
        accounts[existing] = {
            ...accounts[existing],
            ...account,
            password: newPassword,
            updatedAt: now
        };
        saveGarenaAccounts(accounts);
        return accounts[existing];
    }

    const newAccount: GarenaAccount = {
        ...account,
        addedAt: now,
        updatedAt: now
    };
    accounts.push(newAccount);
    saveGarenaAccounts(accounts);
    return newAccount;
};

export const updateGarenaAccount = (uid: string, updates: Partial<GarenaAccount>): GarenaAccount | null => {
    const accounts = getGarenaAccounts();
    const index = accounts.findIndex(a => a.uid === uid);
    if (index === -1) return null;

    accounts[index] = {
        ...accounts[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveGarenaAccounts(accounts);

    if (accounts[index].passes === 0 && accounts[index].diamonds === 0) {
        moveToUsedAccounts(uid, 'Sem diamantes e passes');
    }

    return accounts[index];
};

export const removeGarenaAccount = (uid: string): boolean => {
    const accounts = getGarenaAccounts();
    const index = accounts.findIndex(a => a.uid === uid);
    if (index === -1) return false;

    accounts.splice(index, 1);
    saveGarenaAccounts(accounts);
    return true;
};

export const getGarenaAccountStats = (): {
    totalAccounts: number;
    activeAccounts: number;
    errorAccounts: number;
    totalDiamonds: number;
    totalPassesAvailable: number;
} => {
    const accounts = getGarenaAccounts();

    return {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(a => a.status === 'ACTIVE').length,
        errorAccounts: accounts.filter(a => a.status === 'ERROR').length,
        totalDiamonds: accounts.reduce((sum, a) => sum + (a.diamonds || 0), 0),
        totalPassesAvailable: accounts.reduce((sum, a) => sum + (a.passes || 0), 0)
    };
};

export const getSettings = (): Settings => getSettingsFromFile();

export const updateSettings = (updates: Partial<Settings>): Settings => {
    const settings = getSettingsFromFile();
    const newSettings = { ...settings, ...updates };
    saveSettingsToFile(newSettings);
    return newSettings;
};

export const syncPasseStock = (): void => {
    const stats = getGarenaAccountStats();
    const products = getProducts();

    const passeIndex = products.findIndex(p => p.type === 'PASSE');
    if (passeIndex !== -1) {
        products[passeIndex].stock = stats.totalPassesAvailable;
        products[passeIndex].updatedAt = new Date().toISOString();
    }

    const guestAccounts = getGuestAccounts();
    const availableGuestAccounts = guestAccounts.filter(g => !g.sold).length;
    const guestIndex = products.findIndex(p => (p.type as string) === 'GUEST_ACCOUNT');
    if (guestIndex !== -1) {
        products[guestIndex].stock = availableGuestAccounts;
        products[guestIndex].updatedAt = new Date().toISOString();
    }

    syncCheatProductStock();

    syncTokenStock();

    saveProducts(products);
};

export const getTokenAccountStats = (): {
    totalAccounts: number;
    activeAccounts: number;
    errorAccounts: number;
    totalDiamonds: number;
    totalCaixasAvailable: number;
} => {
    const accounts = getTokenAccounts();
    return {
        totalAccounts: accounts.length,
        activeAccounts: accounts.filter(a => a.status === 'ACTIVE').length,
        errorAccounts: accounts.filter(a => a.status === 'ERROR').length,
        totalDiamonds: accounts.reduce((sum, a) => sum + (a.diamonds || 0), 0),
        totalCaixasAvailable: accounts.reduce((sum, a) => sum + (a.caixas || 0), 0)
    };
};

export const addOrUpdateTokenAccount = (account: Omit<TokenAccount, 'addedAt' | 'updatedAt'>): TokenAccount => {
    const accounts = getTokenAccounts();
    const now = new Date().toISOString();
    const existing = accounts.findIndex(a => a.uid === account.uid);

    const existingPassword = existing !== -1 ? accounts[existing].password : account.password;
    const newPassword = account.password || existingPassword;

    if (existing !== -1) {
        accounts[existing] = {
            ...accounts[existing],
            ...account,
            password: newPassword,
            updatedAt: now
        };
        saveTokenAccounts(accounts);
        return accounts[existing];
    }

    const newAccount: TokenAccount = {
        ...account,
        addedAt: now,
        updatedAt: now
    };
    accounts.push(newAccount);
    saveTokenAccounts(accounts);
    return newAccount;
};

export const updateTokenAccount = (uid: string, updates: Partial<TokenAccount>): TokenAccount | null => {
    const accounts = getTokenAccounts();
    const index = accounts.findIndex(a => a.uid === uid);
    if (index === -1) return null;

    accounts[index] = {
        ...accounts[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveTokenAccounts(accounts);
    return accounts[index];
};

export const removeTokenAccount = (uid: string): boolean => {
    const accounts = getTokenAccounts();
    const index = accounts.findIndex(a => a.uid === uid);
    if (index === -1) return false;

    accounts.splice(index, 1);
    saveTokenAccounts(accounts);
    return true;
};

export const syncTokenStock = (): void => {
    const stats = getTokenAccountStats();
    const products = getProducts();

    const tokenIndex = products.findIndex(p => p.type === 'TOKEN');
    if (tokenIndex !== -1) {
        products[tokenIndex].stock = stats.totalCaixasAvailable;
        products[tokenIndex].updatedAt = new Date().toISOString();
        saveProducts(products);
    }
};

export const createLikesOrder = (orderData: Omit<LikesOrder, 'id' | 'createdAt' | 'updatedAt' | 'history'>): LikesOrder => {
    const orders = getLikesOrders();
    const now = new Date().toISOString();
    const order: LikesOrder = {
        ...orderData,
        id: `likes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        history: [],
        createdAt: now,
        updatedAt: now
    };

    orders.push(order);
    saveLikesOrders(orders);
    return order;
};

export const getLikesOrderById = (id: string): LikesOrder | undefined => {
    const orders = getLikesOrders();
    return orders.find(o => o.id === id);
};

export const getLikesOrdersByUser = (userId: string): LikesOrder[] => {
    const orders = getLikesOrders();
    return orders.filter(o => o.userId === userId);
};

export const getActiveLikesOrders = (): LikesOrder[] => {
    const orders = getLikesOrders();
    return orders.filter(o => o.status === 'ACTIVE' || o.status === 'ERROR');
};

export const getPendingLikesDeliveries = (): LikesOrder[] => {
    const orders = getLikesOrders();
    const now = new Date();

    return orders.filter(o => {
        if (o.status !== 'ACTIVE' && o.status !== 'ERROR') return false;
        if (o.likesDelivered >= o.totalLikes) return false;
        if (!o.nextDelivery) return true;
        return new Date(o.nextDelivery) <= now;
    });
};

export const updateLikesOrder = (id: string, updates: Partial<LikesOrder>): LikesOrder | null => {
    const orders = getLikesOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return null;

    orders[index] = {
        ...orders[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveLikesOrders(orders);
    return orders[index];
};

export const toggleLikesOrderPause = (orderId: string, userId: string): LikesOrder | null => {
    const orders = getLikesOrders();
    const index = orders.findIndex(o => o.id === orderId && o.userId === userId);
    if (index === -1) return null;

    const order = orders[index];

    if (order.status === 'COMPLETED') return null;

    if (order.status === 'PAUSED') {
        order.status = 'ACTIVE';
        order.errorCount = 0;
    } else {
        order.status = 'PAUSED';
    }

    order.updatedAt = new Date().toISOString();
    saveLikesOrders(orders);
    return order;
};

export const addLikesDelivery = (orderId: string, delivery: LikesDelivery): LikesOrder | null => {
    const orders = getLikesOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    const order = orders[index];
    order.history.push(delivery);

    if (delivery.success) {
        order.likesDelivered += delivery.likesAdded;
        order.daysCompleted += 1;
        order.lastDelivery = delivery.date;
        order.errorCount = 0;
        order.lastError = undefined;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        order.nextDelivery = tomorrow.toISOString();

        if (order.likesDelivered >= order.totalLikes) {
            order.status = 'COMPLETED';
            order.nextDelivery = undefined;
        }
    } else {
        order.errorCount += 1;
        order.lastError = delivery.error;

        const retryTime = new Date();
        retryTime.setHours(retryTime.getHours() + 2);
        order.nextDelivery = retryTime.toISOString();

        if (order.errorCount >= 5) {
            order.status = 'PAUSED';
        } else {
            order.status = 'ERROR';
        }
    }

    order.updatedAt = new Date().toISOString();
    saveLikesOrders(orders);
    return order;
};

export const getAllCoupons = (): Coupon[] => getCoupons();

export const getActiveCoupons = (): Coupon[] => {
    const coupons = getCoupons();
    const now = new Date();
    return coupons.filter(c =>
        c.active &&
        (!c.expiresAt || new Date(c.expiresAt) > now) &&
        (c.maxUses === 0 || c.usedCount < c.maxUses)
    );
};

export const findCouponByCode = (code: string): Coupon | undefined => {
    const coupons = getCoupons();
    return coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
};

export const findCouponById = (id: string): Coupon | undefined => {
    const coupons = getCoupons();
    return coupons.find(c => c.id === id);
};

export const createCoupon = (couponData: Omit<Coupon, 'id' | 'usedCount' | 'usedBy' | 'createdAt' | 'updatedAt'>): Coupon => {
    const coupons = getCoupons();
    const now = new Date().toISOString();
    const coupon: Coupon = {
        ...couponData,
        id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        code: couponData.code.toUpperCase(),
        usedCount: 0,
        usedBy: [],
        createdAt: now,
        updatedAt: now
    };

    coupons.push(coupon);
    saveCoupons(coupons);
    return coupon;
};

export const updateCoupon = (id: string, updates: Partial<Coupon>): Coupon | null => {
    const coupons = getCoupons();
    const index = coupons.findIndex(c => c.id === id);
    if (index === -1) return null;

    coupons[index] = {
        ...coupons[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };
    saveCoupons(coupons);
    return coupons[index];
};

export const deleteCoupon = (id: string): boolean => {
    const coupons = getCoupons();
    const index = coupons.findIndex(c => c.id === id);
    if (index === -1) return false;

    coupons.splice(index, 1);
    saveCoupons(coupons);
    return true;
};

export const useCoupon = (code: string, userId: string, purchaseAmount: number): { success: boolean; discount: number; message: string } => {
    const coupons = getCoupons();
    const coupon = findCouponByCode(code);

    if (!coupon) return { success: false, discount: 0, message: 'Cupom não encontrado' };
    if (!coupon.active) return { success: false, discount: 0, message: 'Cupom inativo' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { success: false, discount: 0, message: 'Cupom expirado' };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { success: false, discount: 0, message: 'Cupom esgotado' };
    if (coupon.usedBy.includes(userId)) return { success: false, discount: 0, message: 'Você já usou este cupom' };
    if (purchaseAmount < coupon.minPurchase) return { success: false, discount: 0, message: `Valor mínimo: R$ ${coupon.minPurchase.toFixed(2)}` };

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = (purchaseAmount * coupon.value) / 100;
    } else {
        discount = Math.min(coupon.value, purchaseAmount);
    }

    const index = coupons.findIndex(c => c.id === coupon.id);
    if (index !== -1) {
        coupons[index].usedCount += 1;
        coupons[index].usedBy.push(userId);
        coupons[index].updatedAt = new Date().toISOString();
        saveCoupons(coupons);
    }

    return { success: true, discount, message: 'Cupom aplicado com sucesso!' };
};

export const validateCoupon = (code: string, userId: string, purchaseAmount: number): { valid: boolean; discount: number; message: string } => {
    const coupon = findCouponByCode(code);

    if (!coupon) return { valid: false, discount: 0, message: 'Cupom não encontrado' };
    if (!coupon.active) return { valid: false, discount: 0, message: 'Cupom inativo' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { valid: false, discount: 0, message: 'Cupom expirado' };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return { valid: false, discount: 0, message: 'Cupom esgotado' };
    if (coupon.usedBy.includes(userId)) return { valid: false, discount: 0, message: 'Você já usou este cupom' };
    if (purchaseAmount < coupon.minPurchase) return { valid: false, discount: 0, message: `Valor mínimo: R$ ${coupon.minPurchase.toFixed(2)}` };

    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
        discount = (purchaseAmount * coupon.value) / 100;
    } else {
        discount = Math.min(coupon.value, purchaseAmount);
    }

    return { valid: true, discount, message: `Desconto de R$ ${discount.toFixed(2)}` };
};

const generateApiKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'lhub_';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
};

export const createApiKey = (userId: string, name: string): ApiKey => {
    const keys = getApiKeys();
    const now = new Date().toISOString();

    const apiKey: ApiKey = {
        id: `apikey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        key: generateApiKey(),
        name,
        active: true,
        usageCount: 0,
        createdAt: now,
        updatedAt: now
    };

    keys.push(apiKey);
    saveApiKeys(keys);
    return apiKey;
};

export const getUserApiKeys = (userId: string): ApiKey[] => {
    const keys = getApiKeys();
    return keys.filter(k => k.userId === userId);
};

export const findApiKeyByKey = (key: string): ApiKey | undefined => {
    const keys = getApiKeys();
    return keys.find(k => k.key === key && k.active);
};

export const updateApiKeyUsage = (key: string): void => {
    const keys = getApiKeys();
    const index = keys.findIndex(k => k.key === key);
    if (index !== -1) {
        keys[index].usageCount += 1;
        keys[index].lastUsed = new Date().toISOString();
        keys[index].updatedAt = new Date().toISOString();
        saveApiKeys(keys);
    }
};

export const deleteApiKey = (userId: string, keyId: string): boolean => {
    const keys = getApiKeys();
    const index = keys.findIndex(k => k.id === keyId && k.userId === userId);
    if (index === -1) return false;

    keys.splice(index, 1);
    saveApiKeys(keys);
    return true;
};

export const toggleApiKey = (userId: string, keyId: string): ApiKey | null => {
    const keys = getApiKeys();
    const index = keys.findIndex(k => k.id === keyId && k.userId === userId);
    if (index === -1) return null;

    keys[index].active = !keys[index].active;
    keys[index].updatedAt = new Date().toISOString();
    saveApiKeys(keys);
    return keys[index];
};

export const createNotification = (data: { userId: string; title: string; message: string; type: Notification['type'] }): Notification => {
    const notifications = getNotifications();

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
    saveNotifications(notifications);
    return notification;
};

export const createMassNotification = (data: { title: string; message: string; type: Notification['type'] }): Notification => {
    return createNotification({ ...data, userId: 'all' });
};

export const getUserNotifications = (userId: string): Notification[] => {
    const notifications = getNotifications();
    return notifications
        .filter(n => n.userId === userId || n.userId === 'all')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getUnreadNotificationCount = (userId: string): number => {
    const notifications = getNotifications();
    return notifications.filter(n =>
        (n.userId === userId || n.userId === 'all') && !n.read
    ).length;
};

export const markNotificationAsRead = (notificationId: string, userId: string): boolean => {
    const notifications = getNotifications();
    const index = notifications.findIndex(n =>
        n.id === notificationId && (n.userId === userId || n.userId === 'all')
    );

    if (index === -1) return false;

    notifications[index].read = true;
    saveNotifications(notifications);
    return true;
};

export const markAllNotificationsAsRead = (userId: string): void => {
    const notifications = getNotifications();
    notifications.forEach(n => {
        if (n.userId === userId || n.userId === 'all') {
            n.read = true;
        }
    });
    saveNotifications(notifications);
};

export const deleteNotification = (notificationId: string): boolean => {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return false;

    notifications.splice(index, 1);
    saveNotifications(notifications);
    return true;
};

export const getAllNotifications = (): Notification[] => {
    const notifications = getNotifications();
    return notifications.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

const generateAffiliateCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const getUserAffiliateCode = (userId: string): string => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return '';

    if (!user.affiliateCode) {
        const code = generateAffiliateCode();
        const index = users.findIndex(u => u.id === userId);
        users[index].affiliateCode = code;
        saveUsers(users);
        return code;
    }

    return user.affiliateCode;
};

export const findUserByAffiliateCode = (code: string): User | undefined => {
    const users = getUsers();
    return users.find(u => u.affiliateCode === code.toUpperCase());
};

export const createAffiliateRelation = (referrerId: string, referredId: string, referredEmail: string): Affiliate | null => {
    const affiliates = getAffiliates();

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
    saveAffiliates(affiliates);
    return affiliate;
};

export const getAffiliatesByReferrer = (referrerId: string): Affiliate[] => {
    const affiliates = getAffiliates();
    return affiliates.filter(a => a.referrerId === referrerId);
};

export const updateAffiliateRecharge = (referredId: string, amount: number): void => {
    const affiliates = getAffiliates();
    const index = affiliates.findIndex(a => a.referredId === referredId);
    if (index === -1) return;

    const affiliate = affiliates[index];

    if (amount >= 5 && !affiliate.hasRecharged) {
        affiliates[index].hasRecharged = true;
        affiliates[index].rechargeAmount = amount;
        affiliates[index].updatedAt = new Date().toISOString();
        saveAffiliates(affiliates);

        checkAndPayAffiliateReward(affiliate.referrerId);
    }
};

export const checkAndPayAffiliateReward = (referrerId: string): boolean => {
    const affiliates = getAffiliates();

    const qualifiedAffiliates = affiliates.filter(a =>
        a.referrerId === referrerId &&
        a.hasRecharged &&
        !a.rewardPaid
    );

    if (qualifiedAffiliates.length >= 3) {
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
        saveAffiliates(affiliates);

        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === referrerId);
        if (userIndex !== -1) {
            users[userIndex].balance += 5;
            users[userIndex].updatedAt = new Date().toISOString();
            saveUsers(users);

            createNotification({
                userId: referrerId,
                title: '🎉 Bônus de Afiliado!',
                message: 'Parabéns! Você ganhou R$5,00 por indicar 3 amigos que recarregaram!',
                type: 'SUCCESS'
            });

            const transactions = getTransactions();
            transactions.push({
                id: `trans_aff_${Date.now()}`,
                userId: referrerId,
                type: 'DEPOSIT',
                description: 'Bônus de Afiliado - 3 indicações',
                amount: 5,
                date: new Date().toISOString(),
                status: 'COMPLETED'
            });
            saveTransactions(transactions);
        }

        return true;
    }

    return false;
};

export const getAffiliateStats = (referrerId: string): {
    totalInvites: number;
    rechargedCount: number;
    pendingReward: number;
    totalEarned: number;
} => {
    const affiliates = getAffiliates();
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

export const getAllUsersAdmin = (): User[] => {
    const users = getUsers();
    return users.map(u => ({ ...u, password: undefined }));
};

export const searchUsers = (query: string): User[] => {
    const users = getUsers();
    const lowerQuery = query.toLowerCase();
    return users
        .filter(u =>
            u.name.toLowerCase().includes(lowerQuery) ||
            u.email.toLowerCase().includes(lowerQuery) ||
            u.id.toLowerCase().includes(lowerQuery)
        )
        .map(u => ({ ...u, password: undefined }));
};

export const updateUserBalance = (userId: string, amount: number, type: 'add' | 'remove' | 'set'): User | null => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    const user = users[index];
    let newBalance = user.balance;

    if (type === 'add') {
        newBalance += amount;
    } else if (type === 'remove') {
        newBalance = Math.max(0, newBalance - amount);
    } else {
        newBalance = amount;
    }

    users[index].balance = newBalance;
    users[index].updatedAt = new Date().toISOString();
    saveUsers(users);

    const transactions = getTransactions();
    transactions.push({
        id: `trans_admin_${Date.now()}`,
        userId,
        type: 'DEPOSIT',
        description: type === 'add' ? 'Saldo adicionado pelo admin' :
            type === 'remove' ? 'Saldo removido pelo admin' :
                'Saldo definido pelo admin',
        amount: type === 'remove' ? -amount : amount,
        date: new Date().toISOString(),
        status: 'COMPLETED'
    });
    saveTransactions(transactions);

    return { ...users[index], password: undefined };
};

export const banUser = (userId: string, banned: boolean): User | null => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    users[index].banned = banned;
    users[index].updatedAt = new Date().toISOString();
    saveUsers(users);

    return { ...users[index], password: undefined };
};

export const isUserBanned = (userId: string): boolean => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    return user ? user.banned === true : false;
};

export const deleteUser = (userId: string): boolean => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;

    users.splice(index, 1);
    saveUsers(users);
    return true;
};

export interface CustomDiscountData {
    type: 'PERCENT' | 'FIXED';
    value: number;
    expiresAt?: string;
    appliesTo?: string[];
}

export const setUserCustomDiscount = (
    userId: string,
    discount: CustomDiscountData,
    adminEmail: string
): User | null => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    users[index].customDiscount = {
        type: discount.type,
        value: discount.value,
        expiresAt: discount.expiresAt,
        appliesTo: discount.appliesTo,
        setBy: adminEmail,
        setAt: new Date().toISOString()
    };
    users[index].updatedAt = new Date().toISOString();
    saveUsers(users);

    createNotification({
        userId: users[index].id,
        title: '🎁 Desconto Especial!',
        message: discount.type === 'PERCENT'
            ? `Você recebeu ${discount.value}% de desconto em suas compras!`
            : `Você recebeu R$ ${discount.value.toFixed(2)} de desconto em suas compras!`,
        type: 'PROMO'
    });

    return { ...users[index], password: undefined };
};

export const removeUserCustomDiscount = (userId: string): User | null => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return null;

    delete users[index].customDiscount;
    users[index].updatedAt = new Date().toISOString();
    saveUsers(users);

    return { ...users[index], password: undefined };
};

export const getUserCustomDiscount = (userId: string): User['customDiscount'] | null => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user || !user.customDiscount) return null;

    if (user.customDiscount.expiresAt) {
        const expiresAt = new Date(user.customDiscount.expiresAt);
        if (expiresAt < new Date()) {

            removeUserCustomDiscount(userId);
            return null;
        }
    }

    return user.customDiscount;
};

export const calculateCustomDiscount = (
    userId: string,
    productId: string,
    originalPrice: number
): { discount: number; finalPrice: number; hasDiscount: boolean; discountInfo?: User['customDiscount'] } => {
    const customDiscount = getUserCustomDiscount(userId);

    if (!customDiscount) {
        return { discount: 0, finalPrice: originalPrice, hasDiscount: false };
    }

    if (customDiscount.appliesTo && customDiscount.appliesTo.length > 0) {
        if (!customDiscount.appliesTo.includes(productId)) {
            return { discount: 0, finalPrice: originalPrice, hasDiscount: false };
        }
    }

    let discount = 0;
    if (customDiscount.type === 'PERCENT') {
        discount = (originalPrice * customDiscount.value) / 100;
    } else {
        discount = Math.min(customDiscount.value, originalPrice);
    }

    const finalPrice = Math.max(0, originalPrice - discount);

    return {
        discount,
        finalPrice,
        hasDiscount: true,
        discountInfo: customDiscount
    };
};

export const findUserById = (userId: string): User | undefined => {
    const users = getUsers();
    return users.find(u => u.id === userId);
};

export const getUsersWithCustomDiscount = (): User[] => {
    const users = getUsers();
    return users
        .filter(u => u.customDiscount)
        .map(u => ({ ...u, password: undefined }));
};

export interface GuestAccount {
    id: string;
    uid: string;
    password: string;
    addedAt: string;
    addedBy?: string;
    sold?: boolean;
    soldAt?: string;
    soldTo?: string;
}

const getGuestAccounts = (): GuestAccount[] => {
    try {
        if (!fs.existsSync(guestAccountsPath)) {
            fs.writeFileSync(guestAccountsPath, '[]');
            return [];
        }
        const data = fs.readFileSync(guestAccountsPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

const saveGuestAccounts = (accounts: GuestAccount[]): void => {
    fs.writeFileSync(guestAccountsPath, JSON.stringify(accounts, null, 2));
};

export const addGuestAccounts = (accountsText: string, adminEmail?: string): { added: number; errors: string[] } => {
    const accounts = getGuestAccounts();
    const lines = accountsText.split('\n').filter(line => line.trim());
    let added = 0;
    const errors: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split(':');
        if (parts.length !== 2) {
            errors.push(`Formato inválido: ${trimmed} (use UID:PASSWORD)`);
            continue;
        }

        const [uid, password] = parts;
        if (!uid || !password) {
            errors.push(`UID ou PASSWORD vazio: ${trimmed}`);
            continue;
        }

        const exists = accounts.find(a => a.uid === uid && !a.sold);
        if (exists) {
            errors.push(`UID já existe no estoque: ${uid}`);
            continue;
        }

        accounts.push({
            id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            uid: uid.trim(),
            password: password.trim(),
            addedAt: new Date().toISOString(),
            addedBy: adminEmail,
            sold: false
        });
        added++;
    }

    saveGuestAccounts(accounts);

    updateGuestProductStock();

    return { added, errors };
};

export const getAvailableGuestAccounts = (): GuestAccount[] => {
    const accounts = getGuestAccounts();
    return accounts.filter(a => !a.sold);
};

export const getAllGuestAccounts = (): GuestAccount[] => {
    return getGuestAccounts();
};

export const getGuestAccountForSale = (userId: string): GuestAccount | null => {
    const accounts = getGuestAccounts();
    const available = accounts.find(a => !a.sold);

    if (!available) return null;

    const index = accounts.findIndex(a => a.id === available.id);
    accounts[index].sold = true;
    accounts[index].soldAt = new Date().toISOString();
    accounts[index].soldTo = userId;

    saveGuestAccounts(accounts);

    updateGuestProductStock();

    return accounts[index];
};

export const updateGuestProductStock = (): void => {
    const available = getAvailableGuestAccounts();
    const products = getProducts();
    const index = products.findIndex(p => p.id === 'nivel-15-troca-nick');

    if (index !== -1) {
        products[index].stock = available.length;
        products[index].updatedAt = new Date().toISOString();
        saveProducts(products);
    }
};

export const deleteGuestAccount = (accountId: string): boolean => {
    const accounts = getGuestAccounts();
    const index = accounts.findIndex(a => a.id === accountId);

    if (index === -1) return false;

    accounts.splice(index, 1);
    saveGuestAccounts(accounts);
    updateGuestProductStock();

    return true;
};

export const CHEAT_PLAN_PRICES: Record<string, number> = {
    'daily': 8.00,
    'weekly': 12.00,
    'biweekly': 28.00,
    'monthly': 40.00
};

export const CHEAT_PLAN_NAMES: Record<string, string> = {
    'daily': 'Diário (1 dia)',
    'weekly': 'Semanal (7 dias)',
    'biweekly': 'Quinzenal (15 dias)',
    'monthly': 'Mensal (30 dias)'
};

export const addCheatKeys = (keysText: string, planType: 'daily' | 'weekly' | 'biweekly' | 'monthly', adminEmail?: string): { added: number; errors: string[] } => {
    const keys = getCheatKeys();
    const lines = keysText.split('\n').filter(line => line.trim());
    let added = 0;
    const errors: string[] = [];

    for (const line of lines) {
        const key = line.trim();
        if (!key) continue;

        const exists = keys.find(k => k.key === key && !k.sold);
        if (exists) {
            errors.push(`Key já existe no estoque: ${key}`);
            continue;
        }

        keys.push({
            id: `cheat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            key: key,
            planType: planType,
            addedAt: new Date().toISOString(),
            addedBy: adminEmail,
            sold: false
        });
        added++;
    }

    saveCheatKeys(keys);

    syncCheatProductStock();

    return { added, errors };
};

export const getAvailableCheatKeys = (planType?: 'daily' | 'weekly' | 'biweekly' | 'monthly'): CheatKey[] => {
    const keys = getCheatKeys();
    if (planType) {
        return keys.filter(k => !k.sold && k.planType === planType);
    }
    return keys.filter(k => !k.sold);
};

export const getAllCheatKeys = (): CheatKey[] => {
    return getCheatKeys();
};

export const getCheatKeyForSale = (userId: string, planType: 'daily' | 'weekly' | 'biweekly' | 'monthly'): CheatKey | null => {
    const keys = getCheatKeys();
    const available = keys.find(k => !k.sold && k.planType === planType);

    if (!available) return null;

    const index = keys.findIndex(k => k.id === available.id);
    keys[index].sold = true;
    keys[index].soldAt = new Date().toISOString();
    keys[index].soldTo = userId;

    saveCheatKeys(keys);

    syncCheatProductStock();

    return keys[index];
};

export const getCheatKeyStock = (): Record<string, number> => getCheatStockByPlan();

export const getCheatStockByPlan = (): Record<string, number> => {
    const keys = getCheatKeys();
    const stock: Record<string, number> = {
        'daily': 0,
        'weekly': 0,
        'biweekly': 0,
        'monthly': 0
    };

    keys.forEach(k => {
        if (!k.sold && stock[k.planType] !== undefined) {
            stock[k.planType]++;
        }
    });

    return stock;
};

export const syncCheatProductStock = (): void => {
    const stock = getCheatStockByPlan();
    const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
    const products = getProducts();
    const index = products.findIndex(p => p.id === 'cheat-external');

    if (index !== -1) {
        products[index].stock = totalStock;
        products[index].updatedAt = new Date().toISOString();
        saveProducts(products);
    }
};

export const deleteCheatKey = (keyId: string): boolean => {
    const keys = getCheatKeys();
    const index = keys.findIndex(k => k.id === keyId);

    if (index === -1) return false;

    keys.splice(index, 1);
    saveCheatKeys(keys);
    syncCheatProductStock();

    return true;
};

export const getCheatKeyStats = (): {
    total: number;
    available: number;
    sold: number;
    byPlan: Record<string, { available: number; sold: number }>;
} => {
    const keys = getCheatKeys();
    const stats = {
        total: keys.length,
        available: keys.filter(k => !k.sold).length,
        sold: keys.filter(k => k.sold).length,
        byPlan: {
            'daily': { available: 0, sold: 0 },
            'weekly': { available: 0, sold: 0 },
            'biweekly': { available: 0, sold: 0 },
            'monthly': { available: 0, sold: 0 }
        }
    };

    keys.forEach(k => {
        if (stats.byPlan[k.planType]) {
            if (k.sold) {
                stats.byPlan[k.planType].sold++;
            } else {
                stats.byPlan[k.planType].available++;
            }
        }
    });

    return stats;
};

export interface VisitData {
    id: string;
    userId?: string;
    ip?: string;
    country?: string;
    region?: string;
    city?: string;
    state?: string;
    page: string;
    userAgent?: string;
    timestamp: string;
}

export interface PurchaseAnalytics {
    id: string;
    userId: string;
    productId: string;
    productName: string;
    amount: number;
    country?: string;
    region?: string;
    city?: string;
    state?: string;
    timestamp: string;
}

interface AnalyticsData {
    visits: VisitData[];
    purchases: PurchaseAnalytics[];
}

const getAnalytics = (): AnalyticsData => {
    try {
        ensureDbsDir();
        if (!fs.existsSync(analyticsPath)) {
            const defaultData = { visits: [], purchases: [] };
            fs.writeFileSync(analyticsPath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const content = fs.readFileSync(analyticsPath, 'utf-8');
        const data = JSON.parse(content);

        if (!data.visits) data.visits = [];
        if (!data.purchases) data.purchases = [];
        return data;
    } catch (error) {
        console.error('[Analytics] Erro ao ler analytics:', error);
        return { visits: [], purchases: [] };
    }
};

const saveAnalytics = (data: AnalyticsData): void => {
    try {
        ensureDbsDir();
        fs.writeFileSync(analyticsPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('[Analytics] Erro ao salvar analytics:', error);
    }
};

export const recordVisit = (visit: Omit<VisitData, 'id' | 'timestamp'>): void => {
    const data = getAnalytics();
    const newVisit = {
        ...visit,
        id: `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
    };
    data.visits.push(newVisit);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    data.visits = data.visits.filter(v => new Date(v.timestamp) > thirtyDaysAgo);

    saveAnalytics(data);
};

export const recordPurchaseLocation = (purchase: Omit<PurchaseAnalytics, 'id' | 'timestamp'>): void => {
    const data = getAnalytics();
    data.purchases.push({
        ...purchase,
        id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
    });
    saveAnalytics(data);
};

export const getAnalyticsData = (): AnalyticsData => {
    return getAnalytics();
};

export const getVisitsByState = (): { state: string; count: number }[] => {
    const data = getAnalytics();
    const stateCount: Record<string, number> = {};

    data.visits.forEach(v => {
        if (v.state) {
            stateCount[v.state] = (stateCount[v.state] || 0) + 1;
        }
    });

    return Object.entries(stateCount)
        .map(([state, count]) => ({ state, count }))
        .sort((a, b) => b.count - a.count);
};

export const getVisitsByCity = (): { city: string; state: string; count: number }[] => {
    const data = getAnalytics();
    const cityCount: Record<string, { city: string; state: string; count: number }> = {};

    data.visits.forEach(v => {
        if (v.city && v.state) {
            const key = `${v.city}-${v.state}`;
            if (!cityCount[key]) {
                cityCount[key] = { city: v.city, state: v.state, count: 0 };
            }
            cityCount[key].count++;
        }
    });

    return Object.values(cityCount).sort((a, b) => b.count - a.count);
};

export const getPurchasesByState = (): { state: string; count: number; total: number }[] => {
    const data = getAnalytics();
    const stateData: Record<string, { count: number; total: number }> = {};

    data.purchases.forEach(p => {
        if (p.state) {
            if (!stateData[p.state]) {
                stateData[p.state] = { count: 0, total: 0 };
            }
            stateData[p.state].count++;
            stateData[p.state].total += p.amount;
        }
    });

    return Object.entries(stateData)
        .map(([state, data]) => ({ state, ...data }))
        .sort((a, b) => b.count - a.count);
};

export const getPurchasesByCity = (): { city: string; state: string; count: number; total: number }[] => {
    const data = getAnalytics();
    const cityData: Record<string, { city: string; state: string; count: number; total: number }> = {};

    data.purchases.forEach(p => {
        if (p.city && p.state) {
            const key = `${p.city}-${p.state}`;
            if (!cityData[key]) {
                cityData[key] = { city: p.city, state: p.state, count: 0, total: 0 };
            }
            cityData[key].count++;
            cityData[key].total += p.amount;
        }
    });

    return Object.values(cityData).sort((a, b) => b.count - a.count);
};

export const getAnalyticsSummary = () => {
    const data = getAnalytics();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const visitsToday = data.visits.filter(v => new Date(v.timestamp) >= today).length;
    const visitsWeek = data.visits.filter(v => new Date(v.timestamp) >= weekAgo).length;
    const purchasesToday = data.purchases.filter(p => new Date(p.timestamp) >= today).length;
    const purchasesWeek = data.purchases.filter(p => new Date(p.timestamp) >= weekAgo).length;

    const revenueToday = data.purchases
        .filter(p => new Date(p.timestamp) >= today)
        .reduce((sum, p) => sum + p.amount, 0);
    const revenueWeek = data.purchases
        .filter(p => new Date(p.timestamp) >= weekAgo)
        .reduce((sum, p) => sum + p.amount, 0);

    return {
        visitsToday,
        visitsWeek,
        visitsTotal: data.visits.length,
        purchasesToday,
        purchasesWeek,
        purchasesTotal: data.purchases.length,
        revenueToday,
        revenueWeek
    };
};

export const MODAPK_PLAN_PRICES: Record<string, number> = {
    'daily': 12.00,
    'weekly': 999.00,
    'biweekly': 999.00,
    'monthly': 999.00
};

export const MODAPK_PLAN_NAMES: Record<string, string> = {
    'daily': 'Diário (1 dia)',
    'weekly': 'Semanal (7 dias)',
    'biweekly': 'Quinzenal (15 dias)',
    'monthly': 'Mensal (30 dias)'
};

export const addModApkKeys = (keysText: string, planType: 'daily' | 'weekly' | 'biweekly' | 'monthly', adminEmail?: string): { added: number; errors: string[] } => {
    const keys = getModApkKeys();
    const lines = keysText.split('\n').filter(line => line.trim());
    let added = 0;
    const errors: string[] = [];

    for (const line of lines) {
        const key = line.trim();
        if (!key) continue;

        const exists = keys.find(k => k.key === key && !k.sold);
        if (exists) {
            errors.push(`Key já existe no estoque: ${key}`);
            continue;
        }

        keys.push({
            id: `modapk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            key: key,
            planType: planType,
            addedAt: new Date().toISOString(),
            addedBy: adminEmail,
            sold: false
        });
        added++;
    }

    saveModApkKeys(keys);

    syncModApkProductStock();

    return { added, errors };
};

export const getAvailableModApkKeys = (planType?: 'daily' | 'weekly' | 'biweekly' | 'monthly'): ModApkKey[] => {
    const keys = getModApkKeys();
    if (planType) {
        return keys.filter(k => !k.sold && k.planType === planType);
    }
    return keys.filter(k => !k.sold);
};

export const getAllModApkKeys = (): ModApkKey[] => {
    return getModApkKeys();
};

export const getModApkKeyForSale = (userId: string, planType: 'daily' | 'weekly' | 'biweekly' | 'monthly'): ModApkKey | null => {
    const keys = getModApkKeys();
    const available = keys.find(k => !k.sold && k.planType === planType);

    if (!available) return null;

    const index = keys.findIndex(k => k.id === available.id);
    keys[index].sold = true;
    keys[index].soldAt = new Date().toISOString();
    keys[index].soldTo = userId;

    saveModApkKeys(keys);

    syncModApkProductStock();

    return keys[index];
};

export const getModApkKeyStock = (): Record<string, number> => getModApkStockByPlan();

export const getModApkStockByPlan = (): Record<string, number> => {
    const keys = getModApkKeys();
    const stock: Record<string, number> = {
        'daily': 0,
        'weekly': 0,
        'biweekly': 0,
        'monthly': 0
    };

    keys.forEach(k => {
        if (!k.sold && stock[k.planType] !== undefined) {
            stock[k.planType]++;
        }
    });

    return stock;
};

export const syncModApkProductStock = (): void => {
    const stock = getModApkStockByPlan();
    const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
    const products = getProducts();
    const index = products.findIndex(p => p.id === 'modapk-android');

    if (index !== -1) {
        products[index].stock = totalStock;
        products[index].updatedAt = new Date().toISOString();
        saveProducts(products);
    }
};

export const deleteModApkKey = (keyId: string): boolean => {
    const keys = getModApkKeys();
    const index = keys.findIndex(k => k.id === keyId);

    if (index === -1) return false;

    keys.splice(index, 1);
    saveModApkKeys(keys);
    syncModApkProductStock();

    return true;
};

export const getModApkKeyStats = (): {
    total: number;
    available: number;
    sold: number;
    byPlan: Record<string, { available: number; sold: number }>;
} => {
    const keys = getModApkKeys();
    const stats = {
        total: keys.length,
        available: keys.filter(k => !k.sold).length,
        sold: keys.filter(k => k.sold).length,
        byPlan: {
            'daily': { available: 0, sold: 0 },
            'weekly': { available: 0, sold: 0 },
            'biweekly': { available: 0, sold: 0 },
            'monthly': { available: 0, sold: 0 }
        }
    };

    keys.forEach(k => {
        if (stats.byPlan[k.planType]) {
            if (k.sold) {
                stats.byPlan[k.planType].sold++;
            } else {
                stats.byPlan[k.planType].available++;
            }
        }
    });

    return stats;
};

const diamondStockPath = path.join(dbsDir, 'diamond_stock.json');
const diamondUsagePath = path.join(dbsDir, 'diamond_usage.json');

export interface DiamondStock {
    stock: Record<string, number>;
    lastUpdate: string;
}

export interface DiamondUsage {
    uid: string;
    amount: number;
    usedAt: string;
}

export const DIAMOND_PACKAGES = [
    { amount: 200, price: 9.00 },
    { amount: 620, price: 20.00 },
    { amount: 1040, price: 30.00 },
    { amount: 2120, price: 58.00 },
    { amount: 4360, price: 108.00 },
    { amount: 5300, price: 153.00 },
    { amount: 11200, price: 265.00 },
    { amount: 22400, price: 620.00 },
];

export const getDiamondStockData = (): DiamondStock => {
    return readJsonFile<DiamondStock>(diamondStockPath, {
        stock: {
            '200': 0,
            '620': 0,
            '1040': 0,
            '2120': 0,
            '4360': 0,
            '5300': 0,
            '11200': 0,
            '22400': 0
        },
        lastUpdate: new Date().toISOString()
    });
};

export const saveDiamondStockData = (data: DiamondStock): void => {
    writeJsonFile(diamondStockPath, data);
};

export const getDiamondStock = (): Record<string, number> => {
    const data = getDiamondStockData();
    return data.stock;
};

export const getDiamondStockLastUpdate = (): string => {
    const data = getDiamondStockData();
    return data.lastUpdate;
};

export const updateDiamondStock = (amount: number, delta: number): void => {
    const data = getDiamondStockData();
    const key = amount.toString();

    if (data.stock[key] !== undefined) {
        data.stock[key] = Math.max(0, (data.stock[key] || 0) + delta);
    }

    data.lastUpdate = new Date().toISOString();
    saveDiamondStockData(data);
};

export const setDiamondStock = (amount: number, quantity: number): void => {
    const data = getDiamondStockData();
    const key = amount.toString();
    data.stock[key] = Math.max(0, quantity);
    data.lastUpdate = new Date().toISOString();
    saveDiamondStockData(data);
};

export const setFullDiamondStock = (stock: Record<string, number>): void => {
    const data = getDiamondStockData();
    data.stock = stock;
    data.lastUpdate = new Date().toISOString();
    saveDiamondStockData(data);
};

export const getDiamondUsage = (): DiamondUsage[] => {
    return readJsonFile<DiamondUsage[]>(diamondUsagePath, []);
};

export const saveDiamondUsage = (usage: DiamondUsage[]): void => {
    writeJsonFile(diamondUsagePath, usage);
};

export const checkDiamondPackageUsed = (uid: string, amount: number): boolean => {
    const usage = getDiamondUsage();
    return usage.some(u => u.uid === uid && u.amount === amount);
};

export const recordDiamondPackageUsed = (uid: string, amount: number): void => {
    const usage = getDiamondUsage();

    if (usage.some(u => u.uid === uid && u.amount === amount)) {
        return;
    }

    usage.push({
        uid,
        amount,
        usedAt: new Date().toISOString()
    });

    saveDiamondUsage(usage);
};

export const getDiamondUsageByUid = (uid: string): DiamondUsage[] => {
    const usage = getDiamondUsage();
    return usage.filter(u => u.uid === uid);
};

export const getDiamondPackagePrice = (amount: number): number => {
    const pkg = DIAMOND_PACKAGES.find(p => p.amount === amount);
    return pkg ? pkg.price : 0;
};

export const syncDiamondProductStock = (): void => {
    const stock = getDiamondStock();
    const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
    const products = getProducts();
    const index = products.findIndex(p => p.type === 'DIAMONDS');

    if (index !== -1) {
        products[index].stock = totalStock;
        products[index].updatedAt = new Date().toISOString();
        saveProducts(products);
    }
};

export type StreamingPlatform = 'hbomax' | 'primevideo' | 'crunchyroll' | 'paramount' | 'canvapro' | 'disney';

export const STREAMING_PRODUCTS: Record<StreamingPlatform, { id: string; name: string; icon: string }> = {
    'hbomax': { id: 'hbomax', name: 'HBO Max', icon: '🎬' },
    'primevideo': { id: 'primevideo', name: 'Prime Video', icon: '📺' },
    'crunchyroll': { id: 'crunchyroll', name: 'Crunchyroll', icon: '🍥' },
    'paramount': { id: 'paramount', name: 'Paramount+', icon: '⛰️' },
    'canvapro': { id: 'canvapro', name: 'Canva Pro', icon: '🎨' },
    'disney': { id: 'disney', name: 'Disney+', icon: '🏰' }
};

export const STREAMING_PRICES: Record<StreamingPlatform, number> = {
    'hbomax': parseFloat(process.env.STREAMING_PRICE_HBOMAX || '15.00'),
    'primevideo': parseFloat(process.env.STREAMING_PRICE_PRIMEVIDEO || '12.00'),
    'crunchyroll': parseFloat(process.env.STREAMING_PRICE_CRUNCHYROLL || '10.00'),
    'paramount': parseFloat(process.env.STREAMING_PRICE_PARAMOUNT || '12.00'),
    'canvapro': parseFloat(process.env.STREAMING_PRICE_CANVAPRO || '8.00'),
    'disney': parseFloat(process.env.STREAMING_PRICE_DISNEY || '15.00')
};

export const addStreamingKeys = (keysText: string, platform: StreamingPlatform, adminEmail?: string): { added: number; errors: string[] } => {
    const keys = getStreamingKeys();
    const lines = keysText.split('\n').filter(line => line.trim());
    let added = 0;
    const errors: string[] = [];

    for (const line of lines) {
        const key = line.trim();
        if (!key) continue;

        const exists = keys.find(k => k.key === key && !k.sold);
        if (exists) {
            errors.push(`Key já existe no estoque: ${key}`);
            continue;
        }

        keys.push({
            id: `streaming_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            key: key,
            platform: platform,
            addedAt: new Date().toISOString(),
            addedBy: adminEmail,
            sold: false
        });
        added++;
    }

    saveStreamingKeys(keys);

    syncStreamingProductStock();

    return { added, errors };
};

export const getAvailableStreamingKeys = (platform?: StreamingPlatform): StreamingKey[] => {
    const keys = getStreamingKeys();
    if (platform) {
        return keys.filter(k => !k.sold && k.platform === platform);
    }
    return keys.filter(k => !k.sold);
};

export const getAllStreamingKeys = (): StreamingKey[] => {
    return getStreamingKeys();
};

export const getStreamingKeyForSale = (userId: string, platform: StreamingPlatform): StreamingKey | null => {
    const keys = getStreamingKeys();
    const available = keys.find(k => !k.sold && k.platform === platform);

    if (!available) return null;

    const index = keys.findIndex(k => k.id === available.id);
    keys[index].sold = true;
    keys[index].soldAt = new Date().toISOString();
    keys[index].soldTo = userId;

    saveStreamingKeys(keys);

    syncStreamingProductStock();

    return keys[index];
};

export const getStreamingKeyStock = (): Record<StreamingPlatform, number> => getStreamingStockByPlatform();

export const getStreamingStockByPlatform = (): Record<StreamingPlatform, number> => {
    const keys = getStreamingKeys();
    const stock: Record<StreamingPlatform, number> = {
        'hbomax': 0,
        'primevideo': 0,
        'crunchyroll': 0,
        'paramount': 0,
        'canvapro': 0,
        'disney': 0
    };

    keys.forEach(k => {
        if (!k.sold && stock[k.platform] !== undefined) {
            stock[k.platform]++;
        }
    });

    return stock;
};

export const syncStreamingProductStock = (): void => {
    const stock = getStreamingStockByPlatform();
    const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);
    const products = getProducts();
    const index = products.findIndex(p => p.id === 'streamings' || p.type === 'STREAMING');

    if (index !== -1) {
        products[index].stock = totalStock;
        products[index].updatedAt = new Date().toISOString();
        saveProducts(products);
    }
};

export const deleteStreamingKey = (keyId: string): boolean => {
    const keys = getStreamingKeys();
    const index = keys.findIndex(k => k.id === keyId);

    if (index === -1) return false;

    keys.splice(index, 1);
    saveStreamingKeys(keys);
    syncStreamingProductStock();

    return true;
};

export const getStreamingKeyStats = (): {
    total: number;
    available: number;
    sold: number;
    byPlatform: Record<StreamingPlatform, { available: number; sold: number }>;
} => {
    const keys = getStreamingKeys();
    const stats = {
        total: keys.length,
        available: keys.filter(k => !k.sold).length,
        sold: keys.filter(k => k.sold).length,
        byPlatform: {
            'hbomax': { available: 0, sold: 0 },
            'primevideo': { available: 0, sold: 0 },
            'crunchyroll': { available: 0, sold: 0 },
            'paramount': { available: 0, sold: 0 },
            'canvapro': { available: 0, sold: 0 },
            'disney': { available: 0, sold: 0 }
        } as Record<StreamingPlatform, { available: number; sold: number }>
    };

    keys.forEach(k => {
        if (stats.byPlatform[k.platform]) {
            if (k.sold) {
                stats.byPlatform[k.platform].sold++;
            } else {
                stats.byPlatform[k.platform].available++;
            }
        }
    });

    return stats;
};
